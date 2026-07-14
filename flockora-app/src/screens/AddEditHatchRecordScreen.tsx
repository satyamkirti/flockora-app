import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import { AppScreen, AppText, PrimaryButton, IconButton, FormField } from '../components';
import { useHatchRecord, useClutch } from '../hooks';
import { breedingRepository } from '../db/repositories';
import { cancelNotification } from '../services/notificationService';
import { HatchRecordInput, createEmptyHatchRecordInput } from '../types/breeding';
import { isValidDateString } from '../utils/formValidation';
import { FlockStackParamList } from '../navigation/flockTypes';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<FlockStackParamList, 'AddEditHatchRecord'>;

function parseCount(text: string): number {
  const value = Number.parseInt(text, 10);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function AddEditHatchRecordScreen({ route, navigation }: Props) {
  const { clutchId } = route.params;
  const db = useSQLiteContext();
  const { clutch, loading: loadingClutch } = useClutch(clutchId);
  const { record: existingRecord, loading: loadingRecord } = useHatchRecord(clutchId);
  const isEditing = existingRecord != null;

  const [form, setForm] = useState<HatchRecordInput>(createEmptyHatchRecordInput(clutchId));
  const [hatchedText, setHatchedText] = useState('0');
  const [failedText, setFailedText] = useState('0');
  const [assistedText, setAssistedText] = useState('0');
  const [hatchDateText, setHatchDateText] = useState(form.hatchDate);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (existingRecord && !hydrated) {
      setForm({
        clutchId,
        hatchedEggs: existingRecord.hatchedEggs,
        failedEggs: existingRecord.failedEggs,
        assistedHatches: existingRecord.assistedHatches,
        hatchDate: existingRecord.hatchDate,
        notes: existingRecord.notes,
      });
      setHatchedText(String(existingRecord.hatchedEggs));
      setFailedText(String(existingRecord.failedEggs));
      setAssistedText(String(existingRecord.assistedHatches));
      setHatchDateText(existingRecord.hatchDate);
      setHydrated(true);
    } else if (!existingRecord && !loadingRecord) {
      setHydrated(true);
    }
  }, [existingRecord, hydrated, loadingRecord, clutchId]);

  const update = (patch: Partial<HatchRecordInput>) => setForm((current) => ({ ...current, ...patch }));

  const handleSave = async () => {
    if (!isValidDateString(hatchDateText.trim())) {
      Alert.alert('Invalid date', 'Please use YYYY-MM-DD for the hatch date.');
      return;
    }

    const payload: HatchRecordInput = {
      clutchId,
      hatchedEggs: parseCount(hatchedText),
      failedEggs: parseCount(failedText),
      assistedHatches: parseCount(assistedText),
      hatchDate: hatchDateText.trim(),
      notes: form.notes?.trim() || null,
    };

    setSaving(true);
    try {
      await breedingRepository.saveHatchRecord(db, payload);

      if (clutch) {
        await breedingRepository.updateClutch(db, clutch.id, {
          breedingPairId: clutch.breedingPairId,
          flockId: clutch.flockId,
          clutchName: clutch.clutchName,
          laidDate: clutch.laidDate,
          totalEggs: clutch.totalEggs,
          incubationType: clutch.incubationType,
          incubatorName: clutch.incubatorName,
          incubationStartDate: clutch.incubationStartDate,
          expectedHatchDate: clutch.expectedHatchDate,
          actualHatchDate: payload.hatchDate,
          status: 'hatched',
          notes: clutch.notes,
        });

        await cancelNotification(clutch.hatchExpectedNotificationId);
        await cancelNotification(clutch.hatchDueNotificationId);
        await breedingRepository.setClutchNotificationIds(db, clutch.id, {
          hatchExpected: null,
          hatchDue: null,
        });
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('Something went wrong', 'Could not save this hatch record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingClutch || (!hydrated && loadingRecord)) {
    return (
      <AppScreen>
        <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <View style={styles.headerRow}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} accessibilityLabel="Go back" />
        <AppText variant="sectionTitle">{isEditing ? 'Edit Hatch Record' : 'Record Hatch'}</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={16}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {clutch ? (
            <AppText variant="caption" color={colors.secondaryText} style={styles.totalNote}>
              Clutch total: {clutch.totalEggs} eggs
            </AppText>
          ) : null}

          <View style={styles.countRow}>
            <View style={styles.countInput}>
              <FormField label="Hatched Eggs" value={hatchedText} onChangeText={setHatchedText} placeholder="0" keyboardType="number-pad" />
            </View>
            <View style={styles.countInput}>
              <FormField label="Failed Eggs" value={failedText} onChangeText={setFailedText} placeholder="0" keyboardType="number-pad" />
            </View>
          </View>

          <FormField
            label="Assisted Hatches"
            optional
            value={assistedText}
            onChangeText={setAssistedText}
            placeholder="0"
            keyboardType="number-pad"
          />

          <FormField label="Hatch Date" value={hatchDateText} onChangeText={setHatchDateText} placeholder="YYYY-MM-DD" />

          <FormField
            label="Notes"
            optional
            multiline
            value={form.notes ?? ''}
            onChangeText={(text) => update({ notes: text })}
            placeholder="Anything worth remembering about this hatch"
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <PrimaryButton
        label={saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Save Hatch Record'}
        onPress={handleSave}
        style={saving ? styles.disabled : undefined}
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
  totalNote: {
    marginBottom: spacing.md,
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
