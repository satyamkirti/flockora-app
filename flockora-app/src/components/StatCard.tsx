import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { colors, radii, shadows, spacing } from '../theme';

type StatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  accentColor?: string;
  style?: ViewStyle;
};

export function StatCard({ title, value, subtitle, accentColor = colors.sunflowerYellow, style }: StatCardProps) {
  return (
    <View style={[styles.card, styles.shadow, style]}>
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <AppText variant="caption" color={colors.mutedText}>
        {title}
      </AppText>
      <AppText variant="cardTitle" style={styles.value}>
        {value}
      </AppText>
      {subtitle ? (
        <AppText variant="caption" color={colors.secondaryText}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    flex: 1,
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shadow: shadows.card,
  accent: {
    width: 42,
    height: 8,
    borderRadius: 999,
    marginBottom: spacing.sm,
  },
  value: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
});
