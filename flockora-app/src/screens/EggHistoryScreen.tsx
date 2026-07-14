import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { AppScreen, AppText, EmptyState, FadeInUp, ScreenHeader } from '../components';
import { useEggHistory, useFlocks } from '../hooks';
import { eggRecordRepository } from '../db/repositories';
import { formatDueDate } from '../utils/taskSchedule';
import { confirmDestructive } from '../utils/confirmDestructive';
import { EggRecord, EggRecordFilters, emptyEggRecordFilters } from '../types/eggRecord';
import { FlockStackParamList } from '../navigation/flockTypes';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<FlockStackParamList, 'EggHistory'>;

type FlockChipOption = { key: string; label: string; value: number | null };

export function EggHistoryScreen({ navigation }: Props) {
  const db = useSQLiteContext();
  const { flocks } = useFlocks();
  const [searchText, setSearchText] = useState('');
  const [flockId, setFlockId] = useState<number | null>(null);
  const [dateText, setDateText] = useState('');

  const filters: EggRecordFilters = { ...emptyEggRecordFilters, searchText, flockId, date: dateText };
  const { records, loading, refresh } = useEggHistory(filters);

  const flockOptions: FlockChipOption[] = [
    { key: 'all', label: 'All Flocks', value: null },
    ...flocks.map((flock) => ({ key: String(flock.id), label: flock.name, value: flock.id })),
  ];

  const handleDelete = useCallback(
    (record: EggRecord) => {
      confirmDestructive('Delete egg record', `Delete the record for ${formatDueDate(record.date)}?`, async () => {
        await eggRecordRepository.deleteEggRecord(db, record.id);
        refresh();
      });
    },
    [db, refresh]
  );

  const keyExtractor = useCallback((record: EggRecord) => String(record.id), []);

  const renderItem = useCallback(
    ({ item: record }: { item: EggRecord }) => {
      const flockName = flocks.find((flock) => flock.id === record.flockId)?.name;
      return (
        <View style={styles.row}>
          <Pressable style={styles.rowMain} onPress={() => navigation.navigate('AddEditEggRecord', { recordId: record.id })}>
            <AppText variant="cardTitle">
              {formatDueDate(record.date)}
              {record.time ? ` · ${record.time}` : ''} · {record.totalEggs} eggs
            </AppText>
            <AppText variant="caption" color={colors.secondaryText}>
              {flockName ?? 'Unassigned'}
              {record.notes ? ` · ${record.notes}` : ''}
            </AppText>
          </Pressable>
          <Pressable
            style={styles.rowIcon}
            onPress={() => navigation.navigate('AddEditEggRecord', { recordId: record.id })}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={`Edit egg record from ${formatDueDate(record.date)}`}
          >
            <Ionicons name="pencil" size={18} color={colors.mutedText} />
          </Pressable>
          <Pressable
            style={styles.rowIcon}
            onPress={() => handleDelete(record)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={`Delete egg record from ${formatDueDate(record.date)}`}
          >
            <Ionicons name="trash-outline" size={18} color={colors.alertCoral} />
          </Pressable>
        </View>
      );
    },
    [flocks, navigation, handleDelete]
  );

  return (
    <AppScreen>
      <ScreenHeader title="Egg History" onBack={() => navigation.goBack()} />

      <TextInput
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Search notes"
        placeholderTextColor={colors.mutedText}
        style={styles.searchInput}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {flockOptions.map((option) => {
          const isSelected = option.value === flockId;
          return (
            <Pressable
              key={option.key}
              onPress={() => setFlockId(option.value)}
              style={[styles.chip, isSelected && styles.chipSelected]}
            >
              <AppText variant="caption" color={isSelected ? colors.cardSurface : colors.primaryText}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      <TextInput
        value={dateText}
        onChangeText={setDateText}
        placeholder="Filter by date (YYYY-MM-DD)"
        placeholderTextColor={colors.mutedText}
        style={styles.dateInput}
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
      ) : records.length === 0 ? (
        <FadeInUp>
          <EmptyState title="No egg records" message="Try adjusting your search or filters." />
        </FadeInUp>
      ) : (
        <FadeInUp style={styles.list}>
          <FlatList
            style={styles.list}
            data={records}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.listContent, styles.resultsCard]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={renderItem}
          />
        </FadeInUp>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: spacing.lg,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  rowMain: {
    flex: 1,
    marginRight: spacing.sm,
  },
  rowIcon: {
    marginLeft: spacing.sm,
  },
});
