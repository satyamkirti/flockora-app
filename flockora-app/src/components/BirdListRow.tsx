import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { BirdPhotoBadge } from './BirdPhotoBadge';
import { StatusPill } from './StatusPill';
import { speciesByKey } from '../data/onboardingData';
import { Bird } from '../types/bird';
import { colors, radii, shadows, spacing } from '../theme';

type BirdListRowProps = {
  bird: Bird;
  flockName?: string | null;
  onPress: () => void;
};

export function BirdListRow({ bird, flockName, onPress }: BirdListRowProps) {
  const species = speciesByKey(bird.species);
  const detailParts = [bird.breed || species.label, flockName].filter(Boolean);
  const rowLabel = [bird.name, ...detailParts, bird.isActive ? 'Active' : 'Inactive'].filter(Boolean).join(', ');

  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, shadows.card]}
      accessibilityRole="button"
      accessibilityLabel={rowLabel}
    >
      <BirdPhotoBadge icon={species.icon} photoUri={bird.photoUri} size={52} style={styles.avatar} />
      <View style={styles.content}>
        <AppText variant="cardTitle">{bird.name}</AppText>
        <AppText variant="caption" color={colors.secondaryText}>
          {detailParts.join(' · ')}
        </AppText>
      </View>
      <StatusPill label={bird.isActive ? 'Active' : 'Inactive'} tone={bird.isActive ? 'success' : 'neutral'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: {
    marginBottom: 0,
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
});
