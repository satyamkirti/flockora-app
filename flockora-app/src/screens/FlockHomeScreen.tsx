import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
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
  StatCard,
  FadeInUp,
} from '../components';
import { useBirds, useFlocks, useEggDashboard, useFeedDashboard, useBreedingDashboard, useFlockDashboardStats } from '../hooks';
import { classifyBirdSex, ClassifiedSex } from '../utils/birdSex';
import { speciesOptions } from '../data/onboardingData';
import { flockPurposeByKey } from '../data/flockPurposeTypes';
import { SpeciesKey } from '../types/onboarding';
import { FlockStackParamList } from '../navigation/flockTypes';
import { colors, radii, shadows, spacing } from '../theme';

type Props = NativeStackScreenProps<FlockStackParamList, 'FlockHome'>;

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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRowContent}>
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <Pressable
            key={option.key}
            onPress={() => onSelect(option.value)}
            style={[styles.filterChip, isSelected && styles.chipSelected]}
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

export function FlockHomeScreen({ navigation }: Props) {
  const { flocks, refresh: refreshFlocks } = useFlocks();
  const [selectedFlockId, setSelectedFlockId] = useState<number | null>(null);
  const { birds, loading, refresh: refreshBirds } = useBirds(selectedFlockId);
  const { summary, refresh: refreshSummary } = useFlockDashboardStats();
  const { summary: eggSummary } = useEggDashboard();
  const { summary: feedSummary } = useFeedDashboard();
  const { summary: breedingSummary } = useBreedingDashboard();
  const [manageVisible, setManageVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<SpeciesKey | null>(null);
  const [sexFilter, setSexFilter] = useState<ClassifiedSex | null>(null);

  const handleChanged = () => {
    refreshFlocks();
    refreshBirds();
    refreshSummary();
  };

  const flockNameById = (flockId: number | null) => flocks.find((flock) => flock.id === flockId)?.name ?? null;

  const visibleBirds = birds.filter((bird) => {
    if (speciesFilter && bird.species !== speciesFilter) {
      return false;
    }
    if (sexFilter && classifyBirdSex(bird.sex) !== sexFilter) {
      return false;
    }
    const query = searchText.trim().toLowerCase();
    if (query) {
      const matchesName = bird.name.toLowerCase().includes(query);
      const matchesTag = (bird.tagId ?? '').toLowerCase().includes(query);
      if (!matchesName && !matchesTag) {
        return false;
      }
    }
    return true;
  });

  const speciesFilterOptions: ChipOption<SpeciesKey | null>[] = [
    { key: 'all', label: 'All Species', value: null },
    ...speciesOptions.map((option) => ({ key: option.key, label: option.label, value: option.key })),
  ];

  const sexFilterOptions: ChipOption<ClassifiedSex | null>[] = [
    { key: 'all', label: 'All', value: null },
    { key: 'male', label: 'Male', value: 'male' as ClassifiedSex },
    { key: 'female', label: 'Female', value: 'female' as ClassifiedSex },
    { key: 'unknown', label: 'Unknown', value: 'unknown' as ClassifiedSex },
  ];

  const summaryCards = [
    { title: 'Total Birds', value: String(summary.totalBirds), accentColor: colors.leafGreen },
    {
      title: 'Species / Groups',
      value: String(summary.speciesCount),
      subtitle: `${summary.groupCount} ${summary.groupCount === 1 ? 'group' : 'groups'}`,
      accentColor: colors.sunflowerYellow,
    },
    {
      title: 'Males / Females',
      value: `${summary.maleCount} / ${summary.femaleCount}`,
      subtitle: `${summary.unknownCount} unknown`,
      accentColor: colors.waterBlue,
    },
    {
      title: 'Care Alerts',
      value: String(summary.careAlertCount),
      subtitle: summary.careAlertCount > 0 ? 'Needs attention' : 'All caught up',
      accentColor: summary.careAlertCount > 0 ? colors.alertCoral : colors.leafGreen,
    },
  ];

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
        <IconButton
          name="options-outline"
          onPress={() => setManageVisible(true)}
          accessibilityLabel="Manage groups"
        />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <FadeInUp style={styles.summaryGrid}>
          {summaryCards.map((card) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
              accentColor={card.accentColor}
              style={styles.statCard}
            />
          ))}
        </FadeInUp>

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

        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search by name or tag/band ID"
          placeholderTextColor={colors.mutedText}
          style={styles.searchInput}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipRowContent}>
          <Pressable
            onPress={() => setSelectedFlockId(null)}
            style={[styles.chip, selectedFlockId === null && styles.chipSelected]}
          >
            <AppText variant="caption" color={selectedFlockId === null ? colors.cardSurface : colors.primaryText}>
              All
            </AppText>
          </Pressable>
          {flocks.map((flock) => {
            const purpose = flockPurposeByKey(flock.purpose);
            return (
              <Pressable
                key={flock.id}
                onPress={() => setSelectedFlockId(flock.id)}
                style={[styles.chip, selectedFlockId === flock.id && styles.chipSelected]}
              >
                <AppText
                  variant="caption"
                  color={selectedFlockId === flock.id ? colors.cardSurface : colors.primaryText}
                >
                  {purpose ? `${purpose.icon} ` : ''}
                  {flock.name} · {flock.birdCount}
                </AppText>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => navigation.navigate('AddEditFlock', {})}
            style={[styles.chip, styles.newGroupChip]}
          >
            <Ionicons name="add" size={14} color={colors.leafGreen} />
            <AppText variant="caption" color={colors.leafGreen}>
              New Group
            </AppText>
          </Pressable>
        </ScrollView>

        <FilterChips options={speciesFilterOptions} selected={speciesFilter} onSelect={setSpeciesFilter} />
        <FilterChips options={sexFilterOptions} selected={sexFilter} onSelect={setSexFilter} />

        {loading ? (
          <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
        ) : visibleBirds.length === 0 ? (
          <FadeInUp>
            <EmptyState
              title={birds.length === 0 ? 'No birds yet' : 'No matching birds'}
              message={
                birds.length === 0
                  ? 'Add your first bird to start tracking your flock.'
                  : 'Try adjusting your search or filters.'
              }
            />
          </FadeInUp>
        ) : (
          <FadeInUp style={styles.list}>
            {visibleBirds.map((bird) => (
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
        onEditDetails={(flock) => navigation.navigate('AddEditFlock', { flockId: flock.id })}
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    width: '48%',
    marginBottom: spacing.sm,
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
  chipRow: {
    flexGrow: 0,
    marginBottom: spacing.sm,
  },
  chipRowContent: {
    gap: spacing.sm,
    paddingRight: spacing.md,
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
  filterChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  newGroupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderColor: colors.leafGreen,
    borderStyle: 'dashed',
  },
  chipSelected: {
    backgroundColor: colors.leafGreen,
    borderColor: colors.leafGreen,
  },
  list: {
    marginTop: spacing.sm,
  },
  loader: {
    marginTop: spacing.xxl,
  },
});
