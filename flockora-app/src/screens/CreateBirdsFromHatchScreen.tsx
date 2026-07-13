import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import {
  AppScreen,
  AppText,
  PrimaryButton,
  IconButton,
  FormField,
  SelectableCard,
  FlockManagerModal,
  FadeInUp,
} from '../components';
import { useHatchRecordById, useClutch, useBreedingPairs, useBirds, useFlocks } from '../hooks';
import { breedingRepository, DuplicateBirdCreationError } from '../db/repositories';
import { deriveClutchSpecies } from '../utils/breedingCalc';
import { speciesOptions } from '../data/onboardingData';
import { SpeciesKey } from '../types/onboarding';
import { FlockStackParamList } from '../navigation/flockTypes';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<FlockStackParamList, 'CreateBirdsFromHatch'>;

export function CreateBirdsFromHatchScreen({ route, navigation }: Props) {
  const { hatchRecordId } = route.params;
  const db = useSQLiteContext();
  const { record: hatchRecord, loading: loadingHatch } = useHatchRecordById(hatchRecordId);
  const { clutch } = useClutch(hatchRecord?.clutchId);
  const { pairs } = useBreedingPairs();
  const { birds } = useBirds();
  const { flocks, refresh: refreshFlocks } = useFlocks();

  const [countText, setCountText] = useState('1');
  const [namePrefix, setNamePrefix] = useState('Chick');
  const [species, setSpecies] = useState<SpeciesKey>('chicken');
  const [flockId, setFlockId] = useState<number | null>(null);
  const [flockModalVisible, setFlockModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized && hatchRecord && clutch) {
      setCountText(String(hatchRecord.hatchedEggs || 1));
      const derived = deriveClutchSpecies(clutch, pairs, birds);
      if (derived) {
        setSpecies(derived);
      }
      setFlockId(clutch.flockId);
      setInitialized(true);
    }
  }, [initialized, hatchRecord, clutch, pairs, birds]);

  const flockName = flocks.find((flock) => flock.id === flockId)?.name ?? 'No Flock';

  const handleCreate = async () => {
    if (!hatchRecord) {
      return;
    }
    if (hatchRecord.birdsCreated) {
      Alert.alert('Already added', 'Birds have already been created from this hatch record.');
      return;
    }
    const count = Number.parseInt(countText, 10);
    if (!Number.isFinite(count) || count <= 0) {
      Alert.alert('Invalid count', 'Please enter how many birds to create.');
      return;
    }
    if (!namePrefix.trim()) {
      Alert.alert('Name required', 'Please enter a name or name prefix for the new birds.');
      return;
    }

    setSaving(true);
    try {
      const created = await breedingRepository.createBirdsFromHatch(db, hatchRecordId, {
        count,
        species,
        namePrefix: namePrefix.trim(),
        flockId,
      });
      Alert.alert('Birds added', `${created.length} ${created.length === 1 ? 'bird was' : 'birds were'} added to your flock.`);
      navigation.goBack();
    } catch (error) {
      if (error instanceof DuplicateBirdCreationError) {
        Alert.alert('Already added', error.message);
      } else {
        Alert.alert('Something went wrong', 'Could not create birds from this hatch. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loadingHatch || !initialized) {
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
        <AppText variant="sectionTitle">Add Hatched Birds</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <FadeInUp>
          <AppText variant="body" color={colors.secondaryText} style={styles.intro}>
            Create bird records for this hatch. Batch keepers can leave the count high and skip individual names —
            breeders can set the count to 1 and rename each bird afterward from the Flock tab.
          </AppText>
        </FadeInUp>

        <FormField
          label="Number of Birds"
          value={countText}
          onChangeText={setCountText}
          placeholder="1"
          keyboardType="number-pad"
        />

        <FormField
          label="Name Prefix"
          value={namePrefix}
          onChangeText={setNamePrefix}
          placeholder="e.g. Chick"
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
                  selected={species === option.key}
                  onPress={() => setSpecies(option.key)}
                />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <AppText variant="cardTitle" style={styles.label}>
            Flock
          </AppText>
          <Pressable style={styles.pickerField} onPress={() => setFlockModalVisible(true)}>
            <AppText variant="body">{flockName}</AppText>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
          </Pressable>
        </View>
      </ScrollView>

      <PrimaryButton
        label={saving ? 'Adding…' : 'Add Hatched Birds'}
        onPress={handleCreate}
        style={saving ? styles.disabled : undefined}
      />

      <FlockManagerModal
        visible={flockModalVisible}
        onClose={() => setFlockModalVisible(false)}
        flocks={flocks}
        onChanged={refreshFlocks}
        selectable
        selectedFlockId={flockId}
        onSelect={setFlockId}
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
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  intro: {
    marginBottom: spacing.lg,
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
  disabled: {
    opacity: 0.6,
  },
});
