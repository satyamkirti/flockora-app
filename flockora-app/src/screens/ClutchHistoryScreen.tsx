import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppScreen, AppText, EmptyState, ClutchRow, FadeInUp, ScreenHeader } from '../components';
import { useClutches, useBreedingPairs, useBirds } from '../hooks';
import { speciesOptions, speciesByKey } from '../data/onboardingData';
import {
  deriveClutchSpecies,
  getIncubationDaysElapsed,
  getIncubationDaysRemaining,
  getIncubationPhase,
  getIncubationProgressPercent,
} from '../utils/breedingCalc';
import { Clutch, ClutchFilters, ClutchStatus, emptyClutchFilters } from '../types/breeding';
import { SpeciesKey } from '../types/onboarding';
import { FlockStackParamList } from '../navigation/flockTypes';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<FlockStackParamList, 'ClutchHistory'>;

type ChipOption<T> = { key: string; label: string; value: T };

function FilterChips<T>({
  options,
  selected,
  onSelect,
}: {
  options: ChipOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <Pressable
            key={option.key}
            onPress={() => onSelect(option.value)}
            style={[styles.chip, isSelected && styles.chipSelected]}
          >
            <AppText variant="caption" color={isSelected ? colors.cardSurface : colors.primaryText}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const statusChipOptions: ChipOption<ClutchStatus | null>[] = [
  { key: 'all', label: 'All Status', value: null },
  { key: 'active', label: 'Active', value: 'active' },
  { key: 'hatched', label: 'Hatched', value: 'hatched' },
  { key: 'failed', label: 'Failed', value: 'failed' },
  { key: 'cancelled', label: 'Cancelled', value: 'cancelled' },
];

export function ClutchHistoryScreen({ navigation }: Props) {
  const { pairs } = useBreedingPairs();
  const { birds } = useBirds();
  const [species, setSpecies] = useState<SpeciesKey | null>(null);
  const [breedingPairId, setBreedingPairId] = useState<number | null>(null);
  const [status, setStatus] = useState<ClutchStatus | null>(null);
  const [dateText, setDateText] = useState('');

  const filters: ClutchFilters = { ...emptyClutchFilters, species, breedingPairId, status, date: dateText };
  const { clutches, loading } = useClutches(filters);

  const speciesChipOptions: ChipOption<SpeciesKey | null>[] = [
    { key: 'all', label: 'All Species', value: null },
    ...speciesOptions.map((option) => ({ key: option.key, label: option.label, value: option.key })),
  ];
  const pairChipOptions: ChipOption<number | null>[] = [
    { key: 'all', label: 'All Pairs', value: null },
    ...pairs.map((pair) => ({ key: String(pair.id), label: pair.pairName || `Pair #${pair.id}`, value: pair.id })),
  ];

  const keyExtractor = useCallback((clutch: Clutch) => String(clutch.id), []);

  const renderItem = useCallback(
    ({ item: clutch }: { item: Clutch }) => {
      const clutchSpecies = deriveClutchSpecies(clutch, pairs, birds);
      const speciesOption = clutchSpecies ? speciesByKey(clutchSpecies) : null;
      const phase = getIncubationPhase(clutch);
      const daysElapsed = getIncubationDaysElapsed(clutch);
      const daysRemaining = getIncubationDaysRemaining(clutch);
      const progress = getIncubationProgressPercent(clutch);

      let daysLabel: string | null = null;
      if (phase === 'completed') {
        daysLabel = clutch.actualHatchDate ? `Hatched ${clutch.actualHatchDate}` : null;
      } else if (daysElapsed != null && daysRemaining != null) {
        daysLabel = `Day ${daysElapsed} · ${daysRemaining >= 0 ? `${daysRemaining} left` : `${Math.abs(daysRemaining)} overdue`}`;
      } else if (daysElapsed != null) {
        daysLabel = `Day ${daysElapsed}`;
      }

      return (
        <ClutchRow
          icon={speciesOption?.icon ?? '🥚'}
          title={clutch.clutchName || `Clutch #${clutch.id}`}
          eggsLabel={`${clutch.totalEggs} eggs · ${clutch.incubationType === 'incubator' ? 'Incubator' : 'Natural'}`}
          daysLabel={daysLabel}
          progress={progress}
          phase={phase}
          onPress={() => navigation.navigate('ClutchDetail', { clutchId: clutch.id })}
        />
      );
    },
    [pairs, birds, navigation]
  );

  return (
    <AppScreen>
      <ScreenHeader title="Incubation & History" onBack={() => navigation.goBack()} />

      <FilterChips options={speciesChipOptions} selected={species} onSelect={setSpecies} />
      <FilterChips options={pairChipOptions} selected={breedingPairId} onSelect={setBreedingPairId} />
      <FilterChips options={statusChipOptions} selected={status} onSelect={setStatus} />

      <TextInput
        value={dateText}
        onChangeText={setDateText}
        placeholder="Filter by laid date (YYYY-MM-DD)"
        placeholderTextColor={colors.mutedText}
        style={styles.dateInput}
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
      ) : clutches.length === 0 ? (
        <FadeInUp>
          <EmptyState title="No clutches found" message="Try adjusting your filters, or add your first clutch." />
        </FadeInUp>
      ) : (
        <FadeInUp style={styles.list}>
          <FlatList
            style={styles.list}
            data={clutches}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={renderItem}
          />
        </FadeInUp>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.leafGreen,
    borderColor: colors.leafGreen,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.primaryText,
    backgroundColor: colors.cardSurface,
    marginBottom: spacing.md,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  loader: {
    marginTop: spacing.xxl,
  },
});
