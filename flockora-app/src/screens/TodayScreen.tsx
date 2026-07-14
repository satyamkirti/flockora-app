import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { AppScreen, AppText, SectionHeader, StatCard, TaskRow, EmptyState, PrimaryButton, ProgressBar } from '../components';
import {
  useTodayTasks,
  useTaskStats,
  useBirds,
  useFlocks,
  useHealthDashboardStats,
  useEggDashboard,
  useFeedDashboard,
  useBreedingDashboard,
} from '../hooks';
import { taskTypeByKey } from '../data/taskTypes';
import {
  isTaskCompletedToday,
  isTaskOverdue,
  formatDueTime,
  formatDueDateTime,
  taskScheduleLabel,
  getTimeOfDayGreeting,
} from '../utils/taskSchedule';
import { toggleTaskCompletion } from '../utils/taskActions';
import { formatQuantitiesByUnit } from '../utils/feedStock';
import { Task } from '../types/task';
import { TodayStackParamList } from '../navigation/todayTypes';
import { colors, radii, spacing, shadows } from '../theme';

type Props = NativeStackScreenProps<TodayStackParamList, 'TodayHome'>;

export function TodayScreen({ navigation }: Props) {
  const db = useSQLiteContext();
  const { overdueTasks, todayTasks, upcomingTasks, loading, refresh: refreshTasks } = useTodayTasks();
  const { stats, loading: statsLoading, refresh: refreshStats } = useTaskStats();
  const { stats: healthStats, loading: healthLoading } = useHealthDashboardStats();
  const { summary: eggSummary, loading: eggLoading } = useEggDashboard();
  const { summary: feedSummary, loading: feedLoading } = useFeedDashboard();
  const { summary: breedingSummary, loading: breedingLoading } = useBreedingDashboard();
  const { birds } = useBirds();
  const { flocks } = useFlocks();

  const handleToggle = async (task: Task) => {
    await toggleTaskCompletion(db, task);
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

  const feedSummaryCards = [
    { title: 'Low Stock', value: String(feedSummary.lowStockCount), accentColor: colors.sunflowerYellow },
    { title: 'Out of Stock', value: String(feedSummary.outOfStockCount), accentColor: colors.alertCoral },
    { title: 'Feed Used Today', value: formatQuantitiesByUnit(feedSummary.usedTodayByUnit), accentColor: colors.leafGreen },
    { title: 'Expiring Soon', value: String(feedSummary.expiringSoonCount), accentColor: colors.hatchOrange },
  ];

  const renderTaskRow = (task: Task, dueLabel: string) => {
    const typeOption = taskTypeByKey(task.type);
    const birdName = birds.find((bird) => bird.id === task.birdId)?.name;
    const flockName = flocks.find((flock) => flock.id === task.flockId)?.name;
    return (
      <TaskRow
        key={task.id}
        icon={typeOption.icon}
        title={task.title}
        dueTimeLabel={dueLabel}
        subjectLabel={birdName ?? flockName ?? null}
        completed={isTaskCompletedToday(task)}
        overdue={isTaskOverdue(task)}
        onToggle={() => handleToggle(task)}
        onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
      />
    );
  };

  const hasNoTasksAtAll = overdueTasks.length === 0 && todayTasks.length === 0 && upcomingTasks.length === 0;
  const allCaughtUpToday = overdueTasks.length === 0 && todayTasks.length > 0 && stats.pendingToday === 0;

  const breedingSummaryCards = [
    { title: 'Active Clutches', value: String(breedingSummary.activeClutches), accentColor: colors.leafGreen },
    { title: 'Eggs Incubating', value: String(breedingSummary.eggsIncubating), accentColor: colors.sunflowerYellow },
    { title: 'Hatches Due Soon', value: String(breedingSummary.hatchesDueSoon), accentColor: colors.waterBlue },
    { title: 'Overdue Hatches', value: String(breedingSummary.overdueHatches), accentColor: colors.alertCoral },
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

        {statsLoading ? (
          <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
        ) : (
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
        )}

        <SectionHeader title="Today's Tasks" />
        {loading ? (
          <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
        ) : hasNoTasksAtAll ? (
          <EmptyState title="No tasks yet" message="Add your first care task to start your daily routine." />
        ) : (
          <>
            {overdueTasks.length > 0 ? (
              <View style={styles.taskList}>
                <View style={styles.groupHeader}>
                  <Ionicons name="alert-circle" size={16} color={colors.alertCoral} />
                  <AppText variant="cardTitle" color={colors.alertCoral}>
                    Overdue ({overdueTasks.length})
                  </AppText>
                </View>
                {overdueTasks.map((task) => renderTaskRow(task, formatDueDateTime(task.dueDate)))}
              </View>
            ) : null}

            <View style={[styles.taskList, overdueTasks.length > 0 && styles.taskListSpaced]}>
              <View style={styles.groupHeader}>
                <AppText variant="cardTitle">Due Today</AppText>
              </View>
              {todayTasks.length === 0 ? (
                <AppText variant="body" color={colors.secondaryText} style={styles.groupEmptyText}>
                  Nothing due today.
                </AppText>
              ) : null}
              {allCaughtUpToday ? (
                <View style={styles.celebrateRow}>
                  <AppText style={styles.celebrateEmoji}>🎉</AppText>
                  <AppText variant="body" color={colors.leafGreen}>
                    All caught up for today!
                  </AppText>
                </View>
              ) : null}
              {todayTasks.map((task) => renderTaskRow(task, formatDueTime(task.dueDate)))}
            </View>

            {upcomingTasks.length > 0 ? (
              <View style={[styles.taskList, styles.taskListSpaced]}>
                <View style={styles.groupHeader}>
                  <AppText variant="cardTitle">Upcoming</AppText>
                </View>
                {upcomingTasks.map((task) => renderTaskRow(task, taskScheduleLabel(task)))}
              </View>
            ) : null}
          </>
        )}

        <SectionHeader title="Flock Health" />
        {healthLoading ? (
          <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
        ) : (
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
        )}

        <SectionHeader title="Egg Production" />
        {eggLoading ? (
          <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
        ) : (
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
        )}

        <SectionHeader title="Feed" />
        {feedLoading ? (
          <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
        ) : (
          <View style={styles.summaryGrid}>
            {feedSummaryCards.map((card) => (
              <StatCard
                key={card.title}
                title={card.title}
                value={card.value}
                accentColor={card.accentColor}
                style={styles.statCard}
              />
            ))}
          </View>
        )}

        <SectionHeader title="Breeding" />
        {breedingLoading ? (
          <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
        ) : (
          <View style={styles.summaryGrid}>
            {breedingSummaryCards.map((card) => (
              <StatCard
                key={card.title}
                title={card.title}
                value={card.value}
                accentColor={card.accentColor}
                style={styles.statCard}
              />
            ))}
          </View>
        )}
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
    paddingBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  taskListSpaced: {
    marginTop: spacing.md,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.md,
  },
  groupEmptyText: {
    paddingVertical: spacing.md,
  },
  celebrateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  celebrateEmoji: {
    fontSize: 18,
  },
  loader: {
    marginTop: spacing.xl,
  },
});
