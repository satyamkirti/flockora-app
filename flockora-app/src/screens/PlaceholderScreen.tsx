import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppScreen, AppText, EmptyState } from '../components';
import { colors } from '../theme';

export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <AppScreen>
      <View style={styles.container}>
        <EmptyState title={title} message="This section is reserved for the next phase of Flockora. The experience is intentionally polished but placeholder-only for now." />
        <AppText variant="caption" color={colors.secondaryText} style={styles.note}>
          Phase 1 focuses on the foundation, navigation shell, and visual system.
        </AppText>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  note: {
    marginTop: 16,
    textAlign: 'center',
  },
});
