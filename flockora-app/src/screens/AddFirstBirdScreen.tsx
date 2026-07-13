import React, { useState } from 'react';
import { Alert, Image, Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, PrimaryButton, OnboardingHeader, FadeInUp } from '../components';
import { speciesByKey } from '../data/onboardingData';
import { useOnboarding } from '../context/OnboardingContext';
import { captureFromCamera, pickFromGallery, PickPhotoOutcome } from '../services/imagePickerService';
import { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddFirstBird'>;

function showPermissionDeniedAlert(kind: 'camera' | 'gallery', canAskAgain: boolean, onUseOther: () => void) {
  const otherLabel = kind === 'camera' ? 'Choose from Gallery' : 'Take a Photo';
  const message =
    kind === 'camera'
      ? 'Flockora needs camera access to take a bird photo.'
      : 'Flockora needs photo library access to choose a bird photo.';

  const buttons: { text: string; onPress?: () => void; style?: 'cancel' | 'default' }[] = [
    { text: otherLabel, onPress: onUseOther },
  ];
  if (canAskAgain === false) {
    buttons.push({ text: 'Open Settings', onPress: () => Linking.openSettings() });
  }
  buttons.push({ text: 'Cancel', style: 'cancel' });

  Alert.alert('Permission needed', message, buttons);
}

export function AddFirstBirdScreen({ navigation }: Props) {
  const { speciesKey, bird, updateBird } = useOnboarding();
  const species = speciesByKey(speciesKey ?? 'chicken');
  const [isPicking, setIsPicking] = useState(false);

  const canContinue = bird.photo !== null && bird.name.trim().length > 0;

  const handleOutcome = (outcome: PickPhotoOutcome, kind: 'camera' | 'gallery') => {
    if (outcome.status === 'success') {
      updateBird({ photo: outcome.photo });
      return;
    }
    if (outcome.status === 'permission_denied') {
      showPermissionDeniedAlert(kind, outcome.canAskAgain, () =>
        kind === 'camera' ? handleChooseFromGallery() : handleTakePhoto()
      );
    }
    // 'canceled' — user backed out of the picker; nothing to do.
  };

  const handleTakePhoto = async () => {
    if (isPicking) return;
    setIsPicking(true);
    try {
      handleOutcome(await captureFromCamera(), 'camera');
    } finally {
      setIsPicking(false);
    }
  };

  const handleChooseFromGallery = async () => {
    if (isPicking) return;
    setIsPicking(true);
    try {
      handleOutcome(await pickFromGallery(), 'gallery');
    } finally {
      setIsPicking(false);
    }
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
        {bird.photo ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: bird.photo.uri }} style={styles.previewImage} />
            <View style={styles.previewActions}>
              <Pressable style={styles.secondaryButton} onPress={handleTakePhoto} disabled={isPicking}>
                <AppText variant="button" color={colors.secondaryText}>
                  Retake
                </AppText>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={handleChooseFromGallery} disabled={isPicking}>
                <AppText variant="button" color={colors.secondaryText}>
                  Choose Another Photo
                </AppText>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.captureCard}>
            <View style={styles.cameraCircle}>
              <Ionicons name="camera" size={30} color={colors.primaryText} />
            </View>
            <AppText variant="cardTitle">Add a photo</AppText>
            <AppText variant="caption" color={colors.mutedText} style={styles.captureHint}>
              Center your bird in the frame
            </AppText>
            <View style={styles.captureActions}>
              <Pressable style={styles.captureButton} onPress={handleTakePhoto} disabled={isPicking}>
                <Ionicons name="camera-outline" size={18} color={colors.cardSurface} />
                <AppText variant="button" color={colors.cardSurface}>
                  Take Photo
                </AppText>
              </Pressable>
              <Pressable style={styles.captureButtonOutline} onPress={handleChooseFromGallery} disabled={isPicking}>
                <Ionicons name="images-outline" size={18} color={colors.primaryText} />
                <AppText variant="button" color={colors.primaryText}>
                  Choose from Gallery
                </AppText>
              </Pressable>
            </View>
          </View>
        )}
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
  captureHint: {
    marginBottom: spacing.lg,
  },
  captureActions: {
    gap: spacing.sm,
    alignSelf: 'stretch',
    paddingHorizontal: spacing.lg,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.leafGreen,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
  },
  captureButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
  },
  previewWrap: {
    alignItems: 'center',
  },
  previewImage: {
    width: 240,
    height: 240,
    borderRadius: radii.xl,
    borderWidth: 3,
    borderColor: colors.sunflowerYellow,
    backgroundColor: colors.softGreen,
    marginBottom: spacing.md,
  },
  previewActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
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
