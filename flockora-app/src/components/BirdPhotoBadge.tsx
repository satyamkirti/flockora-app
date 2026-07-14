import React from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { colors, shadows, spacing } from '../theme';

type BirdPhotoBadgeProps = {
  icon: string;
  /** The bird's captured photo URI, if any. Reuses the same URI already stored as
   *  `birds.photoUri` / onboarding's `CapturedPhoto.uri` — never copies or re-stores it.
   *  Falls back to the species emoji `icon` when absent, or for the legacy 'captured'
   *  sentinel string some pre-Sprint-3.2 rows may still hold. */
  photoUri?: string | null;
  size?: number;
  style?: ViewStyle;
};

export function BirdPhotoBadge({ icon, photoUri, size = 120, style }: BirdPhotoBadgeProps) {
  const hasPhoto = Boolean(photoUri && photoUri !== 'captured');

  return (
    <View
      style={[
        styles.badge,
        shadows.card,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      {hasPhoto ? (
        <Image
          source={{ uri: photoUri as string }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <AppText style={{ fontSize: size * 0.46 }}>{icon}</AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.softGreen,
    borderWidth: 3,
    borderColor: colors.sunflowerYellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
});
