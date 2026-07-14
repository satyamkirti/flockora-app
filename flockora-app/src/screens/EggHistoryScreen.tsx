import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { AppScreen, AppText, IconButton, EmptyState, FadeInUp } from '../components';
import { useEggHistory, useFlocks } from '../hooks';
import { eggRecordRepository } from '../db/repositories';
import { formatDueDate } from '../utils/taskSchedule';
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

  const handleDelete = (record: EggRecord) => {
    Alert.alert('Delete egg record', `Delete the record for ${formatDueDate(record.date)}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await eggRecordRepository.deleteEggRecord(db, record.id);
          refresh();
        },
      },
    ]);
  };

  return (
    <AppScreen>
      <View style={styles.headerRow}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} accessibilityLabel="Go back" />
        <AppText variant="sectionTitle">Egg History</AppText>
        <View style={styles.headerSpacer} />
      </View>

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

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
        ) : records.length === 0 ? (
          <FadeInUp>
            <EmptyState title="No egg records" message="Try adjusting your search or filters." />
          </FadeInUp>
        ) : (
          <FadeInUp style={styles.resultsCard}>
            {records.map((record, index) => {
              const flockName = flocks.find((flock) => flock.id === record.flockId)?.name;
              return (
                <View key={record.id} style={[styles.row, index === records.length - 1 && styles.rowLast]}>
                  <Pressable
                    style={styles.rowMain}
                    onPress={() => navigation.navigate('AddEditEggRecord', { recordId: record.id })}
                  >
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
                    accessibilityRole="button"
                    accessibilityLabel={`Edit egg record from ${formatDueDate(record.date)}`}
                  >
                    <Ionicons name="pencil" size={18} color={colors.mutedText} />
                  </Pressable>
                  <Pressable
                    style={styles.rowIcon}
                    onPress={() => handleDelete(record)}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete egg record from ${formatDueDate(record.date)}`}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.alertCoral} />
                  </Pressable>
                </View>
              );
            })}
          </FadeInUp>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowMain: {
    flex: 1,
    marginRight: spacing.sm,
  },
  rowIcon: {
    marginLeft: spacing.sm,
  },
});
