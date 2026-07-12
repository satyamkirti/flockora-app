import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { colors, radii, spacing } from '../theme';

type CareTaskRowProps = {
  title: string;
  detail: string;
  completed?: boolean;
  urgent?: boolean;
};

export function CareTaskRow({ title, detail, completed = false, urgent = false }: CareTaskRowProps) {
  return (
    <View style={[styles.row, completed && styles.completedRow, urgent && styles.urgentRow]}>
      <View style={[styles.dot, completed ? styles.completedDot : urgent ? styles.urgentDot : styles.pendingDot]} />
      <View style={styles.content}>
        <AppText variant="cardTitle">{title}</AppText>
        <AppText variant="caption" color={colors.secondaryText}>
          {detail}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  completedRow: {
    backgroundColor: colors.softGreen,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  urgentRow: {
    backgroundColor: '#FFF2E3',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  content: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 6,
  },
  completedDot: {
    backgroundColor: colors.leafGreen,
  },
  urgentDot: {
    backgroundColor: colors.alertCoral,
  },
  pendingDot: {
    backgroundColor: colors.sunflowerYellow,
  },
});
