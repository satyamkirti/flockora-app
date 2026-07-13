import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { AppScreen, AppText, PrimaryButton } from '../components';
import { colors, spacing } from '../theme';

const options = ['Bird', 'Egg', 'Medicine', 'Feed', 'Health concern', 'Vet document', 'Hatch tray'];

/**
 * Only "Egg" and "Hatch tray" are wired to real destinations — they route into the existing,
 * already-built Egg Production and Breeding/Hatching (Clutch) screens in the Flock tab. The
 * remaining options (Bird, Medicine, Feed, Health concern, Vet document) are out of scope for
 * this sprint and stay as inert placeholders, unchanged from before.
 */
export function CameraSheetScreen() {
  const navigation = useNavigation();

  const handlePress = (option: string) => {
    if (option === 'Egg') {
      navigation.dispatch(
        CommonActions.navigate({ name: 'Flock', params: { screen: 'AddEditEggRecord', params: {} } })
      );
    } else if (option === 'Hatch tray') {
      navigation.dispatch(
        CommonActions.navigate({ name: 'Flock', params: { screen: 'AddEditClutch', params: {} } })
      );
    }
  };

  return (
    <AppScreen>
      <View style={styles.container}>
        <AppText variant="display">Show us what you're looking at.</AppText>
        <AppText variant="body" color={colors.secondaryText} style={styles.subtitle}>
          Capture the moment, then confirm the action before anything is saved.
        </AppText>
        <View style={styles.optionList}>
          {options.map((option) => (
            <PrimaryButton key={option} label={option} onPress={() => handlePress(option)} style={styles.optionButton} />
          ))}
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  optionList: {
    gap: spacing.sm,
  },
  optionButton: {
    alignSelf: 'stretch',
  },
});
