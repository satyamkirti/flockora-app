import React, { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { AppScreen, AppText, IconButton, SectionHeader, FadeInUp } from '../components';
import { useOnboarding } from '../context/OnboardingContext';
import { DATABASE_VERSION } from '../db/migrations';
import { clearTemporaryCache, formatBytes } from '../services/cacheService';
import { MoreStackParamList } from '../navigation/moreTypes';
import { PRIVACY_POLICY_URL, PRIVACY_POLICY_URL_IS_PLACEHOLDER } from '../config/privacyConfig';
import { colors, radii, spacing } from '../theme';
import packageJson from '../../package.json';

type Props = NativeStackScreenProps<MoreStackParamList, 'Settings'>;

const APP_VERSION = Constants.expoConfig?.version ?? packageJson.version ?? 'Unknown';
const LIBRARY_NAMES = Object.keys(packageJson.dependencies ?? {}).sort();

const PRIVACY_POINTS: { title: string; body: string }[] = [
  {
    title: 'Local data',
    body: 'Your birds, flocks, tasks, health records, eggs, feed, and breeding/hatching data are stored only in a private database on this device — no cloud sync, no account.',
  },
  {
    title: 'Bird photo for AI analysis',
    body: "When you add your first bird, its photo is uploaded to Flockora's own backend server (never a third-party AI provider) so it can suggest breed, sex, color, and life stage details for you to confirm. This is the only thing Flockora sends off this device automatically.",
  },
  {
    title: 'No analytics',
    body: 'Flockora does not collect analytics or usage data of any kind.',
  },
  {
    title: 'No advertising',
    body: 'Flockora shows no ads and includes no advertising SDKs.',
  },
  {
    title: 'No third-party tracking',
    body: 'Your data is never sold or shared with third parties for advertising or tracking.',
  },
];

type SettingsRowProps = {
  label: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

function SettingsRow({ label, subtitle, icon, onPress }: SettingsRowProps) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.leafGreen} />
      </View>
      <View style={styles.rowText}>
        <AppText variant="cardTitle">{label}</AppText>
        {subtitle ? (
          <AppText variant="caption" color={colors.secondaryText}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
    </Pressable>
  );
}

type InfoRowProps = { label: string; value: string };

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <AppText variant="caption" color={colors.mutedText}>
        {label}
      </AppText>
      <AppText variant="cardTitle">{value}</AppText>
    </View>
  );
}

