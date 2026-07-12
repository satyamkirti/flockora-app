import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
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
  BirdPickerModal,
  FlockManagerModal,
  FadeInUp,
} from '../components';
import { useEggRecord, useBirds, useFlocks } from '../hooks';
import { eggRecordRepository } from '../db/repositories';
import { EggRecordInput, createEmptyEggRecordInput } from '../types/eggRecord';
import { FlockStackParamList } from '../navigation/flockTypes';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<FlockStackParamList, 'AddEditEggRecord'>;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseCount(text: string): number {
  const value = Number.parseInt(text, 10);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function AddEditEggRecordScreen({ route, navigation }: Props) {
  const { recordId } = route.params;
  const isEditing = recordId != null;
  const db = useSQLiteContext();
  const { record: existingRecord, loading: loadingRecord } = useEggRecord(recordId);
  const { birds } = useBirds();
  const { flocks, refresh: refreshFlocks } = useFlocks();

  const [form, setForm] = useState<EggRecordInput>(createEmptyEggRecordInput());
  const [dateText, setDateText] = useState(form.date);
  const [totalText, setTotalText] = useState('0');
  const [fertileText, setFertileText] = useState('0');
  const [crackedText, setCrackedText] = useState('0');
  const [dirtyText, setDirtyText] = useState('0');
  const [doubleYolkText, setDoubleYolkText] = useState('0');
  const [flockModalVisible, setFlockModalVisible] = useState(false);
  const [birdModalVisible, setBirdModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(!isEditing);

  useEffect(() => {
    if (isEditing && existingRecord && !hydrated) {
      setForm({
        flockId: existingRecord.flockId,
        birdId: existingRecord.birdId,
        date: existingRecord.date,
        totalEggs: existingRecord.totalEggs,
        fertileEggs: existingRecord.fertileEggs,
        crackedEggs: existingRecord.crackedEggs,
        dirtyEggs: existingRecord.dirtyEggs,
        doubleYolkEggs: existingRecord.doubleYolkEggs,
        notes: existingRecord.notes,
      });
      setDateText(existingRecord.date);
      setTotalText(String(existingRecord.totalEggs));
      setFertileText(String(existingRecord.fertileEggs));
      setCrackedText(String(existingRecord.crackedEggs));
      setDirtyText(String(existingRecord.dirtyEggs));
      setDoubleYolkText(String(existingRecord.doubleYolkEggs));
      setHydrated(true);
    }
  }, [isEditing, existingRecord, hydrated]);

  const update = (patch: Partial<EggRecordInput>) => setForm((current) => ({ ...current, ...patch }));

  const flockName = flocks.find((flock) => flock.id === form.flockId)?.name ?? 'No Flock';
  const birdName = birds.find((bird) => bird.id === form.birdId)?.name ?? 'No Bird';

  const handleSave = async () => {
    if (!DATE_PATTERN.test(dateText.trim())) {
      Alert.alert('Invalid date', 'Please use YYYY-MM-DD for the date.');
      return;
    }

    const payload: EggRecordInput = {
      ...form,
      date: dateText.trim(),
      totalEggs: parseCount(totalText),
      fertileEggs: parseCount(fertileText),
      crackedEggs: parseCount(crackedText),
      dirtyEggs: parseCount(dirtyText),
      doubleYolkEggs: parseCount(doubleYolkText),
      notes: form.notes?.trim() || null,
    };

    setSaving(true);
    try {
      if (isEditing && recordId != null) {
        await eggRecordRepository.updateEggRecord(db, recordId, payload);
      } else {
        await eggRecordRepository.addEggRecord(db, payload);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Something went wrong', 'Could not save this egg record. Please try again.');
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
        <AppText variant="sectionTitle">{isEditing ? 'Edit Egg Record' : 'Log Eggs'}</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={16}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <FadeInUp>
            <FormField label="Date" value={dateText} onChangeText={setDateText} placeholder="YYYY-MM-DD" />
          </FadeInUp>

          <View style={styles.fieldBlock}>
            <AppText variant="cardTitle" style={styles.label}>
              Flock
            </AppText>
            <Pressable style={styles.pickerField} onPress={() => setFlockModalVisible(true)}>
              <AppText variant="body">{flockName}</AppText>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </Pressable>
          </View>

          <View style={styles.fieldBlock}>
            <AppText variant="cardTitle" style={styles.label}>
              Bird
            </AppText>
            <Pressable style={styles.pickerField} onPress={() => setBirdModalVisible(true)}>
              <AppText variant="body">{birdName}</AppText>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </Pressable>
          </View>

          <FormField
            label="Total Eggs"
            value={totalText}
            onChangeText={setTotalText}
            placeholder="0"
            keyboardType="number-pad"
          />

          <View style={styles.countRow}>
            <View style={styles.countInput}>
              <FormField
                label="Fertile"
                optional
                value={fertileText}
                onChangeText={setFertileText}
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.countInput}>
              <FormField
                label="Cracked"
                optional
                value={crackedText}
                onChangeText={setCrackedText}
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.countRow}>
            <View style={styles.countInput}>
              <FormField
                label="Dirty"
                optional
                value={dirtyText}
                onChangeText={setDirtyText}
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.countInput}>
              <FormField
                label="Double Yolk"
                optional
                value={doubleYolkText}
                onChangeText={setDoubleYolkText}
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <FormField
            label="Notes"
            optional
            multiline
            value={form.notes ?? ''}
            onChangeText={(text) => update({ notes: text })}
            placeholder="Anything worth remembering about today's collection"
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <PrimaryButton
        label={saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Save Egg Record'}
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
  countRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  countInput: {
    flex: 1,
  },
  disabled: {
    opacity: 0.6,
  },
});
