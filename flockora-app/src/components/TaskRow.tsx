import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { StatusPill } from './StatusPill';
import { colors, radii, spacing } from '../theme';

type TaskRowProps = {
  icon: string;
  title: string;
  dueTimeLabel: string;
  subjectLabel?: string | null;
  completed: boolean;
  overdue: boolean;
  onToggle: () => void;
  onPress: () => void;
};

function TaskRowComponent({
  icon,
  title,
  dueTimeLabel,
  subjectLabel,
  completed,
  overdue,
  onToggle,
  onPress,
}: TaskRowProps) {
  const isOverdue = overdue && !completed;
  const rowLabel = [title, subjectLabel, dueTimeLabel, isOverdue ? 'overdue' : null, completed ? 'completed' : null]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, completed && styles.completedRow, isOverdue && styles.overdueRow]}
      accessibilityRole="button"
      accessibilityLabel={rowLabel}
    >
      <Pressable
        onPress={onToggle}
        hitSlop={10}
        style={[styles.checkbox, completed && styles.checkboxChecked]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed }}
        accessibilityLabel={completed ? `Mark ${title} as not done` : `Mark ${title} as done`}
      >
        {completed ? <Ionicons name="checkmark" size={16} color={colors.cardSurface} /> : null}
      </Pressable>

      <AppText style={styles.icon}>{icon}</AppText>

      <View style={styles.content}>
        <AppText variant="cardTitle" color={completed ? colors.mutedText : colors.primaryText}>
          {title}
        </AppText>
        <AppText variant="caption" color={isOverdue ? colors.alertCoral : colors.secondaryText}>
          {dueTimeLabel}
          {subjectLabel ? ` · ${subjectLabel}` : ''}
        </AppText>
      </View>

      {isOverdue ? <StatusPill label="Overdue" tone="warning" /> : null}
    </Pressable>
  );
}

export const TaskRow = React.memo(TaskRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  completedRow: {
    backgroundColor: colors.softGreen,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderBottomWidth: 0,
  },
  overdueRow: {
    backgroundColor: colors.dangerBackground,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderBottomWidth: 0,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: colors.leafGreen,
    borderColor: colors.leafGreen,
  },
  icon: {
    fontSize: 22,
    marginRight: spacing.sm,
  },
  content: {
    flex: 1,
  },
});
