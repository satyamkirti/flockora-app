import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppScreen, AppText, HealthTimelineRow, EmptyState, FadeInUp, ScreenHeader } from '../components';
import { useHealthRecords, useBirds, useFlocks } from '../hooks';
import { healthRecordTypeOptions, healthRecordTypeByKey } from '../data/healthRecordTypes';
import { formatDueDate } from '../utils/taskSchedule';
import { navigateToTab } from '../utils/crossTabNavigation';
import { HealthRecordFilters, HealthRecordStatus, HealthRecordType, emptyHealthRecordFilters } from '../types/healthRecord';
import { PulseStackParamList } from '../navigation/pulseTypes';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<PulseStackParamList, 'PulseHome'>;

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

export function PulseHomeScreen({ navigation }: Props) {
  const { birds } = useBirds();
  const { flocks } = useFlocks();
  const [searchText, setSearchText] = useState('');
  const [birdId, setBirdId] = useState<number | null>(null);
  const [flockId, setFlockId] = useState<number | null>(null);
  const [type, setType] = useState<HealthRecordType | null>(null);
  const [status, setStatus] = useState<HealthRecordStatus | null>(null);
  const [dateText, setDateText] = useState('');

  const filters: HealthRecordFilters = {
    ...emptyHealthRecordFilters,
    searchText,
    birdId,
    flockId,
    type,
    status,
    date: dateText,
  };
  const { records, loading } = useHealthRecords(filters);

  const birdOptions: ChipOption<number | null>[] = [
    { key: 'all', label: 'All Birds', value: null },
    ...birds.map((bird) => ({ key: String(bird.id), label: bird.name, value: bird.id })),
  ];

  const flockOptions: ChipOption<number | null>[] = [
    { key: 'all', label: 'All Flocks', value: null },
    ...flocks.map((flock) => ({ key: String(flock.id), label: flock.name, value: flock.id })),
  ];

  const typeOptions: ChipOption<HealthRecordType | null>[] = [
    { key: 'all', label: 'All Types', value: null },
    ...healthRecordTypeOptions.map((option) => ({ key: option.key, label: option.label, value: option.key })),
  ];

  const statusOptions: ChipOption<HealthRecordStatus | null>[] = [
    { key: 'all', label: 'All', value: null },
    { key: 'active', label: 'Active', value: 'active' as HealthRecordStatus },
    { key: 'completed', label: 'Completed', value: 'completed' as HealthRecordStatus },
  ];

  const handleOpenRecord = (recordId: number) => navigateToTab(navigation, 'Flock', 'HealthRecordDetail', { recordId });

  return (
    <AppScreen>
      <ScreenHeader title="Search Care Records" onBack={() => navigation.goBack()} />

      <TextInput
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Search by title, notes, or medicine"
        placeholderTextColor={colors.mutedText}
        style={styles.searchInput}
      />

      <FilterChips options={birdOptions} selected={birdId} onSelect={setBirdId} />
      <FilterChips options={flockOptions} selected={flockId} onSelect={setFlockId} />
      <FilterChips options={typeOptions} selected={type} onSelect={setType} />
      <FilterChips options={statusOptions} selected={status} onSelect={setStatus} />

      <TextInput
        value={dateText}
        onChangeText={setDateText}
        placeholder="Filter by date (YYYY-MM-DD)"
        placeholderTextColor={colors.mutedText}
        style={styles.dateInput}
      />

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
        ) : records.length === 0 ? (
          <FadeInUp>
            <EmptyState title="No matching records" message="Try adjusting your search or filters." />
          </FadeInUp>
        ) : (
          <FadeInUp style={styles.resultsCard}>
            {records.map((record) => {
              const typeOption = healthRecordTypeByKey(record.type);
              const birdName = birds.find((bird) => bird.id === record.birdId)?.name;
              const flockName = flocks.find((flock) => flock.id === record.flockId)?.name;
              return (
                <HealthTimelineRow
                  key={record.id}
                  icon={typeOption.icon}
                  title={record.title}
                  dateLabel={record.startDate ? formatDueDate(record.startDate) : 'No date'}
                  status={record.status}
                  birdName={birdName ?? flockName ?? 'Unassigned'}
                  onPress={() => handleOpenRecord(record.id)}
                />
              );
            })}
          </FadeInUp>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginTop: spacing.xs,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.primaryText,
    backgroundColor: colors.cardSurface,
    marginBottom: spacing.sm,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.primaryText,
    backgroundColor: colors.cardSurface,
    marginBottom: spacing.md,
  },
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  loader: {
    marginTop: spacing.xxl,
  },
  resultsCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
});
