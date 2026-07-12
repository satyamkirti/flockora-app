import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radii } from '../theme';

type ProgressBarProps = {
  progress: number;
};

export function ProgressBar({ progress }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, progress));

  const widthPercent = `${clamped * 100}%` as `${number}%`;

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: widthPercent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 10,
    borderRadius: radii.sm,
    backgroundColor: colors.softGreen,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.sm,
    backgroundColor: colors.leafGreen,
  },
});
