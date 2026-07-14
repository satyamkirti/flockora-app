import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { StatusPill } from './StatusPill';
import { ProgressBar } from './ProgressBar';
import { IncubationPhase } from '../types/breeding';
import { incubationPhaseLabels } from '../utils/breedingCalc';
import { colors, spacing } from '../theme';

type ClutchRowProps = {
  icon: string;
  title: string;
  eggsLabel: string;
  daysLabel: string | null;
  progress: number | null;
  phase: IncubationPhase;
  onPress: () => void;
};

export function ClutchRow({ icon, title, eggsLabel, daysLabel, progress, phase, onPress }: ClutchRowProps) {
  const phaseMeta = incubationPhaseLabels[phase];
  const rowLabel = [title, eggsLabel, daysLabel, phaseMeta.label].filter(Boolean).join(', ');

  return (
    <Pressable onPress={onPress} style={styles.row} accessibilityRole="button" accessibilityLabel={rowLabel}>
      <View style={styles.headerRow}>
        <AppText style={styles.icon}>{icon}</AppText>
        <View style={styles.content}>
          <AppText variant="cardTitle">{title}</AppText>
          <AppText variant="caption" color={colors.secondaryText}>
            {eggsLabel}
            {daysLabel ? ` · ${daysLabel}` : ''}
          </AppText>
        </View>
        <StatusPill label={phaseMeta.label} tone={phaseMeta.tone} />
      </View>
      {progress != null ? (
        <View style={styles.progressWrap}>
          <ProgressBar progress={progress / 100} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 22,
    marginRight: spacing.sm,
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
    gap: 2,
  },
  progressWrap: {
    marginTop: spacing.sm,
  },
});
