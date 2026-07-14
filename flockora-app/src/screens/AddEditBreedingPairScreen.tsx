import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
  BirdPickerModal,
  FadeInUp,
} from '../components';
import { useBreedingPair, useBirds } from '../hooks';
import { breedingRepository, InvalidSexPairingError, SameBirdPairingError } from '../db/repositories';
import { classifyBirdSex } from '../utils/birdSex';
import { BreedingPairInput, BreedingPairStatus, createEmptyBreedingPairInput } from '../types/breeding';
import { FlockStackParamList } from '../navigation/flockTypes';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<FlockStackParamList, 'AddEditBreedingPair'>;

const statusOptions: { label: string; value: BreedingPairStatus }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Separated', value: 'separated' },
  { label: 'Retired', value: 'retired' },
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function AddEditBreedingPairScreen({ route, navigation }: Props) {
  const { pairId } = route.params;
  const isEditing = pairId != null;
  const db = useSQLiteContext();
  const { pair: existingPair, loading: loadingPair } = useBreedingPair(pairId);
  const { birds } = useBirds();
  const activeBirds = birds.filter((bird) => bird.isActive);

  const [form, setForm] = useState<BreedingPairInput>(createEmptyBreedingPairInput());
  const [pairedDateText, setPairedDateText] = useState(form.pairedDate);
  const [separatedDateText, setSeparatedDateText] = useState('');
  const [maleModalVisible, setMaleModalVisible] = useState(false);
  const [femaleModalVisible, setFemaleModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(!isEditing);

  useEffect(() => {
    if (isEditing && existingPair && !hydrated) {
      setForm({
        maleBirdId: existingPair.maleBirdId,
        femaleBirdId: existingPair.femaleBirdId,
        pairName: existingPair.pairName,
        pairedDate: existingPair.pairedDate,
        separatedDate: existingPair.separatedDate,
        status: existingPair.status,
        notes: existingPair.notes,
      });
      setPairedDateText(existingPair.pairedDate);
      setSeparatedDateText(existingPair.separatedDate ?? '');
      setHydrated(true);
    }
  }, [isEditing, existingPair, hydrated]);

  const update = (patch: Partial<BreedingPairInput>) => setForm((current) => ({ ...current, ...patch }));

  const maleBird = activeBirds.find((bird) => bird.id === form.maleBirdId) ?? birds.find((bird) => bird.id === form.maleBirdId);
  const femaleBird = activeBirds.find((bird) => bird.id === form.femaleBirdId) ?? birds.find((bird) => bird.id === form.femaleBirdId);

  const maleSexKnown = maleBird ? classifyBirdSex(maleBird.sex) !== 'unknown' : false;
  const femaleSexKnown = femaleBird ? classifyBirdSex(femaleBird.sex) !== 'unknown' : false;
  const showSexWarning = Boolean(maleBird) && Boolean(femaleBird) && (!maleSexKnown || !femaleSexKnown);

  const handleDelete = () => {
    if (pairId == null) return;
    Alert.alert(
      'Delete breeding pair',
      `Delete this breeding pair${form.pairName ? ` "${form.pairName}"` : ''}? Clutch and hatch history stay on record but will no longer be linked to a pair. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await breedingRepository.deleteBreedingPair(db, pairId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!form.maleBirdId || !form.femaleBirdId) {
      Alert.alert('Select both birds', 'Please choose a male and a female bird for this pair.');
      return;
    }
    if (!DATE_PATTERN.test(pairedDateText.trim())) {
      Alert.alert('Invalid paired date', 'Please use YYYY-MM-DD for the paired date.');
      return;
    }
    if (separatedDateText.trim() && !DATE_PATTERN.test(separatedDateText.trim())) {
      Alert.alert('Invalid separated date', 'Please use YYYY-MM-DD for the separated date.');
      return;
    }

    const payload: BreedingPairInput = {
      ...form,
      pairName: form.pairName?.trim() || null,
      pairedDate: pairedDateText.trim(),
      separatedDate: separatedDateText.trim() || null,
      notes: form.notes?.trim() || null,
    };

    setSaving(true);
    try {
      if (isEditing && pairId != null) {
        await breedingRepository.updateBreedingPair(db, pairId, payload);
      } else {
        await breedingRepository.createBreedingPair(db, payload);
      }
      navigation.goBack();
    } catch (error) {
      if (error instanceof SameBirdPairingError || error instanceof InvalidSexPairingError) {
        Alert.alert('Cannot save this pair', error.message);
      } else {
        Alert.alert('Something went wrong', 'Could not save this breeding pair. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (isEditing && loadingPair && !hydrated) {
    return (
      <AppScreen>
        <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <View style={styles.headerRow}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} accessibilityLabel="Go back" />
        <AppText variant="sectionTitle">{isEditing ? 'Edit Pair' : 'Add Breeding Pair'}</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={16}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.fieldBlock}>
            <AppText variant="cardTitle" style={styles.label}>
              Male
            </AppText>
            <Pressable style={styles.pickerField} onPress={() => setMaleModalVisible(true)}>
              <AppText variant="body">{maleBird?.name ?? 'Select a male bird'}</AppText>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </Pressable>
          </View>

          <View style={styles.fieldBlock}>
            <AppText variant="cardTitle" style={styles.label}>
              Female
            </AppText>
            <Pressable style={styles.pickerField} onPress={() => setFemaleModalVisible(true)}>
              <AppText variant="body">{femaleBird?.name ?? 'Select a female bird'}</AppText>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </Pressable>
          </View>

          {showSexWarning ? (
            <FadeInUp style={styles.warningCard}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.hatchOrange} />
              <AppText variant="caption" color={colors.primaryText} style={styles.warningText}>
                This pairing can't be fully validated — one or both birds don't have a confidently recorded sex.
              </AppText>
            </FadeInUp>
          ) : null}

          <FormField
            label="Pair Name"
            optional
            value={form.pairName ?? ''}
            onChangeText={(text) => update({ pairName: text })}
            placeholder="e.g. Rocky & Daisy"
          />

          <View style={styles.countRow}>
            <View style={styles.countInput}>
              <FormField
                label="Paired Date"
                value={pairedDateText}
                onChangeText={setPairedDateText}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.countInput}>
              <FormField
                label="Separated Date"
                optional
                value={separatedDateText}
                onChangeText={setSeparatedDateText}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <AppText variant="cardTitle" style={styles.label}>
              Status
            </AppText>
            <SegmentedControl options={statusOptions} value={form.status} onChange={(value) => update({ status: value })} />
          </View>

          <FormField
            label="Notes"
            optional
            multiline
            value={form.notes ?? ''}
            onChangeText={(text) => update({ notes: text })}
            placeholder="Anything worth remembering about this pair"
          />

          {isEditing ? (
            <PrimaryButton label="Delete Pair" onPress={handleDelete} style={styles.deleteButton} />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <PrimaryButton
        label={saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Pair'}
        onPress={handleSave}
        style={saving ? styles.disabled : undefined}
      />

      <BirdPickerModal
        visible={maleModalVisible}
        onClose={() => setMaleModalVisible(false)}
        birds={activeBirds}
        selectedBirdId={form.maleBirdId || null}
        onSelect={(birdId) => {
          if (birdId != null) update({ maleBirdId: birdId });
        }}
      />

      <BirdPickerModal
        visible={femaleModalVisible}
        onClose={() => setFemaleModalVisible(false)}
        birds={activeBirds}
        selectedBirdId={form.femaleBirdId || null}
        onSelect={(birdId) => {
          if (birdId != null) update({ femaleBirdId: birdId });
        }}
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
  fieldBlock: {
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.xs,
  },
  pickerField: {
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
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#FFF2E3',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  warningText: {
    flex: 1,
  },
  countRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  countInput: {
    flex: 1,
  },
  disabled: {
    opacity: 0.6,
  },
  deleteButton: {
    backgroundColor: colors.alertCoral,
    marginTop: spacing.sm,
  },
});
