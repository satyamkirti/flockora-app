import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import {
  AppScreen,
  AppText,
  PrimaryButton,
  TextButton,
  FormField,
  SegmentedControl,
  SelectableCard,
  BirdPhotoBadge,
  FlockManagerModal,
  FadeInUp,
  ScreenHeader,
} from '../components';
import { useBird, useFlocks } from '../hooks';
import { birdRepository } from '../db/repositories';
import { speciesByKey, speciesOptions } from '../data/onboardingData';
import { captureFromCamera, pickFromGallery, PickPhotoOutcome } from '../services/imagePickerService';
import { BirdInput, WeightUnit, createEmptyBirdInput } from '../types/bird';
import { CapturedPhoto } from '../types/onboarding';
import { FlockStackParamList } from '../navigation/flockTypes';
import { colors, radii, spacing } from '../theme';

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

type Props = NativeStackScreenProps<FlockStackParamList, 'AddEditBird'>;

type SexOption = 'Male' | 'Female' | 'Unknown';
const sexOptions: { label: string; value: SexOption }[] = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Unknown', value: 'Unknown' },
];

const weightUnitOptions: { label: string; value: WeightUnit }[] = [
  { label: 'kg', value: 'kg' },
  { label: 'lb', value: 'lb' },
];

const activeOptions: { label: string; value: 'active' | 'inactive' }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

const dobModeOptions: { label: string; value: 'dob' | 'age' }[] = [
  { label: 'Birth Date', value: 'dob' },
  { label: 'Age', value: 'age' },
];

