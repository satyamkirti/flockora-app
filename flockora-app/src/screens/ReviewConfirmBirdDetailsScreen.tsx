import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
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
import { RootStackParamList } from '../navigation/types';
import { AIField } from '../types/onboarding';
import { colors, radii, shadows, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ReviewConfirmBirdDetails'>;

type FieldKey = 'confirmedBreed' | 'confirmedSex' | 'confirmedColor' | 'confirmedLifeStage';

export function ReviewConfirmBirdDetailsScreen({ navigation }: Props) {
  const { speciesKey, bird, updateBird } = useOnboarding();
  const species = speciesByKey(speciesKey ?? 'chicken');
  const [editingField, setEditingField] = useState<FieldKey | null>(null);

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

  if (!bird.aiAnalysis) {
    return null;
  }

  const rows: { key: FieldKey; label: string; field: AIField; currentValue: string }[] = [
    { key: 'confirmedBreed', label: 'Breed', field: bird.aiAnalysis.breed, currentValue: bird.confirmedBreed },
    { key: 'confirmedSex', label: 'Sex', field: bird.aiAnalysis.sex, currentValue: bird.confirmedSex },
    { key: 'confirmedColor', label: 'Color & Markings', field: bird.aiAnalysis.color, currentValue: bird.confirmedColor },
    { key: 'confirmedLifeStage', label: 'Life Stage', field: bird.aiAnalysis.lifeStage, currentValue: bird.confirmedLifeStage },
  ];

  const activeRow = rows.find((row) => row.key === editingField);

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
            Here's what Flockora noticed. Review each detail and correct anything that isn't quite right.
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
                <AppText variant="cardTitle" style={styles.rowValue}>
                  {row.currentValue}
                </AppText>
                <ConfidenceBadge level={row.field.confidence} />
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

      <PrimaryButton label="Confirm & Continue" onPress={() => navigation.replace('PersonalizedDashboard')} />

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
});
