import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { AppScreen, AppText, SectionHeader, StatCard, TaskRow, EmptyState, PrimaryButton, ProgressBar } from '../components';
import { useTodayTasks, useTaskStats, useBirds, useFlocks, useHealthDashboardStats, useEggDashboard } from '../hooks';
import { taskRepository } from '../db/repositories';
import { taskTypeByKey } from '../data/taskTypes';
import { isTaskCompletedToday, isTaskOverdue, formatDueTime, getTimeOfDayGreeting } from '../utils/taskSchedule';
import { Task } from '../types/task';
import { TodayStackParamList } from '../navigation/todayTypes';
import { colors, radii, spacing, shadows } from '../theme';

type Props = NativeStackScreenProps<TodayStackParamList, 'TodayHome'>;

export function TodayScreen({ navigation }: Props) {
  const db = useSQLiteContext();
  const { tasks, loading, refresh: refreshTasks } = useTodayTasks();
  const { stats, refresh: refreshStats } = useTaskStats();
  const { stats: healthStats } = useHealthDashboardStats();
  const { summary: eggSummary } = useEggDashboard();
  const { birds } = useBirds();
  const { flocks } = useFlocks();

  const handleToggle = async (task: Task) => {
    if (isTaskCompletedToday(task)) {
      await taskRepository.reopenTask(db, task.id);
    } else {
      await taskRepository.completeTask(db, task.id);
    }
    refreshTasks();
    refreshStats();
  };

  const progress = stats.todayTotal === 0 ? 0 : stats.completedToday / stats.todayTotal;
  const today = new Date();
  const dateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(today);

  const summaryCards = [
    { title: "Today's Tasks", value: String(stats.todayTotal), accentColor: colors.sunflowerYellow },
    { title: 'Completed', value: String(stats.completedToday), accentColor: colors.leafGreen },
    { title: 'Pending', value: String(stats.pendingToday), accentColor: colors.hatchOrange },
    { title: 'Overdue', value: String(stats.overdueCount), accentColor: colors.alertCoral },
  ];

  const healthSummaryCards = [
    { title: 'Active Treatments', value: String(healthStats.activeTreatments), accentColor: colors.hatchOrange },
    { title: 'Vaccinations Due', value: String(healthStats.vaccinationsDue), accentColor: colors.sunflowerYellow },
    { title: 'Health Alerts', value: String(healthStats.healthAlerts), accentColor: colors.alertCoral },
    { title: 'Recent Records', value: String(healthStats.recentRecordsCount), accentColor: colors.waterBlue },
  ];

  const eggSummaryCards = [
    { title: 'Eggs Today', value: String(eggSummary.todayTotal), accentColor: colors.sunflowerYellow },
    { title: 'Eggs This Week', value: String(eggSummary.weekTotal), accentColor: colors.leafGreen },
    { title: 'Eggs This Month', value: String(eggSummary.monthTotal), accentColor: colors.hatchOrange },
    { title: 'Avg Daily Eggs', value: eggSummary.averagePerDay.toFixed(1), accentColor: colors.waterBlue },
  ];

  return (
    <AppScreen>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" color={colors.leafGreen}>
              {getTimeOfDayGreeting(today)}
            </AppText>
            <AppText variant="display">{dateLabel}</AppText>
          </View>
          <View style={styles.iconBubble}>
            <Ionicons name="sunny" size={24} color={colors.hatchOrange} />
          </View>
        </View>

        <View style={[styles.progressCard, shadows.card]}>
          <View style={styles.progressHeader}>
            <AppText variant="sectionTitle">Today's Progress</AppText>
            <AppText variant="caption" color={colors.secondaryText}>
              {stats.completedToday} of {stats.todayTotal} done
            </AppText>
          </View>
          <ProgressBar progress={progress} />
        </View>

        <View style={styles.summaryGrid}>
          {summaryCards.map((card) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={card.value}
              accentColor={card.accentColor}
              style={styles.statCard}
            />
          ))}
        </View>

        <SectionHeader title="Today's Tasks" />
        {loading ? (
          <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
        ) : tasks.length === 0 ? (
          <EmptyState title="No tasks today" message="Add your first care task to start your daily routine." />
        ) : (
          <View style={styles.taskList}>
            {tasks.map((task) => {
              const typeOption = taskTypeByKey(task.type);
              const birdName = birds.find((bird) => bird.id === task.birdId)?.name;
              const flockName = flocks.find((flock) => flock.id === task.flockId)?.name;
              return (
                <TaskRow
                  key={task.id}
                  icon={typeOption.icon}
                  title={task.title}
                  dueTimeLabel={formatDueTime(task.dueDate)}
                  subjectLabel={birdName ?? flockName ?? null}
                  completed={isTaskCompletedToday(task)}
                  overdue={isTaskOverdue(task)}
                  onToggle={() => handleToggle(task)}
                  onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
                />
              );
            })}
          </View>
        )}

        <SectionHeader title="Flock Health" />
        <View style={styles.summaryGrid}>
          {healthSummaryCards.map((card) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={card.value}
              accentColor={card.accentColor}
              style={styles.statCard}
            />
          ))}
        </View>

        <SectionHeader title="Egg Production" />
        <View style={styles.summaryGrid}>
          {eggSummaryCards.map((card) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={card.value}
              accentColor={card.accentColor}
              style={styles.statCard}
            />
          ))}
        </View>
      </ScrollView>

      <PrimaryButton label="+ Add Task" onPress={() => navigation.navigate('AddEditTask', {})} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  iconBubble: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: colors.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statCard: {
    width: '48%',
    marginBottom: spacing.sm,
  },
  taskList: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loader: {
    marginTop: spacing.xl,
  },
});
