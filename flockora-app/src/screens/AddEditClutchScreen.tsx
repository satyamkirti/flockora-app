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
  FormField,
  SegmentedControl,
  FlockManagerModal,
  BreedingPairPickerModal,
  ScreenHeader,
  NotificationPreviewCard,
} from '../components';
import { NotificationPreviewRow } from '../components/NotificationPreviewCard';
import { useClutch, useBreedingPairs, useBirds, useFlocks } from '../hooks';
import { breedingRepository, ClutchTotalReductionError } from '../db/repositories';
import {
  buildCandlingReminderDate,
  buildHatchExpectedReminderDate,
  buildHatchDueReminderDate,
  cancelNotification,
  syncCandlingReminder,
  syncHatchExpectedReminder,
  syncHatchDueReminder,
  warnIfNotificationPermissionMissing,
  NOTIFICATION_CATEGORIES,
} from '../services/notificationService';
import { deriveClutchSpecies } from '../utils/breedingCalc';
import { getIncubationPeriodDays } from '../data/incubationPeriods';
import { speciesByKey } from '../data/onboardingData';
import { parseLocalDateString, toDateInputValue } from '../utils/taskSchedule';
import { isValidDateString } from '../utils/formValidation';
import { ClutchInput, ClutchStatus, IncubationType, createEmptyClutchInput } from '../types/breeding';
import { FlockStackParamList } from '../navigation/flockTypes';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<FlockStackParamList, 'AddEditClutch'>;

const incubationTypeOptions: { label: string; value: IncubationType }[] = [
  { label: 'Natural', value: 'natural' },
  { label: 'Incubator', value: 'incubator' },
];

const statusOptions: { label: string; value: ClutchStatus }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Hatched', value: 'hatched' },
  { label: 'Failed', value: 'failed' },
  { label: 'Cancelled', value: 'cancelled' },
];

