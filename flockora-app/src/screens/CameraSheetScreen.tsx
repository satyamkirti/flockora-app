import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { AppScreen, AppText, PrimaryButton } from '../components';
import { colors, spacing } from '../theme';

const options = ['Bird', 'Egg', 'Medicine', 'Feed', 'Health concern', 'Vet document', 'Hatch tray'];

/**
 * Every option routes into an existing, already-built screen in the Flock tab — none of these
 * capture targets have their own persistence or UI beyond that destination screen; they just
 * jump straight to the create form that already exists for that record type. "Vet document"
 * opens the Care Record form's own document/photo attachment (added alongside this wiring).
 */
export function CameraSheetScreen() {
  const navigation = useNavigation();

  const handlePress = (option: string) => {
    if (option === 'Bird') {
      navigation.dispatch(
        CommonActions.navigate({ name: 'Flock', params: { screen: 'AddEditBird', params: {} } })
      );
    } else if (option === 'Egg') {
      navigation.dispatch(
        CommonActions.navigate({ name: 'Flock', params: { screen: 'AddEditEggRecord', params: {} } })
      );
    } else if (option === 'Medicine') {
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Flock',
          params: { screen: 'AddEditHealthRecord', params: { presetType: 'treatment' } },
        })
      );
    } else if (option === 'Feed') {
      navigation.dispatch(
        CommonActions.navigate({ name: 'Flock', params: { screen: 'LogFeedUsage', params: {} } })
      );
    } else if (option === 'Health concern') {
      navigation.dispatch(
        CommonActions.navigate({ name: 'Flock', params: { screen: 'AddEditHealthRecord', params: {} } })
      );
    } else if (option === 'Vet document') {
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Flock',
          params: { screen: 'AddEditHealthRecord', params: { presetType: 'other' } },
        })
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
