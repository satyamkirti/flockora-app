import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { IconButton } from './IconButton';
import { spacing } from '../theme';

type ScreenHeaderProps = {
  title?: string;
  onBack: () => void;
  rightAction?: React.ReactNode;
};

export function ScreenHeader({ title, onBack, rightAction }: ScreenHeaderProps) {
  return (
    <View style={styles.headerRow}>
      <IconButton name="chevron-back" onPress={onBack} accessibilityLabel="Go back" />
      {title ? <AppText variant="sectionTitle">{title}</AppText> : null}
      {rightAction ?? <View style={styles.headerSpacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerSpacer: {
    width: 44,
  },
});
