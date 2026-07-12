import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows, spacing } from '../theme';

type FloatingCameraButtonProps = {
  onPress?: () => void;
};

export function FloatingCameraButton({ onPress }: FloatingCameraButtonProps) {
  return (
    <Pressable onPress={onPress} style={[styles.button, shadows.card]}>
      <Ionicons name="camera" size={28} color={colors.primaryText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 70,
    height: 70,
    borderRadius: 999,
    backgroundColor: colors.sunflowerYellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
});
