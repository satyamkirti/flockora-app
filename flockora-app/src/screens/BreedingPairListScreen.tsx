import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import { AppScreen, AppText, PrimaryButton, IconButton, EmptyState, BreedingPairRow, FadeInUp } from '../components';
import { useBreedingPairs, useBirds } from '../hooks';
import { breedingRepository } from '../db/repositories';
import { formatDueDate } from '../utils/taskSchedule';
import { FlockStackParamList } from '../navigation/flockTypes';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<FlockStackParamList, 'BreedingPairList'>;

export function BreedingPairListScreen({ navigation }: Props) {
  const db = useSQLiteContext();
  const { pairs, loading } = useBreedingPairs();
  const { birds } = useBirds();
  const [clutchCounts, setClutchCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        pairs.map(async (pair) => [pair.id, await breedingRepository.getClutchCountForPair(db, pair.id)] as const)
      );
      if (!cancelled) {
        setClutchCounts(Object.fromEntries(entries));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [db, pairs]);

  return (
    <AppScreen>
      <View style={styles.headerRow}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
        <AppText variant="sectionTitle">Breeding Pairs</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
        ) : pairs.length === 0 ? (
          <FadeInUp>
            <EmptyState title="No breeding pairs yet" message="Add your first pair to start tracking clutches." />
          </FadeInUp>
        ) : (
          <FadeInUp style={styles.listCard}>
            {pairs.map((pair) => {
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
                  clutchCount={clutchCounts[pair.id] ?? 0}
                  onPress={() => navigation.navigate('AddEditBreedingPair', { pairId: pair.id })}
                />
              );
            })}
          </FadeInUp>
        )}
      </ScrollView>

      <PrimaryButton label="+ Add Pair" onPress={() => navigation.navigate('AddEditBreedingPair', {})} />
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
    paddingBottom: spacing.lg,
  },
  loader: {
    marginTop: spacing.xxl,
  },
  listCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
});
