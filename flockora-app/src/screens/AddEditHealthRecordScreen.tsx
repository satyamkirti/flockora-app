import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import {
  AppScreen,
  AppText,
  PrimaryButton,
  IconButton,
  FormField,
  SelectableCard,
  BirdPickerModal,
  FlockManagerModal,
  FadeInUp,
} from '../components';
import { useHealthRecord, useBirds, useFlocks } from '../hooks';
import { healthRecordRepository } from '../db/repositories';
import { syncHealthReminder } from '../services/notificationService';
import { healthRecordTypeOptions } from '../data/healthRecordTypes';
import { HealthRecordInput, createEmptyHealthRecordInput } from '../types/healthRecord';
import { FlockStackParamList } from '../navigation/flockTypes';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<FlockStackParamList, 'AddEditHealthRecord'>;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{1,2}:\d{2}$/;

export function AddEditHealthRecordScreen({ route, navigation }: Props) {
  const { birdId: routeBirdId, flockId: routeFlockId, recordId } = route.params;
  const isEditing = recordId != null;
  const db = useSQLiteContext();
  const { record: existingRecord, loading: loadingRecord } = useHealthRecord(recordId);
  const { birds } = useBirds();
  const { flocks, refresh: refreshFlocks } = useFlocks();

  const [form, setForm] = useState<HealthRecordInput>(
    createEmptyHealthRecordInput(routeBirdId ?? null)
  );
  const [costText, setCostText] = useState('');
  const [timeText, setTimeText] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDateText, setReminderDateText] = useState('');
  const [birdModalVisible, setBirdModalVisible] = useState(false);
  const [flockModalVisible, setFlockModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(!isEditing);

  useEffect(() => {
    if (!isEditing && routeFlockId != null) {
      setForm((current) => ({ ...current, flockId: routeFlockId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isEditing && existingRecord && !hydrated) {
      setForm({
        birdId: existingRecord.birdId,
        flockId: existingRecord.flockId,
        type: existingRecord.type,
        title: existingRecord.title,
        notes: existingRecord.notes,
        medicine: existingRecord.medicine,
        dosage: existingRecord.dosage,
        startDate: existingRecord.startDate,
        endDate: existingRecord.endDate,
        time: existingRecord.time,
        veterinarian: existingRecord.veterinarian,
        cost: existingRecord.cost,
        reminderDate: existingRecord.reminderDate,
        status: existingRecord.status,
      });
      setCostText(existingRecord.cost != null ? String(existingRecord.cost) : '');
      setTimeText(existingRecord.time ?? '');
      setReminderEnabled(Boolean(existingRecord.reminderDate));
      setReminderDateText(existingRecord.reminderDate ? existingRecord.reminderDate.slice(0, 10) : '');
      setHydrated(true);
    }
  }, [isEditing, existingRecord, hydrated]);

  const update = (patch: Partial<HealthRecordInput>) => setForm((current) => ({ ...current, ...patch }));

  const birdName = birds.find((bird) => bird.id === form.birdId)?.name ?? 'No Bird';
  const flockName = flocks.find((flock) => flock.id === form.flockId)?.name ?? 'No Flock';

  const handleSave = async () => {
    if (form.birdId == null && form.flockId == null) {
      Alert.alert('Bird or flock required', 'Please select a bird or a flock for this care record.');
      return;
    }
    if (!form.title.trim()) {
      Alert.alert('Title required', 'Please describe the reason for this care record.');
      return;
    }

    if (timeText.trim() && !TIME_PATTERN.test(timeText.trim())) {
      Alert.alert('Invalid time', 'Please use HH:MM for the time.');
      return;
    }

    let reminderDate: string | null = null;
    if (reminderEnabled) {
      if (!DATE_PATTERN.test(reminderDateText.trim())) {
        Alert.alert('Invalid reminder date', 'Please use YYYY-MM-DD for the reminder date.');
        return;
      }
      const parsed = new Date(`${reminderDateText.trim()}T09:00:00`);
      if (Number.isNaN(parsed.getTime())) {
        Alert.alert('Invalid reminder date', 'Please use YYYY-MM-DD for the reminder date.');
        return;
      }
      reminderDate = parsed.toISOString();
    }

    const parsedCost = costText.trim() === '' ? null : Number(costText);

    const payload: HealthRecordInput = {
      ...form,
      title: form.title.trim(),
      notes: form.notes?.trim() || null,
      medicine: form.medicine?.trim() || null,
      dosage: form.dosage?.trim() || null,
      startDate: form.startDate?.trim() || null,
      endDate: form.endDate?.trim() || null,
      time: timeText.trim() || null,
      veterinarian: form.veterinarian?.trim() || null,
      cost: parsedCost != null && !Number.isNaN(parsedCost) ? parsedCost : null,
      reminderDate,
    };

    setSaving(true);
    try {
      if (isEditing && recordId != null) {
        const updated = await healthRecordRepository.updateHealthRecord(db, recordId, payload);
        const notificationId = await syncHealthReminder(updated, existingRecord?.notificationId ?? null);
        await healthRecordRepository.setNotificationId(db, recordId, notificationId);
        navigation.goBack();
      } else {
        const created = await healthRecordRepository.createHealthRecord(db, payload);
        const notificationId = await syncHealthReminder(created, null);
        if (notificationId) {
          await healthRecordRepository.setNotificationId(db, created.id, notificationId);
        }
        navigation.replace('HealthRecordDetail', { recordId: created.id });
      }
    } catch (error) {
      Alert.alert('Something went wrong', 'Could not save this care record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (isEditing && loadingRecord && !hydrated) {
    return (
      <AppScreen>
        <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <View style={styles.headerRow}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
        <AppText variant="sectionTitle">{isEditing ? 'Edit Care Record' : 'Add Care Record'}</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={16}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <FadeInUp style={styles.fieldBlock}>
            <AppText variant="cardTitle" style={styles.label}>
              Care Type
            </AppText>
            <View style={styles.typeGrid}>
              {healthRecordTypeOptions.map((option) => (
                <View key={option.key} style={styles.typeItem}>
                  <SelectableCard
                    icon={option.icon}
                    label={option.label}
                    selected={form.type === option.key}
                    onPress={() => update({ type: option.key })}
                  />
                </View>
              ))}
            </View>
          </FadeInUp>

          <View style={styles.fieldBlock}>
            <AppText variant="cardTitle" style={styles.label}>
              Bird
            </AppText>
            <Pressable style={styles.pickerField} onPress={() => setBirdModalVisible(true)}>
              <AppText variant="body">{birdName}</AppText>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </Pressable>
          </View>

          <View style={styles.fieldBlock}>
            <AppText variant="cardTitle" style={styles.label}>
              Flock
            </AppText>
            <Pressable style={styles.pickerField} onPress={() => setFlockModalVisible(true)}>
              <AppText variant="body">{flockName}</AppText>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </Pressable>
          </View>

          <FormField
            label="Reason"
            value={form.title}
            onChangeText={(text) => update({ title: text })}
            placeholder="e.g. Respiratory infection"
          />

          <FormField
            label="Medicine"
            optional
            value={form.medicine ?? ''}
            onChangeText={(text) => update({ medicine: text })}
            placeholder="e.g. Amoxicillin"
          />

          <FormField
            label="Dosage"
            optional
            value={form.dosage ?? ''}
            onChangeText={(text) => update({ dosage: text })}
            placeholder="e.g. 5ml twice daily"
          />

          <View style={styles.dateRow}>
            <View style={styles.dateInput}>
              <FormField
                label="Start Date"
                optional
                value={form.startDate ?? ''}
                onChangeText={(text) => update({ startDate: text })}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.timeInput}>
              <FormField label="Time" optional value={timeText} onChangeText={setTimeText} placeholder="HH:MM" />
            </View>
          </View>

          <FormField
            label="End Date"
            optional
            value={form.endDate ?? ''}
            onChangeText={(text) => update({ endDate: text })}
            placeholder="YYYY-MM-DD"
          />

          <FormField
            label="Veterinarian"
            optional
            value={form.veterinarian ?? ''}
            onChangeText={(text) => update({ veterinarian: text })}
            placeholder="e.g. Dr. Patel"
          />

          <FormField
            label="Cost"
            optional
            value={costText}
            onChangeText={setCostText}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />

          <FormField
            label="Notes"
            optional
            multiline
            value={form.notes ?? ''}
            onChangeText={(text) => update({ notes: text })}
            placeholder="Any extra detail worth remembering"
          />

          <View style={styles.notificationRow}>
            <View style={styles.notificationText}>
              <AppText variant="cardTitle">Reminder</AppText>
              <AppText variant="caption" color={colors.secondaryText}>
                Get a local reminder on a chosen date
              </AppText>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: colors.border, true: colors.leafGreen }}
              thumbColor={colors.cardSurface}
            />
          </View>

          {reminderEnabled ? (
            <FormField
              label="Reminder Date"
              value={reminderDateText}
              onChangeText={setReminderDateText}
              placeholder="YYYY-MM-DD"
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <PrimaryButton
        label={saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Care Record'}
        onPress={handleSave}
        style={saving ? styles.disabled : undefined}
      />

      <BirdPickerModal
        visible={birdModalVisible}
        onClose={() => setBirdModalVisible(false)}
        birds={birds}
        selectedBirdId={form.birdId}
        onSelect={(birdId) => update({ birdId })}
      />

      <FlockManagerModal
        visible={flockModalVisible}
        onClose={() => setFlockModalVisible(false)}
        flocks={flocks}
        onChanged={refreshFlocks}
        selectable
        selectedFlockId={form.flockId}
        onSelect={(flockId) => update({ flockId })}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerSpacer: {
    width: 44,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  fieldBlock: {
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.xs,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeItem: {
    width: '31%',
  },
  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateInput: {
    flex: 1,
  },
  timeInput: {
    width: 120,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  notificationText: {
    flex: 1,
    marginRight: spacing.md,
  },
  disabled: {
    opacity: 0.6,
  },
});
