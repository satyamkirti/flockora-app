import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors, radii, shadows, spacing } from '../theme';

type SelectableCardProps = {
  icon: string;
  label: string;
  blurb?: string;
  selected: boolean;
  onPress: () => void;
};

export function SelectableCard({ icon, label, blurb, selected, onPress }: SelectableCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, friction: 6 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, shadows.card, selected && styles.cardSelected]}
        accessibilityRole="button"
        accessibilityLabel={blurb ? `${label}, ${blurb}` : label}
        accessibilityState={{ selected }}
      >
        {selected ? (
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={14} color={colors.cardSurface} />
          </View>
        ) : null}
        <AppText style={styles.icon}>{icon}</AppText>
        <AppText variant="cardTitle" align="center">
          {label}
        </AppText>
        {blurb ? (
          <AppText variant="caption" color={colors.secondaryText} align="center" style={styles.blurb}>
            {blurb}
          </AppText>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 132,
  },
  cardSelected: {
    borderColor: colors.leafGreen,
    backgroundColor: colors.softGreen,
  },
  checkBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: colors.leafGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 34,
    marginBottom: spacing.xs,
  },
  blurb: {
    marginTop: 2,
  },
});
