import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { colors, spacing } from '../theme';

type TextButtonProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export function TextButton({ label, onPress, disabled, style }: TextButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <AppText variant="button" color={colors.secondaryText}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});
