import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  AppScreen,
  AppText,
  PrimaryButton,
  FadeInUp,
  BirdPhotoBadge,
  StatCard,
} from '../components';
import { purposeByKey, speciesByKey } from '../data/onboardingData';
import { useOnboarding } from '../context/OnboardingContext';
import { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PersonalizedDashboard'>;

export function PersonalizedDashboardScreen({ navigation }: Props) {
  const { speciesKey, purposes, bird, resetOnboarding } = useOnboarding();
  const species = speciesByKey(speciesKey ?? 'chicken');

  const summaryCards = [
    { title: 'Breed', value: bird.confirmedBreed, accentColor: colors.sunflowerYellow },
    { title: 'Sex', value: bird.confirmedSex, accentColor: colors.leafGreen },
    { title: 'Color', value: bird.confirmedColor, accentColor: colors.hatchOrange },
    { title: 'Life Stage', value: bird.confirmedLifeStage, accentColor: colors.waterBlue },
  ];

  const handleEnter = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      })
    );
    resetOnboarding();
  };

  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <FadeInUp style={styles.heroBlock}>
          <BirdPhotoBadge icon={species.icon} size={128} />
          <AppText variant="display" align="center">
            You're all set!
          </AppText>
          <AppText variant="body" color={colors.secondaryText} align="center" style={styles.subtitle}>
            {bird.name} has joined your flock. Your dashboard is ready.
          </AppText>
        </FadeInUp>

        <FadeInUp delay={100} style={styles.summaryGrid}>
          {summaryCards.map((card) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={card.value}
              accentColor={card.accentColor}
              style={styles.statCard}
            />
          ))}
        </FadeInUp>

        {purposes.length > 0 ? (
          <FadeInUp delay={160} style={styles.purposeCard}>
            <AppText variant="cardTitle" style={styles.purposeTitle}>
              Flockora will focus on
            </AppText>
            <View style={styles.purposeRow}>
              {purposes.map((key) => {
                const purpose = purposeByKey(key);
                return (
                  <View key={key} style={styles.purposePill}>
                    <AppText style={styles.purposeIcon}>{purpose.icon}</AppText>
                    <AppText variant="caption" color={colors.primaryText}>
                      {purpose.label}
                    </AppText>
                  </View>
                );
              })}
            </View>
          </FadeInUp>
        ) : null}
      </ScrollView>

      <PrimaryButton label="Go to Today" onPress={handleEnter} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  heroBlock: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  subtitle: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: '48%',
  },
  purposeCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  purposeTitle: {
    marginBottom: spacing.sm,
  },
  purposeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  purposePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.softGreen,
    borderRadius: 999,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    gap: 6,
  },
  purposeIcon: {
    fontSize: 16,
  },
});
