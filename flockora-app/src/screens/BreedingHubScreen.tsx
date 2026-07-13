import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppScreen, AppText, IconButton, SectionHeader, StatCard, EmptyState, BreedingPairRow, ClutchRow, FadeInUp } from '../components';
import { useBreedingPairs, useClutches, useBirds, useBreedingDashboard } from '../hooks';
import { speciesByKey } from '../data/onboardingData';
import { formatDueDate } from '../utils/taskSchedule';
import {
  deriveClutchSpecies,
  getIncubationDaysElapsed,
  getIncubationDaysRemaining,
  getIncubationPhase,
  getIncubationProgressPercent,
} from '../utils/breedingCalc';
import { emptyClutchFilters } from '../types/breeding';
import { FlockStackParamList } from '../navigation/flockTypes';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<FlockStackParamList, 'BreedingHub'>;

export function BreedingHubScreen({ navigation }: Props) {
  const { pairs, loading: loadingPairs } = useBreedingPairs();
  const { clutches, loading: loadingClutches } = useClutches(emptyClutchFilters);
  const { birds } = useBirds();
  const { summary } = useBreedingDashboard();

  const activePairs = pairs.filter((pair) => pair.status === 'active').slice(0, 3);
  const activeClutches = clutches.filter((clutch) => clutch.status === 'active' && !clutch.actualHatchDate).slice(0, 3);
  const recentHatches = clutches.filter((clutch) => clutch.actualHatchDate != null).slice(0, 3);

  const summaryCards = [
    { title: 'Active Pairs', value: String(summary.activePairs), accentColor: colors.leafGreen },
    { title: 'Active Clutches', value: String(summary.activeClutches), accentColor: colors.hatchOrange },
    { title: 'Eggs Incubating', value: String(summary.eggsIncubating), accentColor: colors.sunflowerYellow },
    { title: 'Hatches Due Soon', value: String(summary.hatchesDueSoon), accentColor: colors.waterBlue },
  ];

  return (
    <AppScreen>
      <View style={styles.headerRow}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
        <AppText variant="sectionTitle">Breeding & Hatching</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <FadeInUp style={styles.summaryGrid}>
          {summaryCards.map((card) => (
            <StatCard key={card.title} title={card.title} value={card.value} accentColor={card.accentColor} style={styles.statCard} />
          ))}
        </FadeInUp>

        <FadeInUp delay={40} style={styles.actionsRow}>
          <Pressable style={styles.actionButton} onPress={() => navigation.navigate('AddEditBreedingPair', {})}>
            <AppText style={styles.actionIcon}>🧬</AppText>
            <AppText variant="caption" color={colors.primaryText}>
              Add Pair
            </AppText>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={() => navigation.navigate('AddEditClutch', {})}>
            <AppText style={styles.actionIcon}>🥚</AppText>
            <AppText variant="caption" color={colors.primaryText}>
              Add Clutch
            </AppText>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={() => navigation.navigate('ClutchHistory')}>
            <AppText style={styles.actionIcon}>🔦</AppText>
            <AppText variant="caption" color={colors.primaryText}>
              Candling
            </AppText>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={() => navigation.navigate('ClutchHistory')}>
            <AppText style={styles.actionIcon}>🐣</AppText>
            <AppText variant="caption" color={colors.primaryText}>
              Record Hatch
            </AppText>
          </Pressable>
        </FadeInUp>

        <SectionHeader
          title="Active Breeding Pairs"
          action={
            <Pressable onPress={() => navigation.navigate('BreedingPairList')}>
              <AppText variant="button" color={colors.leafGreen}>
                View All
              </AppText>
            </Pressable>
          }
        />
        {loadingPairs ? (
          <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
        ) : activePairs.length === 0 ? (
          <EmptyState title="No active pairs" message="Add a breeding pair to start tracking clutches." />
        ) : (
          <View style={styles.listCard}>
            {activePairs.map((pair) => {
              const maleName = birds.find((bird) => bird.id === pair.maleBirdId)?.name ?? 'Unknown';
              const femaleName = birds.find((bird) => bird.id === pair.femaleBirdId)?.name ?? 'Unknown';
              return (
                <BreedingPairRow
                  key={pair.id}
                  pairName={pair.pairName || `${maleName} × ${femaleName}`}
                  maleName={maleName}
                  femaleName={femaleName}
                  pairedDateLabel={formatDueDate(pair.pairedDate)}
                  status={pair.status}
                  clutchCount={clutches.filter((clutch) => clutch.breedingPairId === pair.id).length}
                  onPress={() => navigation.navigate('AddEditBreedingPair', { pairId: pair.id })}
                />
              );
            })}
          </View>
        )}

        <SectionHeader
          title="Active Clutches"
          action={
            <Pressable onPress={() => navigation.navigate('ClutchHistory')}>
              <AppText variant="button" color={colors.leafGreen}>
                View All
              </AppText>
            </Pressable>
          }
        />
        {loadingClutches ? (
          <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
        ) : activeClutches.length === 0 ? (
          <EmptyState title="No active clutches" message="Add a clutch to start incubation tracking." />
        ) : (
          <View style={styles.listCard}>
            {activeClutches.map((clutch) => {
              const clutchSpecies = deriveClutchSpecies(clutch, pairs, birds);
              const speciesOption = clutchSpecies ? speciesByKey(clutchSpecies) : null;
              const phase = getIncubationPhase(clutch);
              const daysElapsed = getIncubationDaysElapsed(clutch);
              const daysRemaining = getIncubationDaysRemaining(clutch);
              const progress = getIncubationProgressPercent(clutch);
              const daysLabel =
                daysElapsed != null && daysRemaining != null
                  ? `Day ${daysElapsed} · ${daysRemaining >= 0 ? `${daysRemaining} left` : `${Math.abs(daysRemaining)} overdue`}`
                  : null;
              return (
                <ClutchRow
                  key={clutch.id}
                  icon={speciesOption?.icon ?? '🥚'}
                  title={clutch.clutchName || `Clutch #${clutch.id}`}
                  eggsLabel={`${clutch.totalEggs} eggs`}
                  daysLabel={daysLabel}
                  progress={progress}
                  phase={phase}
                  onPress={() => navigation.navigate('ClutchDetail', { clutchId: clutch.id })}
                />
              );
            })}
          </View>
        )}

        <SectionHeader title="Recent Hatch Results" />
        {recentHatches.length === 0 ? (
          <EmptyState title="No hatches yet" message="Recorded hatches will show up here." />
        ) : (
          <View style={styles.listCard}>
            {recentHatches.map((clutch) => (
              <Pressable
                key={clutch.id}
                style={styles.hatchRow}
                onPress={() => navigation.navigate('ClutchDetail', { clutchId: clutch.id })}
              >
                <AppText variant="cardTitle">{clutch.clutchName || `Clutch #${clutch.id}`}</AppText>
                <AppText variant="caption" color={colors.secondaryText}>
                  Hatched {clutch.actualHatchDate ? formatDueDate(clutch.actualHatchDate) : ''}
                </AppText>
              </Pressable>
            ))}
          </View>
        )}
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
  headerSpacer: {
    width: 44,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    width: '48%',
    marginBottom: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xs,
  },
  actionIcon: {
    fontSize: 22,
    marginBottom: spacing.xs,
  },
  loader: {
    marginTop: spacing.xl,
  },
  listCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  hatchRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
