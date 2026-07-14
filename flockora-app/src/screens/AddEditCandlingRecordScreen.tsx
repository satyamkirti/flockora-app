import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import { AppScreen, AppText, PrimaryButton, FormField, ScreenHeader } from '../components';
import { useCandlingRecords, useClutch } from '../hooks';
import { breedingRepository, CandlingCountExceedsClutchError } from '../db/repositories';
import { CandlingRecordInput, createEmptyCandlingRecordInput } from '../types/breeding';
import { isValidDateString } from '../utils/formValidation';
import { FlockStackParamList } from '../navigation/flockTypes';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<FlockStackParamList, 'AddEditCandlingRecord'>;

function parseCount(text: string): number {
  const value = Number.parseInt(text, 10);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function AddEditCandlingRecordScreen({ route, navigation }: Props) {
  const { clutchId, recordId } = route.params;
  const isEditing = recordId != null;
  const db = useSQLiteContext();
  const { clutch } = useClutch(clutchId);
  const { records } = useCandlingRecords(clutchId);
  const existingRecord = recordId != null ? records.find((record) => record.id === recordId) ?? null : null;

  const [form, setForm] = useState<CandlingRecordInput>(createEmptyCandlingRecordInput(clutchId));
  const [dateText, setDateText] = useState(form.date);
  const [fertileText, setFertileText] = useState('0');
  const [infertileText, setInfertileText] = useState('0');
  const [uncertainText, setUncertainText] = useState('0');
  const [deadText, setDeadText] = useState('0');
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(!isEditing);

  useEffect(() => {
    if (isEditing && existingRecord && !hydrated) {
      setForm({
        clutchId,
        date: existingRecord.date,
        fertileEggs: existingRecord.fertileEggs,
        infertileEggs: existingRecord.infertileEggs,
        uncertainEggs: existingRecord.uncertainEggs,
        deadEmbryos: existingRecord.deadEmbryos,
        notes: existingRecord.notes,
      });
      setDateText(existingRecord.date);
      setFertileText(String(existingRecord.fertileEggs));
      setInfertileText(String(existingRecord.infertileEggs));
      setUncertainText(String(existingRecord.uncertainEggs));
      setDeadText(String(existingRecord.deadEmbryos));
      setHydrated(true);
    }
  }, [isEditing, existingRecord, hydrated, clutchId]);

  const update = (patch: Partial<CandlingRecordInput>) => setForm((current) => ({ ...current, ...patch }));

  const handleSave = async () => {
    if (!isValidDateString(dateText.trim())) {
      Alert.alert('Invalid date', 'Please use YYYY-MM-DD for the date.');
      return;
    }

    const fertileEggs = parseCount(fertileText);
    const infertileEggs = parseCount(infertileText);
    const uncertainEggs = parseCount(uncertainText);
    const deadEmbryos = parseCount(deadText);
    const sum = fertileEggs + infertileEggs + uncertainEggs + deadEmbryos;

    if (clutch && sum > clutch.totalEggs) {
      Alert.alert('Too many eggs counted', `This clutch only has ${clutch.totalEggs} eggs, but ${sum} were counted.`);
      return;
    }

    const payload: CandlingRecordInput = {
      clutchId,
      date: dateText.trim(),
      fertileEggs,
      infertileEggs,
      uncertainEggs,
      deadEmbryos,
      notes: form.notes?.trim() || null,
    };

    setSaving(true);
    try {
      if (isEditing && recordId != null) {
        await breedingRepository.updateCandlingRecord(db, recordId, payload);
      } else {
        await breedingRepository.addCandlingRecord(db, payload);
      }
      navigation.goBack();
    } catch (error) {
      if (error instanceof CandlingCountExceedsClutchError) {
        Alert.alert('Too many eggs counted', error.message);
      } else {
        Alert.alert('Something went wrong', 'Could not save this candling record. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen>
      <ScreenHeader title={isEditing ? 'Edit Candling' : 'Record Candling'} onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={16}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {clutch ? (
            <AppText variant="caption" color={colors.secondaryText} style={styles.totalNote}>
              Clutch total: {clutch.totalEggs} eggs
            </AppText>
          ) : null}

          <FormField label="Date" value={dateText} onChangeText={setDateText} placeholder="YYYY-MM-DD" />

          <View style={styles.countRow}>
            <View style={styles.countInput}>
              <FormField label="Fertile" value={fertileText} onChangeText={setFertileText} placeholder="0" keyboardType="number-pad" />
            </View>
            <View style={styles.countInput}>
              <FormField label="Infertile" value={infertileText} onChangeText={setInfertileText} placeholder="0" keyboardType="number-pad" />
            </View>
          </View>

          <View style={styles.countRow}>
            <View style={styles.countInput}>
              <FormField label="Uncertain" value={uncertainText} onChangeText={setUncertainText} placeholder="0" keyboardType="number-pad" />
            </View>
            <View style={styles.countInput}>
              <FormField label="Dead Embryos" value={deadText} onChangeText={setDeadText} placeholder="0" keyboardType="number-pad" />
            </View>
          </View>

          <FormField
            label="Notes"
            optional
            multiline
            value={form.notes ?? ''}
            onChangeText={(text) => update({ notes: text })}
            placeholder="What did you notice?"
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <PrimaryButton
        label={saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Save Candling Record'}
        onPress={handleSave}
        style={saving ? styles.disabled : undefined}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
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
