import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import {
  AppScreen,
  AppText,
  PrimaryButton,
  OnboardingHeader,
  FadeInUp,
  BirdPhotoBadge,
  ConfidenceBadge,
  EditableFieldModal,
} from '../components';
import { speciesByKey } from '../data/onboardingData';
import { useOnboarding } from '../context/OnboardingContext';
import { birdRepository } from '../db/repositories';
import { RootStackParamList } from '../navigation/types';
import { AIField } from '../types/onboarding';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ReviewConfirmBirdDetails'>;

type FieldKey = 'confirmedBreed' | 'confirmedSex' | 'confirmedColor' | 'confirmedLifeStage';

export function ReviewConfirmBirdDetailsScreen({ navigation }: Props) {
  const db = useSQLiteContext();
  const { speciesKey, bird, updateBird } = useOnboarding();
  const species = speciesByKey(speciesKey ?? 'chicken');
  const [editingField, setEditingField] = useState<FieldKey | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (bird.aiAnalysis && !bird.confirmedBreed) {
      updateBird({
        confirmedBreed: bird.aiAnalysis.breed.value,
        confirmedSex: bird.aiAnalysis.sex.value,
        confirmedColor: bird.aiAnalysis.color.value,
        confirmedLifeStage: bird.aiAnalysis.lifeStage.value,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bird.aiAnalysis]);

  // aiAnalysis is null when the user skipped/couldn't complete AI analysis (see
  // AIPhotoAnalysisLoadingScreen's "Enter Details Manually" path) — every field below still
  // renders and remains editable, just without an AI-proposed starting value or confidence
  // badge, preserving "AI prepares, human confirms" even when AI didn't prepare anything.
  const rows: { key: FieldKey; label: string; field: AIField | null; currentValue: string }[] = [
    { key: 'confirmedBreed', label: 'Breed', field: bird.aiAnalysis?.breed ?? null, currentValue: bird.confirmedBreed },
    { key: 'confirmedSex', label: 'Sex', field: bird.aiAnalysis?.sex ?? null, currentValue: bird.confirmedSex },
    {
      key: 'confirmedColor',
      label: 'Color & Markings',
      field: bird.aiAnalysis?.color ?? null,
      currentValue: bird.confirmedColor,
    },
    {
      key: 'confirmedLifeStage',
      label: 'Life Stage',
      field: bird.aiAnalysis?.lifeStage ?? null,
      currentValue: bird.confirmedLifeStage,
    },
  ];

  const activeRow = rows.find((row) => row.key === editingField);

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await birdRepository.create(db, {
        name: bird.name.trim(),
        species: speciesKey ?? 'chicken',
        breed: bird.confirmedBreed || null,
        sex: bird.confirmedSex || null,
        dateOfBirth: null,
        ageEstimate: bird.confirmedLifeStage || null,
        acquisitionDate: new Date().toISOString().slice(0, 10),
        color: bird.confirmedColor || null,
        weight: null,
        weightUnit: 'kg',
        notes: null,
        photoUri: bird.photo?.uri ?? null,
        isActive: true,
        flockId: null,
      });
      navigation.replace('PersonalizedDashboard');
    } catch (error) {
      Alert.alert("Couldn't save your bird", 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen>
      <OnboardingHeader step={4} totalSteps={4} onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <FadeInUp style={styles.headerBlock}>
          <BirdPhotoBadge icon={species.icon} size={96} />
          <AppText variant="screenTitle" align="center">
            {bird.name || 'Your bird'}
          </AppText>
          <AppText variant="body" color={colors.secondaryText} align="center" style={styles.subtitle}>
            {bird.aiAnalysis
              ? "Here's what Flockora noticed. Review each detail and correct anything that isn't quite right."
              : "We couldn't analyze the photo automatically. Fill in what you know below — you can always update it later."}
          </AppText>
        </FadeInUp>

        <FadeInUp delay={80} style={styles.card}>
          {rows.map((row, index) => (
            <Pressable
              key={row.key}
              onPress={() => setEditingField(row.key)}
              style={[styles.row, index === rows.length - 1 && styles.rowLast]}
            >
              <View style={styles.rowContent}>
                <AppText variant="caption" color={colors.mutedText}>
                  {row.label}
                </AppText>
                <AppText variant="cardTitle" style={styles.rowValue} color={row.currentValue ? undefined : colors.mutedText}>
                  {row.currentValue || 'Tap to add'}
                </AppText>
                {row.field ? <ConfidenceBadge level={row.field.confidence} /> : null}
              </View>
              <Ionicons name="pencil" size={18} color={colors.mutedText} />
            </Pressable>
          ))}
        </FadeInUp>

        <FadeInUp delay={140}>
          <AppText variant="caption" color={colors.mutedText} align="center" style={styles.footNote}>
            AI-suggested details are proposals until you confirm them.
          </AppText>
        </FadeInUp>
      </ScrollView>

      <PrimaryButton
        label={saving ? 'Saving…' : 'Confirm & Continue'}
        onPress={handleConfirm}
        style={saving ? styles.disabled : undefined}
      />

      {activeRow ? (
        <EditableFieldModal
          visible={Boolean(activeRow)}
          label={activeRow.label}
          value={activeRow.currentValue}
          onCancel={() => setEditingField(null)}
          onSave={(nextValue) => {
            updateBird({ [activeRow.key]: nextValue } as Partial<typeof bird>);
            setEditingField(null);
          }}
        />
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  subtitle: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  card: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowContent: {
    flex: 1,
    gap: 4,
  },
  rowValue: {
    marginBottom: 2,
  },
  footNote: {
    marginTop: spacing.md,
  },
  disabled: {
    opacity: 0.6,
  },
});
