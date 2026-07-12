import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppScreen, AppText, PrimaryButton, FadeInUp } from '../components';
import { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const highlights = [
  { icon: '☀️', text: 'A calm daily view of everything your flock needs' },
  { icon: '📸', text: 'Point your camera at a bird and let Flockora help identify it' },
  { icon: '🐣', text: 'Track hatching, breeding, and health in one warm, simple place' },
];

export function WelcomeScreen({ navigation }: Props) {
  return (
    <AppScreen>
      <View style={styles.container}>
        <FadeInUp>
          <View style={styles.badge}>
            <AppText style={styles.badgeIcon}>🐔</AppText>
          </View>
        </FadeInUp>

        <FadeInUp delay={80}>
          <AppText variant="display" align="center">
            Welcome to Flockora
          </AppText>
          <AppText variant="body" color={colors.leafGreen} align="center" style={styles.tagline}>
            Care. Hatch. Breed. Protect.
          </AppText>
        </FadeInUp>

        <FadeInUp delay={160} style={styles.highlightList}>
          {highlights.map((item) => (
            <View key={item.text} style={styles.highlightRow}>
              <AppText style={styles.highlightIcon}>{item.icon}</AppText>
              <AppText variant="body" color={colors.secondaryText} style={styles.highlightText}>
                {item.text}
              </AppText>
            </View>
          ))}
        </FadeInUp>

        <FadeInUp delay={240} style={styles.footer}>
          <PrimaryButton label="Get Started" onPress={() => navigation.navigate('BirdTypeSelection')} />
          <AppText variant="caption" color={colors.mutedText} align="center" style={styles.footNote}>
            Setting up your flock takes about a minute
          </AppText>
        </FadeInUp>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  badge: {
    alignSelf: 'center',
    width: 110,
    height: 110,
    borderRadius: 999,
    backgroundColor: colors.sunflowerYellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  badgeIcon: {
    fontSize: 54,
  },
  tagline: {
    marginTop: spacing.xs,
  },
  highlightList: {
    marginTop: spacing.xxl,
    backgroundColor: colors.cardSurface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  highlightIcon: {
    fontSize: 22,
    marginRight: spacing.md,
  },
  highlightText: {
    flex: 1,
  },
  footer: {
    marginTop: spacing.xxl,
  },
  footNote: {
    marginTop: spacing.md,
  },
});
