import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { AppScreen, AppText, IconButton, EmptyState, FadeInUp } from '../components';
import { useFeedHistory, useFeedItems, useFlocks, useBirds } from '../hooks';
import { feedRepository } from '../db/repositories';
import { formatDueDate } from '../utils/taskSchedule';
import { FeedLog, FeedLogFilters, emptyFeedLogFilters } from '../types/feed';
import { FlockStackParamList } from '../navigation/flockTypes';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<FlockStackParamList, 'FeedHistory'>;

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

export function FeedHistoryScreen({ navigation }: Props) {
  const db = useSQLiteContext();
  const { items } = useFeedItems();
  const { flocks } = useFlocks();
  const { birds } = useBirds();
  const [feedItemId, setFeedItemId] = useState<number | null>(null);
  const [flockId, setFlockId] = useState<number | null>(null);
  const [birdId, setBirdId] = useState<number | null>(null);
  const [dateText, setDateText] = useState('');

  const filters: FeedLogFilters = { ...emptyFeedLogFilters, feedItemId, flockId, birdId, date: dateText };
  const { logs, loading, refresh } = useFeedHistory(filters);

  const feedOptions: ChipOption<number | null>[] = [
    { key: 'all', label: 'All Feed', value: null },
    ...items.map((item) => ({ key: String(item.id), label: item.name, value: item.id })),
  ];
  const flockOptions: ChipOption<number | null>[] = [
    { key: 'all', label: 'All Flocks', value: null },
    ...flocks.map((flock) => ({ key: String(flock.id), label: flock.name, value: flock.id })),
  ];
  const birdOptions: ChipOption<number | null>[] = [
    { key: 'all', label: 'All Birds', value: null },
    ...birds.map((bird) => ({ key: String(bird.id), label: bird.name, value: bird.id })),
  ];

  const handleDelete = (log: FeedLog) => {
    Alert.alert('Delete feed log', `Delete this log from ${formatDueDate(log.date)}? The used quantity will be restored to stock.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await feedRepository.deleteFeedLog(db, log.id);
          refresh();
        },
      },
    ]);
  };

  return (
    <AppScreen>
      <View style={styles.headerRow}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} accessibilityLabel="Go back" />
        <AppText variant="sectionTitle">Feed History</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <FilterChips options={feedOptions} selected={feedItemId} onSelect={setFeedItemId} />
      <FilterChips options={flockOptions} selected={flockId} onSelect={setFlockId} />
      <FilterChips options={birdOptions} selected={birdId} onSelect={setBirdId} />

      <TextInput
        value={dateText}
        onChangeText={setDateText}
        placeholder="Filter by date (YYYY-MM-DD)"
        placeholderTextColor={colors.mutedText}
        style={styles.dateInput}
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
      ) : logs.length === 0 ? (
        <FadeInUp>
          <EmptyState title="No feed logs" message="Try adjusting your filters, or log today's feed usage." />
        </FadeInUp>
      ) : (
        <FadeInUp style={styles.list}>
          <FlatList
            style={styles.list}
            data={logs}
            keyExtractor={(log) => String(log.id)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.listContent, styles.resultsCard]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item: log }) => {
              const feedName = items.find((item) => item.id === log.feedItemId)?.name ?? 'Unknown feed';
              const flockName = flocks.find((flock) => flock.id === log.flockId)?.name;
              const birdName = birds.find((bird) => bird.id === log.birdId)?.name;
              const subjectLabel = birdName ?? flockName ?? null;
              return (
                <View style={styles.row}>
                  <Pressable
                    style={styles.rowMain}
                    onPress={() => navigation.navigate('LogFeedUsage', { logId: log.id })}
                  >
                    <AppText variant="cardTitle">
                      {formatDueDate(log.date)} · {feedName}
                    </AppText>
                    <AppText variant="caption" color={colors.secondaryText}>
                      {log.quantityUsed} {log.unit} used
                      {subjectLabel ? ` · ${subjectLabel}` : ''}
                    </AppText>
                  </Pressable>
                  <Pressable
                    style={styles.rowIcon}
                    onPress={() => navigation.navigate('LogFeedUsage', { logId: log.id })}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit feed log from ${formatDueDate(log.date)}`}
                  >
                    <Ionicons name="pencil" size={18} color={colors.mutedText} />
                  </Pressable>
                  <Pressable
                    style={styles.rowIcon}
                    onPress={() => handleDelete(log)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete feed log from ${formatDueDate(log.date)}`}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.alertCoral} />
                  </Pressable>
                </View>
              );
            }}
          />
        </FadeInUp>
      )}
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
    borderRadius: radii.md,
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
