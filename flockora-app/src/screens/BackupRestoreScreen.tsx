import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import { AppScreen, AppText, PrimaryButton, IconButton, FadeInUp } from '../components';
import { backupRepository } from '../db/repositories';
import { DATABASE_VERSION } from '../db/migrations';
import { writeAndShareBackup, pickBackupFile, readBackupFile } from '../services/backupFileService';
import { isValidBackupData, checkSchemaCompatibility } from '../utils/backupValidation';
import { MoreStackParamList } from '../navigation/moreTypes';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<MoreStackParamList, 'BackupRestore'>;

export function BackupRestoreScreen({ navigation }: Props) {
  const db = useSQLiteContext();
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const data = await backupRepository.exportAllTables(db);
      const shared = await writeAndShareBackup(data);
      if (!shared) {
        Alert.alert('Sharing unavailable', 'Your device does not support sharing files right now.');
      }
    } catch (error) {
      Alert.alert('Something went wrong', 'Could not create a backup file. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const runRestore = async (uri: string) => {
    setRestoring(true);
    try {
      const parsed = await readBackupFile(uri);
      if (!isValidBackupData(parsed)) {
        Alert.alert('Not a valid backup', 'This file doesn’t look like a Flockora backup.');
        return;
      }
      if (checkSchemaCompatibility(parsed.schemaVersion, DATABASE_VERSION) === 'too_new') {
        Alert.alert(
          'Update required',
          'This backup was created with a newer version of Flockora. Please update the app before restoring it.'
        );
        return;
      }
      await backupRepository.restoreAllTables(db, parsed);
      Alert.alert(
        'Restore complete',
        'Your data has been restored. Reminders were not restored automatically — reopen a task or care record and save it again to reschedule its notification.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Restore failed', 'This file could not be read as a Flockora backup. No changes were made.');
    } finally {
      setRestoring(false);
    }
  };

  const handleRestorePress = async () => {
    if (restoring) return;
    const outcome = await pickBackupFile();
    if (outcome.status === 'canceled') {
      return;
    }
    if (outcome.status === 'error') {
      Alert.alert('Something went wrong', outcome.message);
      return;
    }

    Alert.alert(
      'Replace all current data?',
      `Restoring "${outcome.name}" will permanently replace every bird, flock, task, and record currently in Flockora with the contents of this backup. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', style: 'destructive', onPress: () => runRestore(outcome.uri) },
      ]
    );
  };

  return (
    <AppScreen>
      <View style={styles.headerRow}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} accessibilityLabel="Go back" />
        <AppText variant="sectionTitle">Backup & Restore</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <FadeInUp style={styles.card}>
          <AppText variant="cardTitle" style={styles.cardTitle}>
            Export Backup
          </AppText>
          <AppText variant="body" color={colors.secondaryText} style={styles.cardBody}>
            Creates a single file with every bird, flock, task, care record, egg log, feed item, and breeding/hatch
            record currently in Flockora. Save it somewhere safe, or move it to a new device.
          </AppText>
          <AppText variant="caption" color={colors.mutedText} style={styles.cardNote}>
            This file is not encrypted and can include health/medical notes, medicine, and veterinarian details —
            store and share it as carefully as you would any other personal record. Photos and attached documents are
            not copied into this file — only their on-device file paths, which may not open correctly on a different
            device or after a fresh install.
          </AppText>
          <PrimaryButton
            label={exporting ? 'Preparing…' : 'Export Backup'}
            onPress={handleExport}
            style={exporting ? styles.disabled : undefined}
          />
        </FadeInUp>

        <FadeInUp delay={60} style={styles.card}>
          <AppText variant="cardTitle" style={styles.cardTitle}>
            Restore from Backup
          </AppText>
          <AppText variant="body" color={colors.secondaryText} style={styles.cardBody}>
            Choose a Flockora backup file to restore. This replaces everything currently in the app — it does not
            merge with your existing data.
          </AppText>
          {restoring ? (
            <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
          ) : (
            <PrimaryButton label="Choose Backup File" onPress={handleRestorePress} style={styles.restoreButton} />
          )}
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
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    marginBottom: spacing.xs,
  },
  cardBody: {
    marginBottom: spacing.sm,
  },
  cardNote: {
    marginBottom: spacing.md,
  },
  restoreButton: {
    backgroundColor: colors.hatchOrange,
  },
  disabled: {
    opacity: 0.6,
  },
  loader: {
    marginVertical: spacing.md,
  },
});
