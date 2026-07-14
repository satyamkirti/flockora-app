import React from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import {
  AppScreen,
  AppText,
  PrimaryButton,
  IconButton,
  StatusPill,
  ProgressBar,
  FadeInUp,
} from '../components';
import { useClutch, useBreedingPairs, useBirds, useCandlingRecords, useHatchRecord } from '../hooks';
import { breedingRepository } from '../db/repositories';
import { cancelNotification } from '../services/notificationService';
import { speciesByKey } from '../data/onboardingData';
import { formatDueDate } from '../utils/taskSchedule';
import {
  computeClutchFertilitySummary,
  computeClutchHatchSummary,
  deriveClutchSpecies,
  getIncubationDaysElapsed,
  getIncubationDaysRemaining,
  getIncubationPhase,
  getIncubationProgressPercent,
  incubationPhaseLabels,
} from '../utils/breedingCalc';
import { FlockStackParamList } from '../navigation/flockTypes';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<FlockStackParamList, 'ClutchDetail'>;

type DetailRow = { label: string; value: string };

export function ClutchDetailScreen({ route, navigation }: Props) {
  const { clutchId } = route.params;
  const db = useSQLiteContext();
  const { clutch, loading } = useClutch(clutchId);
  const { pairs } = useBreedingPairs();
  const { birds } = useBirds();
  const { records: candlingRecords, refresh: refreshCandling } = useCandlingRecords(clutchId);
  const { record: hatchRecord } = useHatchRecord(clutchId);

  if (loading) {
    return (
      <AppScreen>
        <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
      </AppScreen>
    );
  }

  if (!clutch) {
    return (
      <AppScreen>
        <View style={styles.notFound}>
          <AppText variant="screenTitle" align="center">
            Clutch not found
          </AppText>
          <PrimaryButton label="Go back" onPress={() => navigation.goBack()} style={styles.notFoundButton} />
        </View>
      </AppScreen>
    );
  }

  const species = deriveClutchSpecies(clutch, pairs, birds);
  const speciesOption = species ? speciesByKey(species) : null;
  const phase = getIncubationPhase(clutch);
  const phaseMeta = incubationPhaseLabels[phase];
  const daysElapsed = getIncubationDaysElapsed(clutch);
  const daysRemaining = getIncubationDaysRemaining(clutch);
  const progress = getIncubationProgressPercent(clutch);
  const latestCandling = candlingRecords[0] ?? null;
  const fertilitySummary = computeClutchFertilitySummary(clutch, latestCandling);
  const hatchSummary = computeClutchHatchSummary(clutch, hatchRecord, latestCandling);

  const detailRows: DetailRow[] = [
    { label: 'Eggs Set', value: String(clutch.totalEggs) },
    { label: 'Incubation Type', value: clutch.incubationType === 'incubator' ? clutch.incubatorName || 'Incubator' : 'Natural' },
    { label: 'Laid Date', value: formatDueDate(clutch.laidDate) },
    { label: 'Incubation Start', value: clutch.incubationStartDate ? formatDueDate(clutch.incubationStartDate) : 'Not set' },
    { label: 'Expected Hatch', value: clutch.expectedHatchDate ? formatDueDate(clutch.expectedHatchDate) : 'Not set' },
    { label: 'Actual Hatch', value: clutch.actualHatchDate ? formatDueDate(clutch.actualHatchDate) : 'Not yet' },
  ];

  const handleDelete = () => {
    Alert.alert('Delete clutch', `Delete "${clutch.clutchName || `Clutch #${clutch.id}`}"? This removes its candling and hatch records too.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await cancelNotification(clutch.candlingNotificationId);
          await cancelNotification(clutch.hatchExpectedNotificationId);
          await cancelNotification(clutch.hatchDueNotificationId);
          await breedingRepository.deleteClutch(db, clutch.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleDeleteCandling = (recordId: number) => {
    Alert.alert('Delete candling record', 'Are you sure you want to delete this record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await breedingRepository.deleteCandlingRecord(db, recordId);
          refreshCandling();
        },
      },
    ]);
  };

  const canAddBirds = hatchRecord != null && hatchRecord.hatchedEggs > 0 && !hatchRecord.birdsCreated;

  return (
    <AppScreen>
      <View style={styles.headerRow}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} accessibilityLabel="Go back" />
        <IconButton
          name="pencil"
          onPress={() => navigation.navigate('AddEditClutch', { clutchId: clutch.id })}
          accessibilityLabel="Edit clutch"
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <FadeInUp style={styles.heroBlock}>
          <AppText style={styles.icon}>{speciesOption?.icon ?? '🥚'}</AppText>
          <AppText variant="display" align="center">
            {clutch.clutchName || `Clutch #${clutch.id}`}
          </AppText>
          <AppText variant="body" color={colors.secondaryText} align="center" style={styles.subtitle}>
            {speciesOption?.label ?? 'Species unknown'}
          </AppText>
          <StatusPill label={phaseMeta.label} tone={phaseMeta.tone} />
        </FadeInUp>

        <FadeInUp delay={40} style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <AppText variant="sectionTitle">Incubation Progress</AppText>
            {daysRemaining != null ? (
              <AppText variant="caption" color={colors.secondaryText}>
                {daysRemaining >= 0 ? `${daysRemaining} days left` : `${Math.abs(daysRemaining)} days overdue`}
              </AppText>
            ) : null}
          </View>
          {progress != null ? <ProgressBar progress={progress / 100} /> : null}
          {daysElapsed != null ? (
            <AppText variant="caption" color={colors.mutedText} style={styles.progressNote}>
              Day {daysElapsed} of incubation
            </AppText>
          ) : null}
        </FadeInUp>

        <FadeInUp delay={80} style={styles.card}>
          {detailRows.map((row, index) => (
            <View key={row.label} style={[styles.row, index === detailRows.length - 1 && styles.rowLast]}>
              <AppText variant="caption" color={colors.mutedText}>
                {row.label}
              </AppText>
              <AppText variant="cardTitle">{row.value}</AppText>
            </View>
          ))}
        </FadeInUp>

        <FadeInUp delay={120} style={styles.sectionHeaderRow}>
          <AppText variant="sectionTitle">Candling</AppText>
          <Pressable onPress={() => navigation.navigate('AddEditCandlingRecord', { clutchId: clutch.id })}>
            <AppText variant="button" color={colors.leafGreen}>
              + Record
            </AppText>
          </Pressable>
        </FadeInUp>

        {fertilitySummary ? (
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <AppText variant="caption" color={colors.mutedText}>
                Fertility Rate
              </AppText>
              <AppText variant="cardTitle">{fertilitySummary.fertilityRatePercent.toFixed(1)}%</AppText>
            </View>
            <AppText variant="caption" color={colors.secondaryText}>
              {fertilitySummary.fertileEggs} fertile · {fertilitySummary.infertileEggs} infertile ·{' '}
              {fertilitySummary.uncertainEggs} uncertain · {fertilitySummary.deadEmbryos} dead embryos
            </AppText>
          </View>
        ) : (
          <AppText variant="caption" color={colors.mutedText} style={styles.emptyNote}>
            No candling records yet.
          </AppText>
        )}

        {candlingRecords.map((record) => (
          <View key={record.id} style={styles.historyRow}>
            <View style={styles.historyMain}>
              <AppText variant="cardTitle">{formatDueDate(record.date)}</AppText>
              <AppText variant="caption" color={colors.secondaryText}>
                {record.fertileEggs} fertile · {record.infertileEggs} infertile · {record.uncertainEggs} uncertain ·{' '}
                {record.deadEmbryos} dead
              </AppText>
            </View>
            <Pressable
              style={styles.historyIcon}
              onPress={() => navigation.navigate('AddEditCandlingRecord', { clutchId: clutch.id, recordId: record.id })}
              accessibilityRole="button"
              accessibilityLabel={`Edit candling record from ${formatDueDate(record.date)}`}
            >
              <Ionicons name="pencil" size={16} color={colors.mutedText} />
            </Pressable>
            <Pressable
              style={styles.historyIcon}
              onPress={() => handleDeleteCandling(record.id)}
              accessibilityRole="button"
              accessibilityLabel={`Delete candling record from ${formatDueDate(record.date)}`}
            >
              <Ionicons name="trash-outline" size={16} color={colors.alertCoral} />
            </Pressable>
          </View>
        ))}

        <FadeInUp delay={160} style={styles.sectionHeaderRow}>
          <AppText variant="sectionTitle">Hatch Results</AppText>
        </FadeInUp>

        {hatchSummary ? (
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <AppText variant="caption" color={colors.mutedText}>
                Hatch Rate
              </AppText>
              <AppText variant="cardTitle">{hatchSummary.hatchRatePercent.toFixed(1)}%</AppText>
            </View>
            <AppText variant="caption" color={colors.secondaryText}>
              {hatchSummary.hatchedEggs} hatched · {hatchSummary.failedEggs} failed · {hatchSummary.assistedHatches}{' '}
              assisted
              {hatchSummary.hatchabilityOfFertilePercent != null
                ? ` · ${hatchSummary.hatchabilityOfFertilePercent.toFixed(1)}% of fertile eggs hatched`
                : ''}
            </AppText>
          </View>
        ) : (
          <AppText variant="caption" color={colors.mutedText} style={styles.emptyNote}>
            No hatch record yet.
          </AppText>
        )}

        <FadeInUp delay={200} style={styles.actions}>
          <PrimaryButton
            label={hatchRecord ? 'Edit Hatch Record' : 'Record Hatch'}
            onPress={() => navigation.navigate('AddEditHatchRecord', { clutchId: clutch.id })}
          />
          {canAddBirds ? (
            <PrimaryButton
              label="Add hatched birds to Flockora"
              onPress={() => navigation.navigate('CreateBirdsFromHatch', { hatchRecordId: hatchRecord.id })}
              style={styles.secondaryButton}
            />
          ) : null}
          <PrimaryButton label="Delete Clutch" onPress={handleDelete} style={styles.deleteButton} />
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
  progressCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressNote: {
    marginTop: spacing.sm,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  statsCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyNote: {
    marginBottom: spacing.sm,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  historyMain: {
    flex: 1,
  },
  historyIcon: {
    marginLeft: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  secondaryButton: {
    backgroundColor: colors.hatchOrange,
  },
  deleteButton: {
    backgroundColor: colors.alertCoral,
  },
});
