import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { colors, spacing } from '../theme';

type StatusPillProps = {
  label: string;
  tone?: 'success' | 'warning' | 'neutral' | 'danger';
};

const toneStyles = {
  success: 'success',
  warning: 'warning',
  neutral: 'neutral',
  danger: 'danger',
} as const;

export function StatusPill({ label, tone = 'neutral' }: StatusPillProps) {
  const style = styles[toneStyles[tone]];

  return (
    <View style={[styles.pill, style]} accessibilityRole="text" accessibilityLabel={label}>
      <AppText variant="caption" color={colors.primaryText}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
  },
  success: {
    backgroundColor: colors.softGreen,
  },
  warning: {
    backgroundColor: colors.warningBackground,
  },
  neutral: {
    backgroundColor: colors.warmCream,
  },
  danger: {
    backgroundColor: colors.dangerBackground,
  },
});
