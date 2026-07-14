import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { StatusPill } from './StatusPill';
import { BreedingPairStatus } from '../types/breeding';
import { colors, spacing } from '../theme';

type BreedingPairRowProps = {
  pairName: string;
  maleName: string;
  femaleName: string;
  pairedDateLabel: string;
  status: BreedingPairStatus;
  clutchCount: number;
  onPress: () => void;
};

const statusTone: Record<BreedingPairStatus, 'success' | 'warning' | 'neutral'> = {
  active: 'success',
  separated: 'warning',
  retired: 'neutral',
};

const statusLabel: Record<BreedingPairStatus, string> = {
  active: 'Active',
  separated: 'Separated',
  retired: 'Retired',
};

export function BreedingPairRow({
  pairName,
  maleName,
  femaleName,
  pairedDateLabel,
  status,
  clutchCount,
  onPress,
}: BreedingPairRowProps) {
  const rowLabel = [
    pairName,
    `${maleName} and ${femaleName}`,
    `paired ${pairedDateLabel}`,
    statusLabel[status],
    `${clutchCount} ${clutchCount === 1 ? 'clutch' : 'clutches'}`,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable onPress={onPress} style={styles.row} accessibilityRole="button" accessibilityLabel={rowLabel}>
      <AppText style={styles.icon}>🧬</AppText>
      <View style={styles.content}>
        <AppText variant="cardTitle">{pairName}</AppText>
        <AppText variant="caption" color={colors.secondaryText}>
          {maleName} × {femaleName} · Paired {pairedDateLabel}
        </AppText>
        <AppText variant="caption" color={colors.mutedText}>
          {clutchCount} {clutchCount === 1 ? 'clutch' : 'clutches'}
        </AppText>
      </View>
      <StatusPill label={statusLabel[status]} tone={statusTone[status]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
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
});
