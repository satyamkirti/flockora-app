import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppScreen, AppText, PrimaryButton } from '../components';
import { colors, spacing } from '../theme';

const options = ['Bird', 'Egg', 'Medicine', 'Feed', 'Health concern', 'Vet document', 'Hatch tray'];

export function CameraSheetScreen() {
  return (
    <AppScreen>
      <View style={styles.container}>
        <AppText variant="display">Show us what you're looking at.</AppText>
        <AppText variant="body" color={colors.secondaryText} style={styles.subtitle}>
          Capture the moment, then confirm the action before anything is saved.
        </AppText>
        <View style={styles.optionList}>
          {options.map((option) => (
            <PrimaryButton key={option} label={option} style={styles.optionButton} />
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
