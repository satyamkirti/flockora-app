import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { colors, spacing } from '../theme';

type StatusPillProps = {
  label: string;
  tone?: 'success' | 'warning' | 'neutral';
};

export function StatusPill({ label, tone = 'neutral' }: StatusPillProps) {
  const style = tone === 'success' ? styles.success : tone === 'warning' ? styles.warning : styles.neutral;

  return (
    <View style={[styles.pill, style]}>
      <AppText variant="caption" color={tone === 'warning' ? colors.primaryText : colors.primaryText}>
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
});
