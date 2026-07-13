import React from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import {
  AppScreen,
  AppText,
  PrimaryButton,
  IconButton,
  StatusPill,
  FadeInUp,
} from '../components';
import { useTask, useBirds, useFlocks } from '../hooks';
import { taskRepository } from '../db/repositories';
import { cancelNotification } from '../services/notificationService';
import { taskTypeByKey } from '../data/taskTypes';
import { isTaskCompletedToday, isTaskOverdue, formatDueDate, formatDueTime, repeatLabel } from '../utils/taskSchedule';
import { TodayStackParamList } from '../navigation/todayTypes';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<TodayStackParamList, 'TaskDetail'>;

type DetailRow = { label: string; value: string };

export function TaskDetailScreen({ route, navigation }: Props) {
  const { taskId } = route.params;
  const db = useSQLiteContext();
  const { task, loading, refresh } = useTask(taskId);
  const { birds } = useBirds();
  const { flocks } = useFlocks();

  if (loading) {
    return (
      <AppScreen>
        <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
      </AppScreen>
    );
  }

  if (!task) {
    return (
      <AppScreen>
        <View style={styles.notFound}>
          <AppText variant="screenTitle" align="center">
            Task not found
          </AppText>
          <PrimaryButton label="Go back" onPress={() => navigation.goBack()} style={styles.notFoundButton} />
        </View>
      </AppScreen>
    );
  }

  const typeOption = taskTypeByKey(task.type);
  const birdName = birds.find((bird) => bird.id === task.birdId)?.name ?? null;
  const flockName = flocks.find((flock) => flock.id === task.flockId)?.name ?? null;
  const doneToday = isTaskCompletedToday(task);
  const overdue = isTaskOverdue(task);

  const detailRows: DetailRow[] = [
    { label: 'Due', value: `${formatDueDate(task.dueDate)} at ${formatDueTime(task.dueDate)}` },
    { label: 'Repeat', value: repeatLabel(task.repeatType) },
    { label: 'Bird', value: birdName ?? 'Not assigned' },
    { label: 'Flock', value: flockName ?? 'Not assigned' },
    { label: 'Reminder', value: task.notificationEnabled ? 'On' : 'Off' },
  ];

  const handleToggleComplete = async () => {
    if (doneToday) {
      await taskRepository.reopenTask(db, task.id);
    } else {
      await taskRepository.completeTask(db, task.id);
    }
    refresh();
  };

  const handleDelete = () => {
    Alert.alert('Delete task', `Delete "${task.title}"? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await cancelNotification(task.notificationId);
          await taskRepository.deleteTask(db, task.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <AppScreen>
      <View style={styles.headerRow}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
        <IconButton name="pencil" onPress={() => navigation.navigate('AddEditTask', { taskId: task.id })} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <FadeInUp style={styles.heroBlock}>
          <AppText style={styles.icon}>{typeOption.icon}</AppText>
          <AppText variant="display" align="center">
            {task.title}
          </AppText>
          <AppText variant="body" color={colors.secondaryText} align="center" style={styles.subtitle}>
            {typeOption.label}
          </AppText>
          {doneToday ? (
            <StatusPill label="Completed" tone="success" />
          ) : overdue ? (
            <StatusPill label="Overdue" tone="warning" />
          ) : (
            <StatusPill label="Pending" tone="neutral" />
          )}
        </FadeInUp>

        {task.description ? (
          <FadeInUp delay={60} style={styles.notesCard}>
            <AppText variant="cardTitle" style={styles.notesLabel}>
              Description
            </AppText>
            <AppText variant="body" color={colors.secondaryText}>
              {task.description}
            </AppText>
          </FadeInUp>
        ) : null}

        <FadeInUp delay={120} style={styles.card}>
          {detailRows.map((row, index) => (
            <View key={row.label} style={[styles.row, index === detailRows.length - 1 && styles.rowLast]}>
              <AppText variant="caption" color={colors.mutedText}>
                {row.label}
              </AppText>
              <AppText variant="cardTitle">{row.value}</AppText>
            </View>
          ))}
        </FadeInUp>

        <FadeInUp delay={180} style={styles.actions}>
          <PrimaryButton
            label={doneToday ? 'Reopen Task' : 'Mark Complete'}
            onPress={handleToggleComplete}
            style={doneToday ? styles.secondaryButton : undefined}
          />
          <PrimaryButton label="Delete Task" onPress={handleDelete} style={styles.deleteButton} />
        </FadeInUp>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: spacing.xxl,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundButton: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  heroBlock: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.xs,
  },
  notesCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  notesLabel: {
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  actions: {
    gap: spacing.sm,
  },
  secondaryButton: {
    backgroundColor: colors.hatchOrange,
  },
  deleteButton: {
    backgroundColor: colors.alertCoral,
  },
});
