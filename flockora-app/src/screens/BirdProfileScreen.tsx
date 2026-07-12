import React from 'react';
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
  FadeInUp,
} from '../components';
import { useBird, useFlocks } from '../hooks';
import { birdRepository } from '../db/repositories';
import { speciesByKey } from '../data/onboardingData';
import { FlockStackParamList } from '../navigation/flockTypes';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<FlockStackParamList, 'BirdProfile'>;

type DetailRow = { label: string; value: string };

export function BirdProfileScreen({ route, navigation }: Props) {
  const { birdId } = route.params;
  const db = useSQLiteContext();
  const { bird, loading, refresh } = useBird(birdId);
  const { flocks } = useFlocks();

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
    { label: 'Sex', value: bird.sex || 'Not recorded' },
    { label: bird.dateOfBirth ? 'Date of Birth' : 'Age', value: bird.dateOfBirth || bird.ageEstimate || 'Not recorded' },
    { label: 'Acquired', value: bird.acquisitionDate || 'Not recorded' },
    { label: 'Color', value: bird.color || 'Not recorded' },
    { label: 'Weight', value: bird.weight != null ? `${bird.weight} ${bird.weightUnit ?? 'kg'}` : 'Not recorded' },
    { label: 'Flock', value: flockName },
  ];

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

        {bird.notes ? (
          <FadeInUp delay={140} style={styles.notesCard}>
            <AppText variant="cardTitle" style={styles.notesLabel}>
              Notes
            </AppText>
            <AppText variant="body" color={colors.secondaryText}>
              {bird.notes}
            </AppText>
          </FadeInUp>
        ) : null}

        <FadeInUp delay={200} style={styles.actions}>
          <PrimaryButton
            label={bird.isActive ? 'Mark Inactive' : 'Mark Active'}
            onPress={handleToggleActive}
            style={styles.secondaryButton}
          />
          <PrimaryButton label="Delete Bird" onPress={handleDelete} style={styles.deleteButton} />
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
  subtitle: {
    marginBottom: spacing.xs,
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
});
