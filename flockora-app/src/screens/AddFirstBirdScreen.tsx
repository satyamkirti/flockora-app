import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, PrimaryButton, OnboardingHeader, FadeInUp, BirdPhotoBadge } from '../components';
import { speciesByKey } from '../data/onboardingData';
import { useOnboarding } from '../context/OnboardingContext';
import { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddFirstBird'>;

export function AddFirstBirdScreen({ navigation }: Props) {
  const { speciesKey, bird, updateBird } = useOnboarding();
  const species = speciesByKey(speciesKey ?? 'chicken');
  const flash = useRef(new Animated.Value(0)).current;

  const canContinue = bird.photoCaptured && bird.name.trim().length > 0;

  const handleCapture = () => {
    flash.setValue(1);
    Animated.timing(flash, { toValue: 0, duration: 420, useNativeDriver: true }).start();
    updateBird({ photoCaptured: true });
  };

  return (
    <AppScreen>
      <OnboardingHeader step={3} totalSteps={4} onBack={() => navigation.goBack()} />
      <FadeInUp>
        <AppText variant="screenTitle">Add your first {species.label.toLowerCase()}</AppText>
        <AppText variant="body" color={colors.secondaryText} style={styles.subtitle}>
          Snap a photo and give them a name. Flockora will fill in the rest.
        </AppText>
      </FadeInUp>

      <FadeInUp delay={80} style={styles.captureWrap}>
        <Pressable onPress={handleCapture} style={styles.captureCard}>
          {bird.photoCaptured ? (
            <>
              <BirdPhotoBadge icon={species.icon} size={104} />
              <AppText variant="caption" color={colors.leafGreen}>
                Photo captured
              </AppText>
              <AppText variant="caption" color={colors.mutedText} style={styles.retakeText}>
                Tap to retake
              </AppText>
            </>
          ) : (
            <>
              <View style={styles.cameraCircle}>
                <Ionicons name="camera" size={30} color={colors.primaryText} />
              </View>
              <AppText variant="cardTitle">Take a photo</AppText>
              <AppText variant="caption" color={colors.mutedText}>
                Center your bird in the frame
              </AppText>
            </>
          )}
          <Animated.View pointerEvents="none" style={[styles.flashOverlay, { opacity: flash }]} />
        </Pressable>
      </FadeInUp>

      <FadeInUp delay={140} style={styles.formSection}>
        <AppText variant="cardTitle" style={styles.label}>
          Name
        </AppText>
        <TextInput
          value={bird.name}
          onChangeText={(text) => updateBird({ name: text })}
          placeholder={`e.g. Daisy the ${species.label}`}
          placeholderTextColor={colors.mutedText}
          style={styles.input}
        />
      </FadeInUp>

      <PrimaryButton
        label="Continue"
        onPress={() => {
          if (!canContinue) return;
          navigation.navigate('AIPhotoAnalysisLoading');
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
  captureWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  captureCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    overflow: 'hidden',
  },
  cameraCircle: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: colors.sunflowerYellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  retakeText: {
    marginTop: 2,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.cardSurface,
  },
  formSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.primaryText,
    backgroundColor: colors.cardSurface,
  },
  disabled: {
    opacity: 0.5,
  },
});
