import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors, radii, spacing } from '../theme';

export type BarChartPoint = {
  label: string;
  value: number;
};

type BarChartProps = {
  data: BarChartPoint[];
};

const TRACK_HEIGHT = 120;

export function BarChart({ data }: BarChartProps) {
  const maxValue = Math.max(1, ...data.map((point) => point.value));

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {data.map((point, index) => {
        const heightPercent = `${Math.max(4, (point.value / maxValue) * 100)}%` as `${number}%`;
        return (
          <View key={`${point.label}-${index}`} style={styles.column}>
            <AppText variant="caption" color={colors.secondaryText} style={styles.value}>
              {point.value}
            </AppText>
            <View style={styles.track}>
              <View style={[styles.bar, { height: heightPercent }]} />
            </View>
            <AppText variant="caption" color={colors.mutedText} style={styles.label} numberOfLines={1}>
              {point.label}
            </AppText>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  column: {
    alignItems: 'center',
    width: 34,
  },
  value: {
    marginBottom: spacing.xs,
  },
  track: {
    width: 16,
    height: TRACK_HEIGHT,
    borderRadius: radii.sm,
    backgroundColor: colors.softGreen,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    backgroundColor: colors.leafGreen,
    borderRadius: radii.sm,
  },
  label: {
    marginTop: spacing.xs,
  },
});