function parseCount(text: string): number {
  const value = Number.parseInt(text, 10);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function AddEditClutchScreen({ route, navigation }: Props) {
  const { clutchId } = route.params;
  const isEditing = clutchId != null;
  const db = useSQLiteContext();
  const { clutch: existingClutch, loading: loadingClutch } = useClutch(clutchId);
  const { pairs } = useBreedingPairs();
  const { birds } = useBirds();
  const { flocks, refresh: refreshFlocks } = useFlocks();

  const [form, setForm] = useState<ClutchInput>(createEmptyClutchInput());
  const [totalEggsText, setTotalEggsText] = useState('0');
  const [laidDateText, setLaidDateText] = useState(form.laidDate);
  const [incubationStartDateText, setIncubationStartDateText] = useState('');
  const [expectedHatchDateText, setExpectedHatchDateText] = useState('');
  const [actualHatchDateText, setActualHatchDateText] = useState('');
  const [pairModalVisible, setPairModalVisible] = useState(false);
  const [flockModalVisible, setFlockModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(!isEditing);

  useEffect(() => {
    if (isEditing && existingClutch && !hydrated) {
      setForm({
        breedingPairId: existingClutch.breedingPairId,
        flockId: existingClutch.flockId,
        clutchName: existingClutch.clutchName,
        laidDate: existingClutch.laidDate,
        totalEggs: existingClutch.totalEggs,
        incubationType: existingClutch.incubationType,
        incubatorName: existingClutch.incubatorName,
        incubationStartDate: existingClutch.incubationStartDate,
        expectedHatchDate: existingClutch.expectedHatchDate,
        actualHatchDate: existingClutch.actualHatchDate,
        status: existingClutch.status,
        notes: existingClutch.notes,
      });
      setTotalEggsText(String(existingClutch.totalEggs));
      setLaidDateText(existingClutch.laidDate);
      setIncubationStartDateText(existingClutch.incubationStartDate ?? '');
      setExpectedHatchDateText(existingClutch.expectedHatchDate ?? '');
      setActualHatchDateText(existingClutch.actualHatchDate ?? '');
      setHydrated(true);
    }
  }, [isEditing, existingClutch, hydrated]);

  const update = (patch: Partial<ClutchInput>) => setForm((current) => ({ ...current, ...patch }));

  const pairName = pairs.find((pair) => pair.id === form.breedingPairId)?.pairName ?? 'No Breeding Pair';
  const flockName = flocks.find((flock) => flock.id === form.flockId)?.name ?? 'No Flock';
  const derivedSpecies = deriveClutchSpecies(
    { breedingPairId: form.breedingPairId, flockId: form.flockId },
    pairs,
    birds
  );
  const suggestedDays = derivedSpecies ? getIncubationPeriodDays(derivedSpecies) : null;

  const handleUseSuggestedHatchDate = () => {
    if (!isValidDateString(incubationStartDateText.trim())) {
      Alert.alert('Set a start date first', 'Enter an incubation start date to get a suggested hatch date.');
      return;
    }
    const days = suggestedDays ?? 21;
    const suggested = parseLocalDateString(incubationStartDateText.trim());
    suggested.setDate(suggested.getDate() + days);
    setExpectedHatchDateText(toDateInputValue(suggested));
  };

  const handleSave = async () => {
    if (!isValidDateString(laidDateText.trim())) {
      Alert.alert('Invalid laid date', 'Please use YYYY-MM-DD for the laid date.');
      return;
    }
    for (const [label, text] of [
      ['incubation start date', incubationStartDateText],
      ['expected hatch date', expectedHatchDateText],
      ['actual hatch date', actualHatchDateText],
    ] as const) {
      if (text.trim() && !isValidDateString(text.trim())) {
        Alert.alert('Invalid date', `Please use YYYY-MM-DD for the ${label}.`);
        return;
      }
    }

    const payload: ClutchInput = {
      ...form,
      clutchName: form.clutchName?.trim() || null,
      laidDate: laidDateText.trim(),
      totalEggs: parseCount(totalEggsText),
      incubatorName: form.incubationType === 'incubator' ? form.incubatorName?.trim() || null : null,
      incubationStartDate: incubationStartDateText.trim() || null,
      expectedHatchDate: expectedHatchDateText.trim() || null,
      actualHatchDate: actualHatchDateText.trim() || null,
      notes: form.notes?.trim() || null,
    };

    setSaving(true);
    try {
      let savedClutch;
      if (isEditing && clutchId != null) {
        savedClutch = await breedingRepository.updateClutch(db, clutchId, payload);
      } else {
        savedClutch = await breedingRepository.createClutch(db, payload);
      }

      // A clutch that's already hatched/failed/cancelled should never re-acquire a candling or
      // hatch reminder just because its dates got edited afterward.
      const clutchIsResolved = savedClutch.status !== 'active' || Boolean(savedClutch.actualHatchDate);

      if (clutchIsResolved) {
        await Promise.all([
          cancelNotification(existingClutch?.candlingNotificationId ?? null),
          cancelNotification(existingClutch?.hatchExpectedNotificationId ?? null),
          cancelNotification(existingClutch?.hatchDueNotificationId ?? null),
        ]);
        await breedingRepository.setClutchNotificationIds(db, savedClutch.id, {
          candling: null,
          hatchExpected: null,
          hatchDue: null,
        });
      } else {
        const incubationPeriodDays = derivedSpecies ? getIncubationPeriodDays(derivedSpecies) : 21;
        const candlingId = await syncCandlingReminder(
          { ...savedClutch, incubationPeriodDays },
          existingClutch?.candlingNotificationId ?? null
        );
        const hatchExpectedId = await syncHatchExpectedReminder(
          savedClutch,
          existingClutch?.hatchExpectedNotificationId ?? null
        );
        const hatchDueId = await syncHatchDueReminder(savedClutch, existingClutch?.hatchDueNotificationId ?? null);
        await breedingRepository.setClutchNotificationIds(db, savedClutch.id, {
          candling: candlingId,
          hatchExpected: hatchExpectedId,
          hatchDue: hatchDueId,
        });

        const missingCandling = Boolean(savedClutch.incubationStartDate) && !candlingId;
        const missingHatchExpected = Boolean(savedClutch.expectedHatchDate) && !hatchExpectedId;
        const missingHatchDue = Boolean(savedClutch.expectedHatchDate) && !hatchDueId;
        await warnIfNotificationPermissionMissing(missingCandling || missingHatchExpected || missingHatchDue);
      }

      navigation.goBack();
    } catch (error) {
      if (error instanceof ClutchTotalReductionError) {
        Alert.alert('Cannot reduce total eggs', error.message);
      } else {
        Alert.alert('Something went wrong', 'Could not save this clutch. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const previewClutchNameLower = form.clutchName?.trim() || 'your clutch';
  const previewClutchNameUpper = form.clutchName?.trim() || 'Your clutch';
  const previewIsResolved = form.status !== 'active' || Boolean(actualHatchDateText.trim());
  const previewIncubationPeriodDays = suggestedDays ?? 21;

  function buildPreviewRow(
    key: string,
    label: string,
    dateText: string,
    build: (dateText: string) => Date,
    testTitle: string,
    testBody: string,
    reminderType: 'candling' | 'hatch_expected' | 'hatch_due'
  ): NotificationPreviewRow {
    const validDate = dateText.trim() && isValidDateString(dateText.trim()) ? dateText.trim() : null;
    const scheduledDate = validDate ? build(validDate) : null;
    const isPast = scheduledDate != null && scheduledDate.getTime() <= Date.now();
    const disabledReason = previewIsResolved
      ? 'This clutch is no longer active'
      : !validDate
      ? 'Enter a date to schedule this reminder'
      : 'This date has already passed';

    return {
      key,
      label,
      scheduledDate: previewIsResolved || isPast ? null : scheduledDate,
      disabledReason,
      testTitle,
      testBody,
      categoryIdentifier: NOTIFICATION_CATEGORIES.breeding,
      testData: { type: 'clutch', category: 'Breeding Reminder', clutchId: clutchId ?? 0, reminderType },
    };
  }

  const previewRows: NotificationPreviewRow[] = [
    buildPreviewRow(
      'candling',
      'Candling Reminder',
      incubationStartDateText,
      (date) => buildCandlingReminderDate(date, previewIncubationPeriodDays),
      `Time to candle ${previewClutchNameLower}`,
      'Check egg development partway through incubation.',
      'candling'
    ),
    buildPreviewRow(
      'hatch-expected',
      'Hatch-Expected Reminder',
      expectedHatchDateText,
      buildHatchExpectedReminderDate,
      `${previewClutchNameUpper} is hatching soon`,
      'Expected hatch in 2 days — get ready.',
      'hatch_expected'
    ),
    buildPreviewRow(
      'hatch-due',
      'Hatch-Due Reminder',
      expectedHatchDateText,
      buildHatchDueReminderDate,
      `${previewClutchNameUpper} hatch is due today`,
      'Check your incubator or nest for new hatchlings.',
      'hatch_due'
    ),
  ];

  if (isEditing && loadingClutch && !hydrated) {
    return (
      <AppScreen>
        <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScreenHeader title={isEditing ? 'Edit Clutch' : 'Add Clutch'} onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={16}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <FormField
            label="Clutch Name"
            optional
            value={form.clutchName ?? ''}
            onChangeText={(text) => update({ clutchName: text })}
            placeholder="e.g. Spring Batch"
          />

          <View style={styles.fieldBlock}>
            <AppText variant="cardTitle" style={styles.label}>
              Breeding Pair
            </AppText>
            <Pressable style={styles.pickerField} onPress={() => setPairModalVisible(true)}>
              <AppText variant="body">{pairName}</AppText>
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

          <View style={styles.countRow}>
            <View style={styles.countInput}>
              <FormField label="Laid Date" value={laidDateText} onChangeText={setLaidDateText} placeholder="YYYY-MM-DD" />
            </View>
            <View style={styles.countInput}>
              <FormField
                label="Total Eggs"
                value={totalEggsText}
                onChangeText={setTotalEggsText}
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <AppText variant="cardTitle" style={styles.label}>
              Incubation Type
            </AppText>
            <SegmentedControl
              options={incubationTypeOptions}
              value={form.incubationType}
              onChange={(value) => update({ incubationType: value })}
            />
          </View>

          {form.incubationType === 'incubator' ? (
            <FormField
              label="Incubator Name"
              optional
              value={form.incubatorName ?? ''}
              onChangeText={(text) => update({ incubatorName: text })}
              placeholder="e.g. Brinsea Mini"
            />
          ) : null}

          <FormField
            label="Incubation Start Date"
            optional
            value={incubationStartDateText}
            onChangeText={setIncubationStartDateText}
            placeholder="YYYY-MM-DD"
          />

          <FormField
            label="Expected Hatch Date"
            optional
            value={expectedHatchDateText}
            onChangeText={setExpectedHatchDateText}
            placeholder="YYYY-MM-DD"
          />
          <Pressable onPress={handleUseSuggestedHatchDate} style={styles.suggestLink}>
            <AppText variant="caption" color={colors.leafGreen}>
              {derivedSpecies
                ? `Suggest based on ${speciesByKey(derivedSpecies).label} (${suggestedDays} days)`
                : 'Suggest hatch date from start date (21 days)'}
            </AppText>
          </Pressable>

          <NotificationPreviewCard rows={previewRows} />

          <FormField
            label="Actual Hatch Date"
            optional
            value={actualHatchDateText}
            onChangeText={setActualHatchDateText}
            placeholder="YYYY-MM-DD"
          />

          <View style={styles.fieldBlock}>
            <AppText variant="cardTitle" style={styles.label}>
              Status
            </AppText>
            <SegmentedControl options={statusOptions} value={form.status} onChange={(value) => update({ status: value })} />
          </View>

          <FormField
            label="Notes"
            optional
            multiline
            value={form.notes ?? ''}
            onChangeText={(text) => update({ notes: text })}
            placeholder="Anything worth remembering about this clutch"
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <PrimaryButton
        label={saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Clutch'}
        onPress={handleSave}
        style={saving ? styles.disabled : undefined}
        disabled={saving}
      />

      <BreedingPairPickerModal
        visible={pairModalVisible}
        onClose={() => setPairModalVisible(false)}
        pairs={pairs}
        birds={birds}
        selectedPairId={form.breedingPairId}
        onSelect={(pairIdValue) => update({ breedingPairId: pairIdValue })}
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
  suggestLink: {
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
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
