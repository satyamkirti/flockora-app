import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppScreen, AppText, PrimaryButton, SelectableCard, OnboardingHeader, FadeInUp } from '../components';
import { purposeOptions } from '../data/onboardingData';
import { useOnboarding } from '../context/OnboardingContext';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PurposeSelection'>;

export function PurposeSelectionScreen({ navigation }: Props) {
  const { purposes, togglePurpose } = useOnboarding();
  const canContinue = purposes.length > 0;

  return (
    <AppScreen>
      <OnboardingHeader step={2} totalSteps={4} onBack={() => navigation.goBack()} />
      <FadeInUp>
        <AppText variant="screenTitle">What brings you to Flockora?</AppText>
        <AppText variant="body" color={colors.secondaryText} style={styles.subtitle}>
          Pick everything that applies — you can change this anytime.
        </AppText>
      </FadeInUp>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <FadeInUp delay={80} style={styles.grid}>
          {purposeOptions.map((option) => (
            <View key={option.key} style={styles.gridItem}>
              <SelectableCard
                icon={option.icon}
                label={option.label}
                blurb={option.blurb}
                selected={purposes.includes(option.key)}
                onPress={() => togglePurpose(option.key)}
              />
            </View>
          ))}
        </FadeInUp>
      </ScrollView>

      <PrimaryButton
        label="Continue"
        onPress={() => {
          if (!canContinue) return;
          navigation.navigate('AddFirstBird');
        }}
        style={!canContinue ? styles.disabled : undefined}
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
