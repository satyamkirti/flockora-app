import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../theme';

type IconButtonProps = {
  name: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  tinted?: boolean;
  accessibilityLabel: string;
  accessibilityHint?: string;
};

export function IconButton({ name, onPress, tinted = false, accessibilityLabel, accessibilityHint }: IconButtonProps) {
  return (
    <Pressable
      style={[styles.button, tinted && styles.tinted]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <Ionicons name={name} size={20} color={tinted ? colors.cardSurface : colors.primaryText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tinted: {
    backgroundColor: colors.sunflowerYellow,
    borderColor: colors.sunflowerYellow,
  },
});
