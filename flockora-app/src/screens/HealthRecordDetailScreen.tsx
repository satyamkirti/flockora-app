import React from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import { AppScreen, AppText, PrimaryButton, IconButton, ScreenHeader, StatusPill, FadeInUp } from '../components';
import { useHealthRecord, useBirds, useFlocks } from '../hooks';
import { healthRecordRepository } from '../db/repositories';
import { cancelNotification } from '../services/notificationService';
import { healthRecordTypeByKey } from '../data/healthRecordTypes';
import { formatDueDate } from '../utils/taskSchedule';
import { confirmDestructive } from '../utils/confirmDestructive';
import { FlockStackParamList } from '../navigation/flockTypes';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<FlockStackParamList, 'HealthRecordDetail'>;

type DetailRow = { label: string; value: string };

export function HealthRecordDetailScreen({ route, navigation }: Props) {
  const { recordId } = route.params;
  const db = useSQLiteContext();
  const { record, loading, refresh } = useHealthRecord(recordId);
  const { birds } = useBirds();
  const { flocks } = useFlocks();

  if (loading) {
    return (
      <AppScreen>
        <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
      </AppScreen>
    );
  }

  if (!record) {
    return (
      <AppScreen>
        <View style={styles.notFound}>
          <AppText variant="screenTitle" align="center">
            Record not found
          </AppText>
          <PrimaryButton label="Go back" onPress={() => navigation.goBack()} style={styles.notFoundButton} />
        </View>
      </AppScreen>
    );
  }

  const typeOption = healthRecordTypeByKey(record.type);
  const birdName = birds.find((bird) => bird.id === record.birdId)?.name ?? null;
  const flockName = flocks.find((flock) => flock.id === record.flockId)?.name ?? null;
  const isActive = record.status === 'active';

  const detailRows: DetailRow[] = [
    { label: 'Bird', value: birdName ?? 'Not assigned' },
    { label: 'Flock', value: flockName ?? 'Not assigned' },
    { label: 'Start Date', value: record.startDate ? formatDueDate(record.startDate) : 'Not recorded' },
    { label: 'Time', value: record.time ?? 'Not recorded' },
    { label: 'End Date', value: record.endDate ? formatDueDate(record.endDate) : 'Not recorded' },
    { label: 'Medicine', value: record.medicine ?? 'Not recorded' },
    { label: 'Dosage', value: record.dosage ?? 'Not recorded' },
    { label: 'Veterinarian', value: record.veterinarian ?? 'Not recorded' },
    { label: 'Cost', value: record.cost != null ? `$${record.cost.toFixed(2)}` : 'Not recorded' },
    { label: 'Reminder', value: record.reminderDate ? formatDueDate(record.reminderDate) : 'None' },
  ];

  const handleToggleStatus = async () => {
    await healthRecordRepository.setStatus(db, record.id, isActive ? 'completed' : 'active');
    refresh();
  };

  const handleDelete = () => {
    confirmDestructive('Delete health record', `Delete "${record.title}"? This can't be undone.`, async () => {
      await cancelNotification(record.notificationId);
      await healthRecordRepository.deleteHealthRecord(db, record.id);
      navigation.goBack();
    });
  };

  return (
    <AppScreen>
      <ScreenHeader
        onBack={() => navigation.goBack()}
        rightAction={
          <IconButton
            name="pencil"
            accessibilityLabel="Edit care record"
            onPress={() =>
              navigation.navigate('AddEditHealthRecord', {
                birdId: record.birdId,
                flockId: record.flockId,
                recordId: record.id,
              })
            }
          />
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <FadeInUp style={styles.heroBlock}>
          <AppText style={styles.icon}>{typeOption.icon}</AppText>
          <AppText variant="display" align="center">
            {record.title}
          </AppText>
          <AppText variant="body" color={colors.secondaryText} align="center" style={styles.subtitle}>
            {typeOption.label}
          </AppText>
          <StatusPill label={isActive ? 'Active' : 'Completed'} tone={isActive ? 'warning' : 'success'} />
        </FadeInUp>

        {record.notes ? (
          <FadeInUp delay={60} style={styles.notesCard}>
            <AppText variant="cardTitle" style={styles.notesLabel}>
              Notes
            </AppText>
            <AppText variant="body" color={colors.secondaryText}>
              {record.notes}
            </AppText>
          </FadeInUp>
        ) : null}

        {record.documentUri ? (
          <FadeInUp delay={90} style={styles.notesCard}>
            <AppText variant="cardTitle" style={styles.notesLabel}>
              Document / Photo
            </AppText>
            <Image source={{ uri: record.documentUri }} style={styles.documentImage} />
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
            label={isActive ? 'Mark Completed' : 'Reopen Record'}
            onPress={handleToggleStatus}
            style={isActive ? undefined : styles.secondaryButton}
          />
          <PrimaryButton label="Delete Record" onPress={handleDelete} style={styles.deleteButton} />
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
  documentImage: {
    width: '100%',
    height: 200,
    borderRadius: radii.md,
    backgroundColor: colors.border,
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
