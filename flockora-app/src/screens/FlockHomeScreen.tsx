import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  AppScreen,
  AppText,
  PrimaryButton,
  IconButton,
  EmptyState,
  BirdListRow,
  FlockManagerModal,
  FadeInUp,
} from '../components';
import { useBirds, useFlocks, useEggDashboard, useFeedDashboard, useBreedingDashboard } from '../hooks';
import { FlockStackParamList } from '../navigation/flockTypes';
import { colors, radii, shadows, spacing } from '../theme';

type Props = NativeStackScreenProps<FlockStackParamList, 'FlockHome'>;

export function FlockHomeScreen({ navigation }: Props) {
  const { flocks, refresh: refreshFlocks } = useFlocks();
  const [selectedFlockId, setSelectedFlockId] = useState<number | null>(null);
  const { birds, loading, refresh: refreshBirds } = useBirds(selectedFlockId);
  const { summary: eggSummary } = useEggDashboard();
  const { summary: feedSummary } = useFeedDashboard();
  const { summary: breedingSummary } = useBreedingDashboard();
  const [manageVisible, setManageVisible] = useState(false);

  const handleChanged = () => {
    refreshFlocks();
    refreshBirds();
  };

  const flockNameById = (flockId: number | null) => flocks.find((flock) => flock.id === flockId)?.name ?? null;

  return (
    <AppScreen>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <AppText variant="display">Your Flock</AppText>
          <AppText variant="body" color={colors.secondaryText} style={styles.subtitle}>
            {birds.length} {birds.length === 1 ? 'bird' : 'birds'}
            {selectedFlockId ? ` in ${flockNameById(selectedFlockId)}` : ' total'}
          </AppText>
        </View>
        <IconButton name="options-outline" onPress={() => setManageVisible(true)} />
      </View>

      <Pressable style={[styles.eggCard, shadows.card]} onPress={() => navigation.navigate('EggDashboard')}>
        <View style={styles.eggIconBubble}>
          <AppText style={styles.eggIcon}>🥚</AppText>
        </View>
        <View style={styles.eggCardText}>
          <AppText variant="cardTitle">Egg Production</AppText>
          <AppText variant="caption" color={colors.secondaryText}>
            {eggSummary.todayTotal} {eggSummary.todayTotal === 1 ? 'egg' : 'eggs'} today
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.mutedText} />
      </Pressable>

      <Pressable style={[styles.eggCard, shadows.card]} onPress={() => navigation.navigate('FeedInventory')}>
        <View style={styles.eggIconBubble}>
          <AppText style={styles.eggIcon}>🌾</AppText>
        </View>
        <View style={styles.eggCardText}>
          <AppText variant="cardTitle">Feed & Inventory</AppText>
          <AppText variant="caption" color={colors.secondaryText}>
            {feedSummary.lowStockCount + feedSummary.outOfStockCount > 0
              ? `${feedSummary.lowStockCount + feedSummary.outOfStockCount} item(s) need attention`
              : 'Stock levels look good'}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.mutedText} />
      </Pressable>

      <Pressable style={[styles.eggCard, shadows.card]} onPress={() => navigation.navigate('BreedingHub')}>
        <View style={styles.eggIconBubble}>
          <AppText style={styles.eggIcon}>🧬</AppText>
        </View>
        <View style={styles.eggCardText}>
          <AppText variant="cardTitle">Breeding & Hatching</AppText>
          <AppText variant="caption" color={colors.secondaryText}>
            {breedingSummary.activeClutches > 0
              ? `${breedingSummary.activeClutches} clutch(es) incubating`
              : 'No active clutches'}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.mutedText} />
      </Pressable>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipRowContent}>
        <Pressable
          onPress={() => setSelectedFlockId(null)}
          style={[styles.chip, selectedFlockId === null && styles.chipSelected]}
        >
          <AppText variant="caption" color={selectedFlockId === null ? colors.cardSurface : colors.primaryText}>
            All
          </AppText>
        </Pressable>
        {flocks.map((flock) => (
          <Pressable
            key={flock.id}
            onPress={() => setSelectedFlockId(flock.id)}
            style={[styles.chip, selectedFlockId === flock.id && styles.chipSelected]}
          >
            <AppText
              variant="caption"
              color={selectedFlockId === flock.id ? colors.cardSurface : colors.primaryText}
            >
              {flock.name} · {flock.birdCount}
            </AppText>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
        ) : birds.length === 0 ? (
          <FadeInUp>
            <EmptyState
              title="No birds yet"
              message="Add your first bird to start tracking your flock."
            />
          </FadeInUp>
        ) : (
          <FadeInUp>
            {birds.map((bird) => (
              <BirdListRow
                key={bird.id}
                bird={bird}
                flockName={flockNameById(bird.flockId)}
                onPress={() => navigation.navigate('BirdProfile', { birdId: bird.id })}
              />
            ))}
          </FadeInUp>
        )}
      </ScrollView>

      <PrimaryButton label="Add Bird" onPress={() => navigation.navigate('AddEditBird', {})} />

      <FlockManagerModal
        visible={manageVisible}
        onClose={() => setManageVisible(false)}
        flocks={flocks}
        onChanged={handleChanged}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  eggCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  eggIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: colors.warmCream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  eggIcon: {
    fontSize: 18,
  },
  eggCardText: {
    flex: 1,
  },
  chipRow: {
    flexGrow: 0,
    marginBottom: spacing.md,
  },
  chipRowContent: {
    gap: spacing.sm,
    paddingRight: spacing.md,
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
});