export function SettingsScreen({ navigation }: Props) {
  const { resetOnboarding } = useOnboarding();
  const [clearingCache, setClearingCache] = useState(false);

  const handleClearCache = () => {
    Alert.alert(
      'Clear cached files?',
      'This removes temporary files Flockora has created on this device — exported CSV/backup files and copies made while picking a backup to restore. Your birds, flocks, and records are not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: () => {
            setClearingCache(true);
            try {
              const result = clearTemporaryCache();
              if (result.fileCount === 0) {
                Alert.alert('Nothing to clear', 'There are no temporary files to remove right now.');
              } else {
                Alert.alert('Cache cleared', `Removed ${result.fileCount} file(s), freeing ${formatBytes(result.bytesFreed)}.`);
              }
            } catch (error) {
              Alert.alert('Something went wrong', 'Could not clear cached files. Please try again.');
            } finally {
              setClearingCache(false);
            }
          },
        },
      ]
    );
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      'Restart the welcome flow?',
      "This replays Flockora's welcome and first-bird setup screens from the beginning. None of your existing birds, flocks, or records will be deleted.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restart',
          onPress: () => {
            resetOnboarding();
            navigation
              .getParent() // AppTabs (the More tab's Tab.Navigator)
              ?.getParent() // RootNavigator (owns the "Main" route that AppTabs renders as)
              ?.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Welcome' }] }));
          },
        },
      ]
    );
  };

  const handleContactFeedback = () => {
    Alert.alert(
      'Contact & Feedback',
      'A dedicated feedback channel isn’t set up yet in this version of Flockora. Thanks for using the app!'
    );
  };

  const handlePrivacyPolicy = () => {
    if (PRIVACY_POLICY_URL_IS_PLACEHOLDER) {
      Alert.alert(
        'Privacy Policy not yet published',
        "Flockora doesn't have a published privacy policy online yet — this link will be added before the app is released. The Privacy Information above is accurate today."
      );
      return;
    }
    Linking.openURL(PRIVACY_POLICY_URL);
  };

  return (
    <AppScreen>
      <View style={styles.headerRow}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
        <AppText variant="sectionTitle">Settings</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <SectionHeader title="Data & App" />
        <FadeInUp style={styles.card}>
          <SettingsRow
            label="Backup & Restore"
            subtitle="Export or restore your data"
            icon="cloud-download-outline"
            onPress={() => navigation.navigate('BackupRestore')}
          />
          <SettingsRow
            label={clearingCache ? 'Clearing…' : 'Clear Cached Files'}
            subtitle="Removes temporary export files, not your data"
            icon="trash-outline"
            onPress={handleClearCache}
          />
          <SettingsRow
            label="Reset Onboarding"
            subtitle="Replay the welcome flow"
            icon="refresh-outline"
            onPress={handleResetOnboarding}
          />
        </FadeInUp>

        <SectionHeader title="About" />
        <FadeInUp delay={40} style={styles.card}>
          <AppText variant="cardTitle" style={styles.aboutTitle}>
            Flockora
          </AppText>
          <AppText variant="body" color={colors.secondaryText} style={styles.aboutBody}>
            Care. Hatch. Breed. Protect. Flockora helps backyard poultry keepers and hobby breeders track birds,
            flocks, daily care, eggs, feed, and breeding/hatching — all stored privately on this device.
          </AppText>
        </FadeInUp>

        <FadeInUp delay={60} style={styles.card}>
          <InfoRow label="App Version" value={String(APP_VERSION)} />
          <InfoRow label="Database Version" value={String(DATABASE_VERSION)} />
        </FadeInUp>

        <FadeInUp delay={80} style={styles.card}>
          <AppText variant="cardTitle" style={styles.aboutTitle}>
            Privacy Information
          </AppText>
          <AppText variant="body" color={colors.secondaryText} style={styles.aboutBody}>
            Flockora is a local-only app. Here's exactly what that means:
          </AppText>
          <View style={styles.privacyList}>
            {PRIVACY_POINTS.map((point) => (
              <View key={point.title} style={styles.privacyItem}>
                <AppText variant="body" style={styles.privacyItemTitle}>
                  {point.title}
                </AppText>
                <AppText variant="caption" color={colors.secondaryText}>
                  {point.body}
                </AppText>
              </View>
            ))}
          </View>
          <AppText variant="body" color={colors.secondaryText} style={styles.aboutBody}>
            Health/medical notes, like other data, are stored unencrypted on this device, consistent with a
            local-only, single-user app; avoid sharing your device or backup files with anyone you wouldn't trust
            with that information. A backup file is only ever sent anywhere if you explicitly export it and choose
            to share it yourself.
          </AppText>
          <Pressable onPress={handlePrivacyPolicy} hitSlop={8}>
            <AppText variant="button" color={colors.leafGreen}>
              Read the full Privacy Policy →
            </AppText>
          </Pressable>
        </FadeInUp>

        <FadeInUp delay={100} style={styles.card}>
          <AppText variant="cardTitle" style={styles.aboutTitle}>
            Open Source Libraries
          </AppText>
          <AppText variant="caption" color={colors.secondaryText} style={styles.aboutBody}>
            Flockora is built with these open-source packages. Full license terms are available from each package's
            own public repository.
          </AppText>
          <View style={styles.libraryList}>
            {LIBRARY_NAMES.map((name) => (
              <AppText key={name} variant="caption" color={colors.mutedText} style={styles.libraryItem}>
                {name}
              </AppText>
            ))}
          </View>
        </FadeInUp>

        <SectionHeader title="Support" />
        <FadeInUp delay={120} style={styles.card}>
          <SettingsRow
            label="Contact & Feedback"
            subtitle="Let us know what you think"
            icon="mail-outline"
            onPress={handleContactFeedback}
          />
        </FadeInUp>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerSpacer: {
    width: 44,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  rowIcon: {
    width: 28,
    alignItems: 'center',
  },
  rowText: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  aboutTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  aboutBody: {
    marginBottom: spacing.md,
  },
  privacyList: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  privacyItem: {
    gap: 2,
  },
  privacyItemTitle: {
    color: colors.primaryText,
  },
  libraryList: {
    paddingBottom: spacing.md,
  },
  libraryItem: {
    marginBottom: spacing.xs,
  },
});
