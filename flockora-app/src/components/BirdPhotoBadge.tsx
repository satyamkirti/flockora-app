import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { colors, shadows, spacing } from '../theme';

type BirdPhotoBadgeProps = {
  icon: string;
  size?: number;
  style?: ViewStyle;
};

export function BirdPhotoBadge({ icon, size = 120, style }: BirdPhotoBadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        shadows.card,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <AppText style={{ fontSize: size * 0.46 }}>{icon}</AppText>
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
  },
});
