import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  AppScreen,
  AppText,
  IconButton,
  PrimaryButton,
  SectionHeader,
  StatCard,
  EmptyState,
  FadeInUp,
} from '../components';
import { useCareDashboard, useBirds, useFlocks } from '../hooks';
import { taskTypeByKey } from '../data/taskTypes';
import { healthRecordTypeByKey } from '../data/healthRecordTypes';
import { formatDueDate, formatDueTime } from '../utils/taskSchedule';
import { navigateToTab } from '../utils/crossTabNavigation';
import { PulseStackParamList } from '../navigation/pulseTypes';
import { colors, radii, spacing } from '../theme';

const UPCOMING_LIMIT = 5;

type Props = NativeStackScreenProps<PulseStackParamList, 'CareDashboard'>;

export function CareDashboardScreen({ navigation }: Props) {
  const { data, loading } = useCareDashboard();
  const { birds } = useBirds();
  const { flocks } = useFlocks();

  const birdName = (birdId: number | null) => birds.find((bird) => bird.id === birdId)?.name ?? null;
  const flockName = (flockId: number | null) => flocks.find((flock) => flock.id === flockId)?.name ?? null;
  const subjectLabel = (birdId: number | null, flockId: number | null) =>
    birdName(birdId) ?? flockName(flockId) ?? 'Unassigned';

  const statCards = [
    { title: 'Overdue', value: String(data.overdueReminders.length), accentColor: colors.alertCoral },
    { title: 'Upcoming', value: String(data.upcomingReminders.length), accentColor: colors.sunflowerYellow },
    { title: 'Recent Records', value: String(data.recentRecords.length), accentColor: colors.waterBlue },
    {
      title: 'Need Attention',
      value: String(data.attentionBirdIds.length + data.attentionFlockIds.length),
      accentColor: colors.hatchOrange,
    },
  ];

  const handleAddCareRecord = () => navigateToTab(navigation, 'Flock', 'AddEditHealthRecord');

  const handleAddReminder = () => navigateToTab(navigation, 'Today', 'AddEditTask');

  const handleOpenReminder = (taskId: number) => navigateToTab(navigation, 'Today', 'TaskDetail', { taskId });

  const handleOpenRecord = (recordId: number) => navigateToTab(navigation, 'Flock', 'HealthRecordDetail', { recordId });

  const handleOpenBird = (id: number) => navigateToTab(navigation, 'Flock', 'BirdProfile', { birdId: id });

  return (
    <AppScreen>
      <View style={styles.headerRow}>
        <View>
          <AppText variant="display">Care Dashboard</AppText>
          <AppText variant="body" color={colors.secondaryText} style={styles.subtitle}>
            Reminders and records across your flock.
          </AppText>
        </View>
        <IconButton
          name="search-outline"
          onPress={() => navigation.navigate('PulseHome')}
          accessibilityLabel="Search care records"
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
        ) : (
          <FadeInUp style={styles.statsGrid}>
            {statCards.map((card) => (
              <StatCard
                key={card.title}
                title={card.title}
                value={card.value}
                accentColor={card.accentColor}
                style={styles.statCard}
              />
            ))}
          </FadeInUp>
        )}

        <FadeInUp delay={40} style={styles.actions}>
          <PrimaryButton label="+ Log Care Record" onPress={handleAddCareRecord} />
          <PrimaryButton label="+ Add Reminder" onPress={handleAddReminder} style={styles.secondaryButton} />
        </FadeInUp>

        <SectionHeader title="Overdue" />
        {loading ? (
          <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
        ) : data.overdueReminders.length === 0 ? (
          <FadeInUp delay={60}>
            <EmptyState title="Nothing overdue" message="All care reminders are on track." />
          </FadeInUp>
        ) : (
          <FadeInUp delay={60} style={styles.listCard}>
            {data.overdueReminders.map((task, index) => {
              const typeOption = taskTypeByKey(task.type);
              return (
                <Pressable
                  key={task.id}
                  style={[styles.row, index === data.overdueReminders.length - 1 && styles.rowLast]}
                  onPress={() => handleOpenReminder(task.id)}
                >
                  <AppText style={styles.rowIcon}>{typeOption.icon}</AppText>
                  <View style={styles.rowMain}>
                    <AppText variant="cardTitle">{task.title}</AppText>
                    <AppText variant="caption" color={colors.secondaryText}>
                      {subjectLabel(task.birdId, task.flockId)} · {formatDueDate(task.dueDate)}
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
          </FadeInUp>
        )}

        <SectionHeader title="Upcoming" />
        {loading ? (
          <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
        ) : data.upcomingReminders.length === 0 ? (
          <FadeInUp delay={80}>
            <EmptyState title="No upcoming reminders" message="Add a reminder to plan ahead." />
          </FadeInUp>
        ) : (
          <FadeInUp delay={80} style={styles.listCard}>
            {data.upcomingReminders.slice(0, UPCOMING_LIMIT).map((task, index) => {
              const typeOption = taskTypeByKey(task.type);
              const lastIndex = Math.min(data.upcomingReminders.length, UPCOMING_LIMIT) - 1;
              return (
                <Pressable
                  key={task.id}
                  style={[styles.row, index === lastIndex && styles.rowLast]}
                  onPress={() => handleOpenReminder(task.id)}
                >
                  <AppText style={styles.rowIcon}>{typeOption.icon}</AppText>
                  <View style={styles.rowMain}>
                    <AppText variant="cardTitle">{task.title}</AppText>
                    <AppText variant="caption" color={colors.secondaryText}>
                      {subjectLabel(task.birdId, task.flockId)} · {formatDueDate(task.dueDate)} ·{' '}
                      {formatDueTime(task.dueDate)}
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
          </FadeInUp>
        )}

        <SectionHeader title="Recent Care Records" />
        {loading ? (
          <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
        ) : data.recentRecords.length === 0 ? (
          <FadeInUp delay={100}>
            <EmptyState title="No care records yet" message="Log a checkup, treatment, or vaccination to start." />
          </FadeInUp>
        ) : (
          <FadeInUp delay={100} style={styles.listCard}>
            {data.recentRecords.map((record, index) => {
              const typeOption = healthRecordTypeByKey(record.type);
              return (
                <Pressable
                  key={record.id}
                  style={[styles.row, index === data.recentRecords.length - 1 && styles.rowLast]}
                  onPress={() => handleOpenRecord(record.id)}
                >
                  <AppText style={styles.rowIcon}>{typeOption.icon}</AppText>
                  <View style={styles.rowMain}>
                    <AppText variant="cardTitle">{record.title}</AppText>
                    <AppText variant="caption" color={colors.secondaryText}>
                      {subjectLabel(record.birdId, record.flockId)} ·{' '}
                      {record.startDate ? formatDueDate(record.startDate) : 'No date'}
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
          </FadeInUp>
        )}

        <SectionHeader title="Birds Requiring Attention" />
        {loading ? (
          <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
        ) : data.attentionBirdIds.length === 0 && data.attentionFlockIds.length === 0 ? (
          <FadeInUp delay={120}>
            <EmptyState title="Everyone looks good" message="No overdue reminders or health alerts right now." />
          </FadeInUp>
        ) : (
          <FadeInUp delay={120} style={styles.listCard}>
            {data.attentionBirdIds.map((id, index) => (
              <Pressable
                key={`bird-${id}`}
                style={[
                  styles.row,
                  index === data.attentionBirdIds.length - 1 && data.attentionFlockIds.length === 0 && styles.rowLast,
                ]}
                onPress={() => handleOpenBird(id)}
              >
                <View style={styles.rowMain}>
                  <AppText variant="cardTitle">{birdName(id) ?? 'Unknown bird'}</AppText>
                </View>
              </Pressable>
            ))}
            {data.attentionFlockIds.map((id, index) => (
              <View
                key={`flock-${id}`}
                style={[styles.row, index === data.attentionFlockIds.length - 1 && styles.rowLast]}
              >
                <View style={styles.rowMain}>
                  <AppText variant="cardTitle">{flockName(id) ?? 'Unknown flock'}</AppText>
                </View>
              </View>
            ))}
          </FadeInUp>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statCard: {
    width: '48%',
    marginBottom: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  secondaryButton: {
    backgroundColor: colors.hatchOrange,
  },
  listCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  rowMain: {
    flex: 1,
  },
  loader: {
    marginVertical: spacing.lg,
  },
});