export function AddEditBirdScreen({ route, navigation }: Props) {
  const { birdId } = route.params;
  const isEditing = birdId != null;
  const db = useSQLiteContext();
  const { bird: existingBird, loading: loadingBird } = useBird(birdId);
  const { flocks, refresh: refreshFlocks } = useFlocks();

  const [form, setForm] = useState<BirdInput>(createEmptyBirdInput());
  const [weightText, setWeightText] = useState('');
  // Legacy bird records created before real capture existed (Sprint 3.2/before) may have the
  // literal string 'captured' stored as photoUri — that is never a usable image source.
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [dobMode, setDobMode] = useState<'dob' | 'age'>('age');
  const [flockModalVisible, setFlockModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(!isEditing);

  useEffect(() => {
    if (isEditing && existingBird && !hydrated) {
      setForm({
        name: existingBird.name,
        species: existingBird.species,
        breed: existingBird.breed,
        sex: existingBird.sex,
        dateOfBirth: existingBird.dateOfBirth,
        ageEstimate: existingBird.ageEstimate,
        acquisitionDate: existingBird.acquisitionDate,
        color: existingBird.color,
        weight: existingBird.weight,
        weightUnit: existingBird.weightUnit ?? 'kg',
        notes: existingBird.notes,
        photoUri: existingBird.photoUri,
        tagId: existingBird.tagId,
        isActive: existingBird.isActive,
        flockId: existingBird.flockId,
      });
      setWeightText(existingBird.weight != null ? String(existingBird.weight) : '');
      if (existingBird.photoUri && existingBird.photoUri !== 'captured') {
        setPhoto({ uri: existingBird.photoUri, mimeType: 'image/jpeg', fileName: 'bird-photo.jpg' });
      }
      setDobMode(existingBird.dateOfBirth ? 'dob' : 'age');
      setHydrated(true);
    }
  }, [isEditing, existingBird, hydrated]);

  const update = (patch: Partial<BirdInput>) => setForm((current) => ({ ...current, ...patch }));

  const species = speciesByKey(form.species);
  const normalizedSex: SexOption = form.sex === 'Male' || form.sex === 'Female' ? form.sex : 'Unknown';
  const flockName = flocks.find((flock) => flock.id === form.flockId)?.name ?? 'No Flock';

  const handlePhotoOutcome = (outcome: PickPhotoOutcome, kind: 'camera' | 'gallery') => {
    if (outcome.status === 'success') {
      setPhoto(outcome.photo);
      return;
    }
    if (outcome.status === 'permission_denied') {
      showPermissionDeniedAlert(kind, outcome.canAskAgain, () => (kind === 'camera' ? handleChooseFromGallery() : handleTakePhoto()));
    }
  };

  const handleTakePhoto = async () => {
    if (isPicking) return;
    setIsPicking(true);
    try {
      handlePhotoOutcome(await captureFromCamera(), 'camera');
    } finally {
      setIsPicking(false);
    }
  };

  const handleChooseFromGallery = async () => {
    if (isPicking) return;
    setIsPicking(true);
    try {
      handlePhotoOutcome(await pickFromGallery(), 'gallery');
    } finally {
      setIsPicking(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Bird name required', 'Please enter a name for this bird.');
      return;
    }

    const parsedWeight = weightText.trim() === '' ? null : Number(weightText);
    const payload: BirdInput = {
      ...form,
      name: form.name.trim(),
      breed: form.breed?.trim() || null,
      sex: form.sex?.trim() || null,
      dateOfBirth: dobMode === 'dob' ? form.dateOfBirth?.trim() || null : null,
      ageEstimate: dobMode === 'age' ? form.ageEstimate?.trim() || null : null,
      acquisitionDate: form.acquisitionDate?.trim() || null,
      color: form.color?.trim() || null,
      weight: parsedWeight != null && !Number.isNaN(parsedWeight) ? parsedWeight : null,
      notes: form.notes?.trim() || null,
      photoUri: photo?.uri ?? null,
      tagId: form.tagId?.trim() || null,
    };

    setSaving(true);
    try {
      if (isEditing && birdId != null) {
        await birdRepository.updateBird(db, birdId, payload);
        navigation.goBack();
      } else {
        const created = await birdRepository.createBird(db, payload);
        navigation.replace('BirdProfile', { birdId: created.id });
      }
    } catch (error) {
      Alert.alert('Something went wrong', 'Could not save this bird. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (isEditing && loadingBird && !hydrated) {
    return (
      <AppScreen>
        <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScreenHeader title={isEditing ? 'Edit Bird' : 'Add Bird'} onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={16}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <FadeInUp style={styles.captureWrap}>
            {photo ? (
              <View style={styles.previewWrap}>
                <Image source={{ uri: photo.uri }} style={styles.previewImage} />
                <View style={styles.previewActions}>
                  <TextButton label="Retake" onPress={handleTakePhoto} disabled={isPicking} />
                  <TextButton label="Choose Another Photo" onPress={handleChooseFromGallery} disabled={isPicking} />
                </View>
              </View>
            ) : (
              <View style={styles.captureCard}>
                <BirdPhotoBadge icon={species.icon} size={72} style={styles.captureBadge} />
                <View style={styles.captureActions}>
                  <Pressable style={styles.captureButton} onPress={handleTakePhoto} disabled={isPicking}>
                    <Ionicons name="camera-outline" size={16} color={colors.cardSurface} />
                    <AppText variant="caption" color={colors.cardSurface}>
                      Take Photo
                    </AppText>
                  </Pressable>
                  <Pressable style={styles.captureButtonOutline} onPress={handleChooseFromGallery} disabled={isPicking}>
                    <Ionicons name="images-outline" size={16} color={colors.primaryText} />
                    <AppText variant="caption" color={colors.primaryText}>
                      Choose from Gallery
                    </AppText>
                  </Pressable>
                </View>
              </View>
            )}
          </FadeInUp>

          <FormField label="Bird Name" value={form.name} onChangeText={(text) => update({ name: text })} placeholder="e.g. Daisy" />

          <FormField
            label="Leg Band / Tag ID"
            optional
            value={form.tagId ?? ''}
            onChangeText={(text) => update({ tagId: text })}
            placeholder="e.g. Y-042"
          />

          <View style={styles.fieldBlock}>
            <AppText variant="cardTitle" style={styles.label}>
              Species
            </AppText>
            <View style={styles.speciesGrid}>
              {speciesOptions.map((option) => (
                <View key={option.key} style={styles.speciesItem}>
                  <SelectableCard
                    icon={option.icon}
                    label={option.label}
                    selected={form.species === option.key}
                    onPress={() => update({ species: option.key })}
                  />
                </View>
              ))}
            </View>
          </View>

          <FormField
            label="Breed"
            optional
            value={form.breed ?? ''}
            onChangeText={(text) => update({ breed: text })}
            placeholder="e.g. Rhode Island Red"
          />

          <View style={styles.fieldBlock}>
            <AppText variant="cardTitle" style={styles.label}>
              Sex
            </AppText>
            <SegmentedControl options={sexOptions} value={normalizedSex} onChange={(value) => update({ sex: value })} />
          </View>

          <View style={styles.fieldBlock}>
            <SegmentedControl options={dobModeOptions} value={dobMode} onChange={setDobMode} />
          </View>

          {dobMode === 'dob' ? (
            <FormField
              label="Date of Birth"
              optional
              value={form.dateOfBirth ?? ''}
              onChangeText={(text) => update({ dateOfBirth: text })}
              placeholder="YYYY-MM-DD"
            />
          ) : (
            <FormField
              label="Age"
              optional
              value={form.ageEstimate ?? ''}
              onChangeText={(text) => update({ ageEstimate: text })}
              placeholder="e.g. 8 months"
            />
          )}

          <FormField
            label="Acquisition Date"
            optional
            value={form.acquisitionDate ?? ''}
            onChangeText={(text) => update({ acquisitionDate: text })}
            placeholder="YYYY-MM-DD"
          />

          <FormField
            label="Color"
            optional
            value={form.color ?? ''}
            onChangeText={(text) => update({ color: text })}
            placeholder="e.g. Reddish-brown"
          />

          <View style={styles.fieldBlock}>
            <View style={styles.weightRow}>
              <View style={styles.weightInput}>
                <FormField
                  label="Weight"
                  optional
                  value={weightText}
                  onChangeText={setWeightText}
                  placeholder="0.0"
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.weightUnit}>
                <AppText variant="cardTitle" style={styles.label}>
                  Unit
                </AppText>
                <SegmentedControl
                  options={weightUnitOptions}
                  value={form.weightUnit ?? 'kg'}
                  onChange={(value) => update({ weightUnit: value })}
                />
              </View>
            </View>
          </View>

          <FormField
            label="Notes"
            optional
            multiline
            value={form.notes ?? ''}
            onChangeText={(text) => update({ notes: text })}
            placeholder="Anything worth remembering about this bird"
          />

          <View style={styles.fieldBlock}>
            <AppText variant="cardTitle" style={styles.label}>
              Status
            </AppText>
            <SegmentedControl
              options={activeOptions}
              value={form.isActive ? 'active' : 'inactive'}
              onChange={(value) => update({ isActive: value === 'active' })}
            />
          </View>

          <View style={styles.fieldBlock}>
            <AppText variant="cardTitle" style={styles.label}>
              Flock
            </AppText>
            <Pressable style={styles.flockField} onPress={() => setFlockModalVisible(true)}>
              <AppText variant="body">{flockName}</AppText>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <PrimaryButton
        label={saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Bird'}
        onPress={handleSave}
        style={saving ? styles.disabled : undefined}
        disabled={saving}
      />

      <FlockManagerModal
        visible={flockModalVisible}
        onClose={() => setFlockModalVisible(false)}
        flocks={flocks}
        onChanged={refreshFlocks}
        selectable
        selectedFlockId={form.flockId}
        onSelect={(flockId) => update({ flockId })}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: spacing.xxl,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  captureWrap: {
    marginBottom: spacing.lg,
  },
  captureCard: {
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  captureBadge: {
    marginBottom: spacing.xs,
  },
  captureActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.leafGreen,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  captureButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  previewWrap: {
    alignItems: 'center',
  },
  previewImage: {
    width: 140,
    height: 140,
    borderRadius: radii.xl,
    borderWidth: 3,
    borderColor: colors.sunflowerYellow,
    backgroundColor: colors.softGreen,
    marginBottom: spacing.sm,
  },
  previewActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  fieldBlock: {
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.xs,
  },
  speciesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  speciesItem: {
    width: '31%',
  },
  weightRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  weightInput: {
    flex: 1,
  },
  weightUnit: {
    width: 140,
  },
  flockField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  disabled: {
    opacity: 0.6,
  },
});
