import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
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
  IconButton,
  FormField,
  SegmentedControl,
  SelectableCard,
  BirdPhotoBadge,
  FlockManagerModal,
  FadeInUp,
} from '../components';
import { useBird, useFlocks } from '../hooks';
import { birdRepository } from '../db/repositories';
import { speciesByKey, speciesOptions } from '../data/onboardingData';
import { BirdInput, WeightUnit, createEmptyBirdInput } from '../types/bird';
import { FlockStackParamList } from '../navigation/flockTypes';
import { colors, radii, spacing } from '../theme';

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
  const [photoCaptured, setPhotoCaptured] = useState(false);
  const [dobMode, setDobMode] = useState<'dob' | 'age'>('age');
  const [flockModalVisible, setFlockModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(!isEditing);
  const flash = useRef(new Animated.Value(0)).current;

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
        isActive: existingBird.isActive,
        flockId: existingBird.flockId,
      });
      setWeightText(existingBird.weight != null ? String(existingBird.weight) : '');
      setPhotoCaptured(Boolean(existingBird.photoUri));
      setDobMode(existingBird.dateOfBirth ? 'dob' : 'age');
      setHydrated(true);
    }
  }, [isEditing, existingBird, hydrated]);

  const update = (patch: Partial<BirdInput>) => setForm((current) => ({ ...current, ...patch }));

  const species = speciesByKey(form.species);
  const normalizedSex: SexOption = form.sex === 'Male' || form.sex === 'Female' ? form.sex : 'Unknown';
  const flockName = flocks.find((flock) => flock.id === form.flockId)?.name ?? 'No Flock';

  const handleCapture = () => {
    flash.setValue(1);
    Animated.timing(flash, { toValue: 0, duration: 420, useNativeDriver: true }).start();
    setPhotoCaptured(true);
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
      photoUri: photoCaptured ? form.photoUri ?? 'captured' : null,
    };

    setSaving(true);
    try {
      if (isEditing && birdId != null) {
        await birdRepository.update(db, birdId, payload);
        navigation.goBack();
      } else {
        const created = await birdRepository.create(db, payload);
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
      <View style={styles.headerRow}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
        <AppText variant="sectionTitle">{isEditing ? 'Edit Bird' : 'Add Bird'}</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={16}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <FadeInUp>
            <Pressable onPress={handleCapture} style={styles.captureCard}>
              <BirdPhotoBadge icon={species.icon} size={88} style={styles.captureBadge} />
              <AppText variant="caption" color={colors.leafGreen}>
                {photoCaptured ? 'Photo captured' : 'Tap to add a photo'}
              </AppText>
              <Animated.View pointerEvents="none" style={[styles.flashOverlay, { opacity: flash }]} />
            </Pressable>
          </FadeInUp>

          <FormField label="Bird Name" value={form.name} onChangeText={(text) => update({ name: text })} placeholder="e.g. Daisy" />

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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerSpacer: {
    width: 44,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  captureCard: {
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    overflow: 'hidden',
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  captureBadge: {
    marginBottom: spacing.xs,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.cardSurface,
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
