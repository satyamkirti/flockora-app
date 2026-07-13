import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { AppScreen, AppText, IconButton, SectionHeader, StatCard, BarChart, FadeInUp } from '../components';
import {
  useFlockDashboardStats,
  useEggStatistics,
  useEggProductionSeries,
  useFeedDashboard,
  useFeedStatistics,
  useHealthDashboardStats,
  useBreedingDashboard,
  useBreedingStatistics,
} from '../hooks';
import { formatDueDate } from '../utils/taskSchedule';
import { MoreStackParamList } from '../navigation/moreTypes';
import { colors, radii, spacing, shadows } from '../theme';

type Props = NativeStackScreenProps<MoreStackParamList, 'Reports'>;

function ViewLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <AppText variant="caption" color={colors.leafGreen}>
        {label} →
      </AppText>
    </Pressable>
  );
}

export function ReportsScreen({ navigation }: Props) {
  const { summary: flockSummary } = useFlockDashboardStats();
  const { statistics: eggStats } = useEggStatistics();
  const { points: eggLast30Days } = useEggProductionSeries(30);
  const { summary: feedDashboard } = useFeedDashboard();
  const { statistics: feedStats } = useFeedStatistics();
  const { stats: healthStats } = useHealthDashboardStats();
  const { summary: breedingDashboard } = useBreedingDashboard();
  const { statistics: breedingStats } = useBreedingStatistics();

  const goToFlockTab = (screen: string) => {
    navigation.getParent()?.dispatch(CommonActions.navigate({ name: 'Flock', params: { screen, params: {} } }));
  };

  const goToPulseTab = (screen: string) => {
    navigation.getParent()?.dispatch(CommonActions.navigate({ name: 'Pulse', params: { screen, params: {} } }));
  };

  const flockCards = [
    { title: 'Total Birds', value: String(flockSummary.totalBirds), accentColor: colors.leafGreen },
    { title: 'Groups', value: String(flockSummary.groupCount), accentColor: colors.hatchOrange },
    { title: 'Species', value: String(flockSummary.speciesCount), accentColor: colors.waterBlue },
    { title: 'Care Alerts', value: String(flockSummary.careAlertCount), accentColor: colors.alertCoral },
  ];

  const eggCards = [
    { title: 'Total Eggs', value: String(eggStats.totalEggs), accentColor: colors.sunflowerYellow },
    { title: 'Fertile', value: `${eggStats.fertilePercent.toFixed(1)}%`, accentColor: colors.leafGreen },
    { title: 'Cracked', value: `${eggStats.crackedPercent.toFixed(1)}%`, accentColor: colors.alertCoral },
    {
      title: 'Best Day',
      value: eggStats.bestDay ? String(eggStats.bestDay.total) : '—',
      subtitle: eggStats.bestDay ? formatDueDate(eggStats.bestDay.date) : 'No records yet',
      accentColor: colors.hatchOrange,
    },
  ];

  const feedCards = [
    { title: 'Low Stock', value: String(feedDashboard.lowStockCount), accentColor: colors.hatchOrange },
    { title: 'Out of Stock', value: String(feedDashboard.outOfStockCount), accentColor: colors.alertCoral },
    { title: 'Expiring Soon', value: String(feedDashboard.expiringSoonCount), accentColor: colors.sunflowerYellow },
    { title: 'Est. Monthly Cost', value: `$${feedStats.estimatedCost.toFixed(2)}`, accentColor: colors.waterBlue },
  ];

  const healthCards = [
    { title: 'Active Treatments', value: String(healthStats.activeTreatments), accentColor: colors.waterBlue },
    { title: 'Vaccinations Due', value: String(healthStats.vaccinationsDue), accentColor: colors.hatchOrange },
    { title: 'Health Alerts', value: String(healthStats.healthAlerts), accentColor: colors.alertCoral },
    { title: 'Recent Records', value: String(healthStats.recentRecordsCount), accentColor: colors.leafGreen },
  ];

  const breedingCards = [
    { title: 'Active Pairs', value: String(breedingDashboard.activePairs), accentColor: colors.leafGreen },
    { title: 'Active Clutches', value: String(breedingDashboard.activeClutches), accentColor: colors.hatchOrange },
    { title: 'Hatch Rate', value: `${breedingStats.hatchRatePercent.toFixed(1)}%`, accentColor: colors.waterBlue },
    { title: 'Fertility Rate', value: `${breedingStats.fertilityRatePercent.toFixed(1)}%`, accentColor: colors.sunflowerYellow },
  ];

  const eggBars = eggLast30Days.map((point) => ({ label: formatDueDate(point.date), value: point.total }));

  return (
    <AppScreen>
      <View style={styles.headerRow}>
        <View>
          <AppText variant="display">Reports & Analytics</AppText>
          <AppText variant="body" color={colors.secondaryText} style={styles.subtitle}>
            A cross-flock view of everything you've logged.
          </AppText>
        </View>
        <IconButton name="cloud-download-outline" onPress={() => navigation.navigate('BackupRestore')} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <SectionHeader title="Flock Overview" action={<ViewLink label="View" onPress={() => goToFlockTab('FlockHome')} />} />
        <FadeInUp style={styles.cardGrid}>
          {flockCards.map((card) => (
            <StatCard key={card.title} title={card.title} value={card.value} accentColor={card.accentColor} style={styles.statCard} />
          ))}
        </FadeInUp>

        <SectionHeader title="Egg Production" action={<ViewLink label="View" onPress={() => goToFlockTab('EggDashboard')} />} />
        <FadeInUp delay={40} style={styles.cardGrid}>
          {eggCards.map((card) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
              accentColor={card.accentColor}
              style={styles.statCard}
            />
          ))}
        </FadeInUp>
        <FadeInUp delay={60} style={[styles.chartCard, shadows.card]}>
          <AppText variant="caption" color={colors.mutedText} style={styles.chartLabel}>
            Last 30 Days
          </AppText>
          <BarChart data={eggBars} />
        </FadeInUp>

        <SectionHeader title="Feed & Inventory" action={<ViewLink label="View" onPress={() => goToFlockTab('FeedInventory')} />} />
        <FadeInUp delay={80} style={styles.cardGrid}>
          {feedCards.map((card) => (
            <StatCard key={card.title} title={card.title} value={card.value} accentColor={card.accentColor} style={styles.statCard} />
          ))}
        </FadeInUp>

        <SectionHeader title="Health & Care" action={<ViewLink label="View" onPress={() => goToPulseTab('CareDashboard')} />} />
        <FadeInUp delay={100} style={styles.cardGrid}>
          {healthCards.map((card) => (
            <StatCard key={card.title} title={card.title} value={card.value} accentColor={card.accentColor} style={styles.statCard} />
          ))}
        </FadeInUp>

        <SectionHeader title="Breeding & Hatching" action={<ViewLink label="View" onPress={() => goToFlockTab('BreedingHub')} />} />
        <FadeInUp delay={120} style={[styles.cardGrid, styles.lastCardGrid]}>
          {breedingCards.map((card) => (
            <StatCard key={card.title} title={card.title} value={card.value} accentColor={card.accentColor} style={styles.statCard} />
          ))}
        </FadeInUp>
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
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  lastCardGrid: {
    marginBottom: spacing.lg,
  },
  statCard: {
    width: '48%',
    marginBottom: spacing.sm,
  },
  chartCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  chartLabel: {
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
});
