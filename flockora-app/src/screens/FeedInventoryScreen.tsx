import React from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import {
  AppScreen,
  AppText,
  PrimaryButton,
  IconButton,
  SectionHeader,
  StatCard,
  FeedItemRow,
  EmptyState,
  FadeInUp,
} from '../components';
import { useFeedItems, useFeedStatistics } from '../hooks';
import { feedRepository } from '../db/repositories';
import { feedTypeByKey } from '../data/feedTypes';
import { getFeedExpiryState, getFeedStockState, formatQuantitiesByUnit } from '../utils/feedStock';
import { FeedItem } from '../types/feed';
import { FlockStackParamList } from '../navigation/flockTypes';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<FlockStackParamList, 'FeedInventory'>;

export function FeedInventoryScreen({ navigation }: Props) {
  const db = useSQLiteContext();
  const { items, loading, refresh } = useFeedItems();
  const { statistics } = useFeedStatistics();

  const statCards = [
    { title: 'Used Today', value: formatQuantitiesByUnit(statistics.usedToday), accentColor: colors.sunflowerYellow },
    { title: 'Used This Week', value: formatQuantitiesByUnit(statistics.usedThisWeek), accentColor: colors.leafGreen },
    { title: 'Used This Month', value: formatQuantitiesByUnit(statistics.usedThisMonth), accentColor: colors.hatchOrange },
    { title: 'Current Stock', value: formatQuantitiesByUnit(statistics.currentStockByUnit), accentColor: colors.waterBlue },
    { title: 'Est. Feed Cost', value: `$${statistics.estimatedCost.toFixed(2)}`, accentColor: colors.hatchOrange },
    { title: 'Avg Daily Usage', value: formatQuantitiesByUnit(statistics.averageDailyUsage), accentColor: colors.leafGreen },
  ];

  const handleDelete = (item: FeedItem) => {
    Alert.alert('Delete feed', `Delete "${item.name}"? Its usage history will also be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await feedRepository.deleteFeedItem(db, item.id);
          refresh();
        },
      },
    ]);
  };

  return (
    <AppScreen>
      <View style={styles.headerRow}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
        <AppText variant="sectionTitle">Feed & Inventory</AppText>
        <IconButton name="add" onPress={() => navigation.navigate('AddEditFeedItem', {})} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <SectionHeader title="Statistics" />
        <FadeInUp style={styles.statsGrid}>
          {statCards.map((card) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={card.value}
              accentColor={card.accentColor}
              style={styles.statCard}
            />
          ))}
        </FadeInUp>

        <PrimaryButton
          label="View Feed History"
          onPress={() => navigation.navigate('FeedHistory')}
          style={styles.historyButton}
        />

        <SectionHeader title="Current Stock" />
        {loading ? (
          <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
        ) : items.length === 0 ? (
          <FadeInUp>
            <EmptyState title="No feed added yet" message="Add your first feed to start tracking inventory." />
          </FadeInUp>
        ) : (
          <FadeInUp style={styles.stockCard}>
            {items.map((item) => {
              const typeOption = feedTypeByKey(item.feedType);
              return (
                <FeedItemRow
                  key={item.id}
                  icon={typeOption.icon}
                  name={item.name}
                  feedTypeLabel={typeOption.label}
                  quantityLabel={`${item.quantity} ${item.unit}`}
                  stockState={getFeedStockState(item)}
                  expiryState={getFeedExpiryState(item)}
                  onPress={() => navigation.navigate('AddEditFeedItem', { itemId: item.id })}
                  onDelete={() => handleDelete(item)}
                />
              );
            })}
          </FadeInUp>
        )}
      </ScrollView>

      <PrimaryButton label="+ Log Usage" onPress={() => navigation.navigate('LogFeedUsage', {})} />
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
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    width: '48%',
    marginBottom: spacing.sm,
  },
  historyButton: {
    backgroundColor: colors.hatchOrange,
    marginBottom: spacing.sm,
  },
  stockCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  loader: {
    marginTop: spacing.xxl,
  },
});
