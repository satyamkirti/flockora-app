import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { ConfidenceLevel } from '../types/onboarding';
import { colors, spacing } from '../theme';

type ConfidenceBadgeProps = {
  level: ConfidenceLevel;
};

const config: Record<ConfidenceLevel, { label: string; background: string; text: string }> = {
  HIGH: { label: 'High confidence', background: colors.softGreen, text: colors.leafGreen },
  LIKELY: { label: 'Likely', background: '#FFF2E3', text: colors.hatchOrange },
  UNSURE: { label: 'Unsure — please check', background: '#FBEAE7', text: colors.alertCoral },
};

export function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  const { label, background, text } = config[level];
  return (
    <View style={[styles.pill, { backgroundColor: background }]}>
      <AppText variant="caption" color={text}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
  },
});
