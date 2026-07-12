import React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import {
  AppScreen,
  AppText,
  PrimaryButton,
  IconButton,
  SectionHeader,
  StatCard,
  BarChart,
  FadeInUp,
} from '../components';
import {
  useEggDashboard,
  useEggStatistics,
  useEggProductionSeries,
  useEggMonthlyTrend,
  useBirds,
  useFlocks,
} from '../hooks';
import { eggRecordRepository } from '../db/repositories';
import { exportEggRecordsToCsv } from '../utils/eggExport';
import { formatDueDate } from '../utils/taskSchedule';
import { FlockStackParamList } from '../navigation/flockTypes';
import { colors, radii, spacing, shadows } from '../theme';

type Props = NativeStackScreenProps<FlockStackParamList, 'EggDashboard'>;

export function EggDashboardScreen({ navigation }: Props) {
  const db = useSQLiteContext();
  const { summary } = useEggDashboard();
  const { statistics } = useEggStatistics();
  const { points: last7Days } = useEggProductionSeries(7);
  const { points: last30Days } = useEggProductionSeries(30);
  const { points: monthlyTrend } = useEggMonthlyTrend(6);
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
      <View style={styles.headerRow}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
        <AppText variant="sectionTitle">Egg Production</AppText>
        <IconButton name="share-outline" onPress={handleExport} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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

        <FadeInUp delay={180} style={styles.actions}>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
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
});
