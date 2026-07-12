import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton } from './IconButton';
import { colors, radii, spacing } from '../theme';

type OnboardingHeaderProps = {
  step: number;
  totalSteps: number;
  onBack?: () => void;
};

export function OnboardingHeader({ step, totalSteps, onBack }: OnboardingHeaderProps) {
  return (
    <View style={styles.row}>
      {onBack ? (
        <IconButton name="chevron-back" onPress={onBack} />
      ) : (
        <View style={styles.spacer} />
      )}
      <View style={styles.dots}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index < step ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  spacer: {
    width: 44,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dot: {
    height: 8,
    borderRadius: radii.sm,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.leafGreen,
  },
  dotInactive: {
    width: 8,
    backgroundColor: colors.border,
  },
});
