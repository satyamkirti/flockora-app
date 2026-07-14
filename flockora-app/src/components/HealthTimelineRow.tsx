import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { StatusPill } from './StatusPill';
import { HealthRecordStatus } from '../types/healthRecord';
import { colors, spacing } from '../theme';

type HealthTimelineRowProps = {
  icon: string;
  title: string;
  dateLabel: string;
  status: HealthRecordStatus;
  birdName?: string | null;
  onPress: () => void;
};

export function HealthTimelineRow({ icon, title, dateLabel, status, birdName, onPress }: HealthTimelineRowProps) {
  const statusLabel = status === 'active' ? 'Active' : 'Completed';
  const rowLabel = [title, birdName, dateLabel, statusLabel].filter(Boolean).join(', ');

  return (
    <Pressable onPress={onPress} style={styles.row} accessibilityRole="button" accessibilityLabel={rowLabel}>
      <AppText style={styles.icon}>{icon}</AppText>
      <View style={styles.content}>
        <AppText variant="cardTitle">{title}</AppText>
        <AppText variant="caption" color={colors.secondaryText}>
          {dateLabel}
          {birdName ? ` · ${birdName}` : ''}
        </AppText>
      </View>
      <StatusPill
        label={status === 'active' ? 'Active' : 'Completed'}
        tone={status === 'active' ? 'warning' : 'success'}
      />
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
  },
});
