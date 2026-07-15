import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import { AppScreen, AppText, PrimaryButton, FormField, SelectableCard, FadeInUp, ScreenHeader } from '../components';
import { flockRepository } from '../db/repositories';
import { speciesOptions } from '../data/onboardingData';
import { flockPurposeOptions } from '../data/flockPurposeTypes';
import { FlockInput, createEmptyFlockInput } from '../types/flock';
import { FlockStackParamList } from '../navigation/flockTypes';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<FlockStackParamList, 'AddEditFlock'>;

export function AddEditFlockScreen({ route, navigation }: Props) {
  const { flockId } = route.params;
  const isEditing = flockId != null;
  const db = useSQLiteContext();

  const [form, setForm] = useState<FlockInput>(createEmptyFlockInput());
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEditing || flockId == null) {
      return;
    }
    let cancelled = false;
    flockRepository.getById(db, flockId).then((flock) => {
      if (!cancelled && flock) {
        setForm({ name: flock.name, species: flock.species, breed: flock.breed, purpose: flock.purpose, notes: flock.notes });
      }
      if (!cancelled) {
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [db, isEditing, flockId]);

  const update = (patch: Partial<FlockInput>) => setForm((current) => ({ ...current, ...patch }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Group name required', 'Please enter a name for this flock or group.');
      return;
    }

    const payload: FlockInput = {
      name: form.name.trim(),
      species: form.species,
      breed: form.breed?.trim() || null,
      purpose: form.purpose,
      notes: form.notes?.trim() || null,
    };

    setSaving(true);
    try {
      if (isEditing && flockId != null) {
        await flockRepository.update(db, flockId, payload);
      } else {
        await flockRepository.create(db, payload);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Something went wrong', 'Could not save this group. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppScreen>
        <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScreenHeader title={isEditing ? 'Edit Group' : 'New Group'} onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={16}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <FadeInUp>
            <FormField label="Group Name" value={form.name} onChangeText={(text) => update({ name: text })} placeholder="e.g. Backyard Layers" />
          </FadeInUp>

          <FadeInUp delay={40} style={styles.fieldBlock}>
            <AppText variant="cardTitle" style={styles.label}>
              Species
            </AppText>
            <AppText variant="caption" color={colors.mutedText} style={styles.hint}>
              Optional — leave unselected for a mixed-species group.
            </AppText>
            <View style={styles.grid}>
              {speciesOptions.map((option) => (
                <View key={option.key} style={styles.gridItem}>
                  <SelectableCard
                    icon={option.icon}
                    label={option.label}
                    selected={form.species === option.key}
                    onPress={() => update({ species: form.species === option.key ? null : option.key })}
                  />
                </View>
              ))}
            </View>
          </FadeInUp>

          <FadeInUp delay={80}>
            <FormField
              label="Breed"
              optional
              value={form.breed ?? ''}
              onChangeText={(text) => update({ breed: text })}
              placeholder="e.g. Rhode Island Red (if applicable)"
            />
          </FadeInUp>

          <FadeInUp delay={120} style={styles.fieldBlock}>
            <AppText variant="cardTitle" style={styles.label}>
              Purpose
            </AppText>
            <View style={styles.grid}>
              {flockPurposeOptions.map((option) => (
                <View key={option.key} style={styles.gridItem}>
                  <SelectableCard
                    icon={option.icon}
                    label={option.label}
                    selected={form.purpose === option.key}
                    onPress={() => update({ purpose: form.purpose === option.key ? null : option.key })}
                  />
                </View>
              ))}
            </View>
          </FadeInUp>

          <FadeInUp delay={160}>
            <FormField
              label="Notes"
              optional
              multiline
              value={form.notes ?? ''}
              onChangeText={(text) => update({ notes: text })}
              placeholder="Anything worth remembering about this group"
            />
          </FadeInUp>
        </ScrollView>
      </KeyboardAvoidingView>

      <PrimaryButton
        label={saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Group'}
        onPress={handleSave}
        style={saving ? styles.disabled : undefined}
        disabled={saving}
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
  fieldBlock: {
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.xs,
  },
  hint: {
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridItem: {
    width: '31%',
  },
  disabled: {
    opacity: 0.6,
  },
});
