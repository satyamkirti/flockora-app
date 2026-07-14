import React from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import {
  AppScreen,
  AppText,
  PrimaryButton,
  IconButton,
  SectionHeader,
  ScreenHeader,
  StatCard,
  BarChart,
  EmptyState,
  FadeInUp,
} from '../components';
import {
  useEggDashboard,
  useEggStatistics,
  useEggProductionSeries,
  useEggMonthlyTrend,
  useEggHistory,
  useBirds,
  useFlocks,
} from '../hooks';
import { eggRecordRepository } from '../db/repositories';
import { exportEggRecordsToCsv } from '../utils/eggExport';
import { formatDueDate } from '../utils/taskSchedule';
import { emptyEggRecordFilters } from '../types/eggRecord';
import { FlockStackParamList } from '../navigation/flockTypes';
import { colors, radii, spacing, shadows } from '../theme';

const RECENT_RECORDS_LIMIT = 5;

type Props = NativeStackScreenProps<FlockStackParamList, 'EggDashboard'>;

export function EggDashboardScreen({ navigation }: Props) {
  const db = useSQLiteContext();
  const { summary, loading: summaryLoading } = useEggDashboard();
  const { statistics } = useEggStatistics();
  const { points: last7Days } = useEggProductionSeries(7);
  const { points: last30Days } = useEggProductionSeries(30);
  const { points: monthlyTrend } = useEggMonthlyTrend(6);
  const { records: recentRecords, loading: recentLoading } = useEggHistory(emptyEggRecordFilters);
  const { flocks } = useFlocks();
  const { birds } = useBirds();

  const summaryCards = [
    { title: "Today's Eggs", value: String(summary.todayTotal), accentColor: colors.sunflowerYellow },
    { title: 'This Week', value: String(summary.weekTotal), accentColor: colors.leafGreen },
    { title: 'This Month', value: String(summary.monthTotal), accentColor: colors.hatchOrange },
    { title: 'Avg / Day', value: summary.averagePerDay.toFixed(1), accentColor: colors.waterBlue },
  ];

  const statRows = [
    { label: 'Total Eggs', value: String(statistics.totalEggs) },
    { label: 'Fertile', value: `${statistics.fertilePercent.toFixed(1)}%` },
    { label: 'Broken', value: `${statistics.crackedPercent.toFixed(1)}%` },
    { label: 'Dirty', value: `${statistics.dirtyPercent.toFixed(1)}%` },
    { label: 'Double Yolk', value: `${statistics.doubleYolkPercent.toFixed(1)}%` },
    {
      label: 'Best Day',
      value: statistics.bestDay ? `${formatDueDate(statistics.bestDay.date)} · ${statistics.bestDay.total}` : 'None yet',
    },
  ];

  const handleExport = async () => {
    const records = await eggRecordRepository.list(db);
    if (records.length === 0) {
      Alert.alert('Nothing to export', 'Log some egg records first.');
      return;
    }
    const flockNameById = new Map(flocks.map((flock) => [flock.id, flock.name]));
    const birdNameById = new Map(birds.map((bird) => [bird.id, bird.name]));
    const shared = await exportEggRecordsToCsv(records, flockNameById, birdNameById);
    if (!shared) {
      Alert.alert('Sharing unavailable', 'Your device does not support sharing files right now.');
    }
  };

  const last7Bars = last7Days.map((point) => ({ label: formatDueDate(point.date), value: point.total }));
  const last30Bars = last30Days.map((point) => ({ label: formatDueDate(point.date), value: point.total }));
  const monthlyBars = monthlyTrend.map((point) => ({ label: point.monthLabel, value: point.total }));

  return (
    <AppScreen>
      <ScreenHeader
        title="Egg Production"
        onBack={() => navigation.goBack()}
        rightAction={<IconButton name="share-outline" onPress={handleExport} accessibilityLabel="Export egg records as CSV" />}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {summaryLoading ? (
          <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
        ) : (
          <FadeInUp style={styles.summaryGrid}>
            {summaryCards.map((card) => (
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

        <FadeInUp delay={40} style={styles.bestDayCard}>
          <AppText variant="caption" color={colors.mutedText}>
            Best Production Day
          </AppText>
          <AppText variant="cardTitle" style={styles.bestDayValue}>
            {summary.bestDay ? `${formatDueDate(summary.bestDay.date)} · ${summary.bestDay.total} eggs` : 'No records yet'}
          </AppText>
        </FadeInUp>

        <SectionHeader title="Last 7 Days" />
        <FadeInUp delay={80} style={[styles.chartCard, shadows.card]}>
          <BarChart data={last7Bars} />
        </FadeInUp>

        <SectionHeader title="Last 30 Days" />
        <FadeInUp delay={100} style={[styles.chartCard, shadows.card]}>
          <BarChart data={last30Bars} />
        </FadeInUp>

        <SectionHeader title="Monthly Trend" />
        <FadeInUp delay={120} style={[styles.chartCard, shadows.card]}>
          <BarChart data={monthlyBars} />
        </FadeInUp>

        <SectionHeader title="Statistics" />
        <FadeInUp delay={140} style={styles.statsCard}>
          {statRows.map((row, index) => (
            <View key={row.label} style={[styles.statRow, index === statRows.length - 1 && styles.statRowLast]}>
              <AppText variant="caption" color={colors.mutedText}>
                {row.label}
              </AppText>
              <AppText variant="cardTitle">{row.value}</AppText>
            </View>
          ))}
        </FadeInUp>

        <SectionHeader title="Recent Collections" />
        {recentLoading ? (
          <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
        ) : recentRecords.length === 0 ? (
          <FadeInUp delay={160}>
            <EmptyState title="No collections yet" message="Log your first egg collection to see it here." />
          </FadeInUp>
        ) : (
          <FadeInUp delay={160} style={styles.recentCard}>
            {recentRecords.slice(0, RECENT_RECORDS_LIMIT).map((record, index) => {
              const flockName = flocks.find((flock) => flock.id === record.flockId)?.name;
              const birdName = birds.find((bird) => bird.id === record.birdId)?.name;
              return (
                <Pressable
                  key={record.id}
                  style={[styles.recentRow, index === Math.min(recentRecords.length, RECENT_RECORDS_LIMIT) - 1 && styles.recentRowLast]}
                  onPress={() => navigation.navigate('AddEditEggRecord', { recordId: record.id })}
                >
                  <View style={styles.recentMain}>
                    <AppText variant="cardTitle">
                      {formatDueDate(record.date)}
                      {record.time ? ` · ${record.time}` : ''}
                    </AppText>
                    <AppText variant="caption" color={colors.secondaryText}>
                      {birdName ?? flockName ?? 'Unassigned'}
                    </AppText>
                  </View>
                  <AppText variant="cardTitle" color={colors.leafGreen}>
                    {record.totalEggs}
                  </AppText>
                </Pressable>
              );
            })}
          </FadeInUp>
        )}

        <FadeInUp delay={200} style={styles.actions}>
          <PrimaryButton label="+ Log Eggs" onPress={() => navigation.navigate('AddEditEggRecord', {})} />
          <PrimaryButton
            label="View History"
            onPress={() => navigation.navigate('EggHistory')}
            style={styles.secondaryButton}
          />
        </FadeInUp>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xl,
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
  bestDayCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  bestDayValue: {
    marginTop: spacing.xs,
  },
  chartCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  statsCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  recentCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  recentRowLast: {
    borderBottomWidth: 0,
  },
  recentMain: {
    flex: 1,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  statRowLast: {
    borderBottomWidth: 0,
  },
  actions: {
    gap: spacing.sm,
  },
  secondaryButton: {
    backgroundColor: colors.hatchOrange,
  },
  loader: {
    marginVertical: spacing.lg,
  },
});
