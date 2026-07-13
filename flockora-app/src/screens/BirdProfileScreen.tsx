import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import {
  AppScreen,
  AppText,
  PrimaryButton,
  IconButton,
  BirdPhotoBadge,
  StatusPill,
  StatCard,
  SegmentedControl,
  HealthTimelineRow,
  EmptyState,
  FadeInUp,
} from '../components';
import { useBird, useFlocks, useHealthStats, useBirdHealthHistory } from '../hooks';
import { birdRepository } from '../db/repositories';
import { speciesByKey } from '../data/onboardingData';
import { healthRecordTypeByKey } from '../data/healthRecordTypes';
import { formatDueDate } from '../utils/taskSchedule';
import { FlockStackParamList } from '../navigation/flockTypes';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<FlockStackParamList, 'BirdProfile'>;

type DetailRow = { label: string; value: string };

type ProfileTab = 'details' | 'health';

const profileTabOptions: { label: string; value: ProfileTab }[] = [
  { label: 'Details', value: 'details' },
  { label: 'Health', value: 'health' },
];

export function BirdProfileScreen({ route, navigation }: Props) {
  const { birdId } = route.params;
  const db = useSQLiteContext();
  const { bird, loading, refresh } = useBird(birdId);
  const { flocks } = useFlocks();
  const { stats: healthStats } = useHealthStats(birdId);
  const { records: healthRecords, loading: loadingHealth } = useBirdHealthHistory(birdId);
  const [activeTab, setActiveTab] = useState<ProfileTab>('details');

  if (loading) {
    return (
      <AppScreen>
        <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
      </AppScreen>
    );
  }

  if (!bird) {
    return (
      <AppScreen>
        <View style={styles.notFound}>
          <AppText variant="screenTitle" align="center">
            Bird not found
          </AppText>
          <PrimaryButton label="Go back" onPress={() => navigation.goBack()} style={styles.notFoundButton} />
        </View>
      </AppScreen>
    );
  }

  const species = speciesByKey(bird.species);
  const flockName = flocks.find((flock) => flock.id === bird.flockId)?.name ?? 'Unassigned';

  const detailRows: DetailRow[] = [
    { label: 'Species', value: species.label },
    { label: 'Sex', value: bird.sex || 'Not recorded' },
    { label: bird.dateOfBirth ? 'Date of Birth' : 'Age', value: bird.dateOfBirth || bird.ageEstimate || 'Not recorded' },
    { label: 'Acquired', value: bird.acquisitionDate || 'Not recorded' },
    { label: 'Color', value: bird.color || 'Not recorded' },
    { label: 'Tag / Band ID', value: bird.tagId || 'Not recorded' },
    { label: 'Weight', value: bird.weight != null ? `${bird.weight} ${bird.weightUnit ?? 'kg'}` : 'Not recorded' },
    { label: 'Flock', value: flockName },
  ];

  const healthStatCards = [
    { title: 'Treatments', value: String(healthStats.treatmentCount), accentColor: colors.hatchOrange },
    { title: 'Vaccinations', value: String(healthStats.vaccinationsCompleted), accentColor: colors.leafGreen },
    { title: 'Expenses', value: `$${healthStats.totalExpenses.toFixed(2)}`, accentColor: colors.waterBlue },
    { title: 'Active Medicines', value: String(healthStats.activeMedicineCount), accentColor: colors.sunflowerYellow },
  ];

  const upcomingReminders = healthRecords.filter(
    (record) => record.status === 'active' && record.reminderDate != null && new Date(record.reminderDate) >= new Date()
  );

  const handleToggleActive = async () => {
    await birdRepository.setActive(db, bird.id, !bird.isActive);
    refresh();
  };

  const handleDelete = () => {
    Alert.alert('Delete bird', `Remove ${bird.name} from your flock? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await birdRepository.remove(db, bird.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <AppScreen>
      <View style={styles.headerRow}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
        <IconButton name="pencil" onPress={() => navigation.navigate('AddEditBird', { birdId: bird.id })} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <FadeInUp style={styles.heroBlock}>
          <BirdPhotoBadge icon={species.icon} size={112} />
          <AppText variant="display" align="center">
            {bird.name}
          </AppText>
          <AppText variant="body" color={colors.secondaryText} align="center" style={styles.subtitle}>
            {bird.breed || species.label}
          </AppText>
          <StatusPill label={bird.isActive ? 'Active' : 'Inactive'} tone={bird.isActive ? 'success' : 'neutral'} />
        </FadeInUp>

        <View style={styles.tabSwitch}>
          <SegmentedControl options={profileTabOptions} value={activeTab} onChange={setActiveTab} />
        </View>

        {activeTab === 'details' ? (
          <>
            <FadeInUp style={styles.card}>
              {detailRows.map((row, index) => (
                <View key={row.label} style={[styles.row, index === detailRows.length - 1 && styles.rowLast]}>
                  <AppText variant="caption" color={colors.mutedText}>
                    {row.label}
                  </AppText>
                  <AppText variant="cardTitle">{row.value}</AppText>
                </View>
              ))}
            </FadeInUp>

            {bird.notes ? (
              <FadeInUp delay={60} style={styles.notesCard}>
                <AppText variant="cardTitle" style={styles.notesLabel}>
                  Notes
                </AppText>
                <AppText variant="body" color={colors.secondaryText}>
                  {bird.notes}
                </AppText>
              </FadeInUp>
            ) : null}

            <FadeInUp delay={120} style={styles.actions}>
              <PrimaryButton
                label={bird.isActive ? 'Mark Inactive' : 'Mark Active'}
                onPress={handleToggleActive}
                style={styles.secondaryButton}
              />
              <PrimaryButton label="Delete Bird" onPress={handleDelete} style={styles.deleteButton} />
            </FadeInUp>
          </>
        ) : (
          <>
            <FadeInUp style={styles.healthStatsGrid}>
              {healthStatCards.map((card) => (
                <StatCard
                  key={card.title}
                  title={card.title}
                  value={card.value}
                  accentColor={card.accentColor}
                  style={styles.healthStatCard}
                />
              ))}
            </FadeInUp>

            {upcomingReminders.length > 0 ? (
              <FadeInUp delay={40} style={styles.remindersCard}>
                <AppText variant="cardTitle" style={styles.notesLabel}>
                  Upcoming Reminders
                </AppText>
                {upcomingReminders.map((record) => {
                  const typeOption = healthRecordTypeByKey(record.type);
                  return (
                    <View key={record.id} style={styles.reminderRow}>
                      <AppText style={styles.reminderIcon}>{typeOption.icon}</AppText>
                      <AppText variant="body" style={styles.reminderText}>
                        {record.title}
                      </AppText>
                      <AppText variant="caption" color={colors.secondaryText}>
                        {formatDueDate(record.reminderDate as string)}
                      </AppText>
                    </View>
                  );
                })}
              </FadeInUp>
            ) : null}

            <FadeInUp delay={80}>
              <PrimaryButton
                label="+ Add Health Record"
                onPress={() => navigation.navigate('AddEditHealthRecord', { birdId: bird.id })}
                style={styles.addHealthButton}
              />
            </FadeInUp>

            {loadingHealth ? (
              <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
            ) : healthRecords.length === 0 ? (
              <FadeInUp delay={120}>
                <EmptyState title="No health records yet" message="Log a checkup, treatment, or vaccination to start this bird's medical timeline." />
              </FadeInUp>
            ) : (
              <FadeInUp delay={120} style={styles.timelineCard}>
                {healthRecords.map((record) => {
                  const typeOption = healthRecordTypeByKey(record.type);
                  return (
                    <HealthTimelineRow
                      key={record.id}
                      icon={typeOption.icon}
                      title={record.title}
                      dateLabel={record.startDate ? formatDueDate(record.startDate) : 'No date'}
                      status={record.status}
                      onPress={() => navigation.navigate('HealthRecordDetail', { recordId: record.id })}
                    />
                  );
                })}
              </FadeInUp>
            )}
          </>
        )}
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
  subtitle: {
    marginBottom: spacing.xs,
  },
  tabSwitch: {
    marginBottom: spacing.lg,
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
  actions: {
    gap: spacing.sm,
  },
  secondaryButton: {
    backgroundColor: colors.hatchOrange,
  },
  deleteButton: {
    backgroundColor: colors.alertCoral,
  },
  healthStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  healthStatCard: {
    width: '48%',
  },
  remindersCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  reminderIcon: {
    fontSize: 18,
  },
  reminderText: {
    flex: 1,
  },
  addHealthButton: {
    marginBottom: spacing.lg,
  },
  timelineCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
});
