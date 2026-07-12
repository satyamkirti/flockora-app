import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppScreen, AppText, PrimaryButton, SelectableCard, OnboardingHeader, FadeInUp } from '../components';
import { speciesOptions } from '../data/onboardingData';
import { useOnboarding } from '../context/OnboardingContext';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'BirdTypeSelection'>;

export function BirdTypeSelectionScreen({ navigation }: Props) {
  const { speciesKey, setSpecies } = useOnboarding();

  return (
    <AppScreen>
      <OnboardingHeader step={1} totalSteps={4} onBack={() => navigation.goBack()} />
      <FadeInUp>
        <AppText variant="screenTitle">What do you keep?</AppText>
        <AppText variant="body" color={colors.secondaryText} style={styles.subtitle}>
          Choose the species you'd like to start tracking first.
        </AppText>
      </FadeInUp>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <FadeInUp delay={80} style={styles.grid}>
          {speciesOptions.map((option) => (
            <View key={option.key} style={styles.gridItem}>
              <SelectableCard
                icon={option.icon}
                label={option.label}
                blurb={option.blurb}
                selected={speciesKey === option.key}
                onPress={() => setSpecies(option.key)}
              />
            </View>
          ))}
        </FadeInUp>
      </ScrollView>

      <PrimaryButton
        label="Continue"
        onPress={() => {
          if (!speciesKey) return;
          navigation.navigate('PurposeSelection');
        }}
        style={!speciesKey ? styles.disabled : undefined}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridItem: {
    width: '48%',
  },
  disabled: {
    opacity: 0.5,
  },
});
