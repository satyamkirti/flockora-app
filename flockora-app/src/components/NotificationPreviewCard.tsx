import React, { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { StatusPill } from './StatusPill';
import {
  ensureNotificationPermission,
  getNotificationPermissionStatus,
  sendTestNotification,
  NotificationPermissionStatus,
} from '../services/notificationService';
import { colors, radii, spacing } from '../theme';

export type NotificationPreviewRow = {
  key: string;
  label: string;
  /** When this reminder will next fire, or null if it won't (see `disabledReason`). */
  scheduledDate: Date | null;
  /** Why there's no scheduled date — e.g. "Reminder is off", "Enter a date to schedule this". */
  disabledReason?: string;
  testTitle: string;
  testBody: string;
  categoryIdentifier: string;
  testData: Record<string, unknown>;
};

type Props = {
  rows: NotificationPreviewRow[];
};

function formatScheduledDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

const permissionCopy: Record<NotificationPermissionStatus, { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  granted: { label: 'Notifications on', tone: 'success' },
  denied: { label: 'Notifications off', tone: 'danger' },
  undetermined: { label: 'Not asked yet', tone: 'warning' },
};

export function NotificationPreviewCard({ rows }: Props) {
  const [permission, setPermission] = useState<NotificationPermissionStatus | null>(null);

  const refreshPermission = async () => {
    const status = await getNotificationPermissionStatus();
    setPermission(status);
  };

  useEffect(() => {
    refreshPermission();
  }, []);

  const handleEnable = async () => {
    const granted = await ensureNotificationPermission();
    await refreshPermission();
    if (!granted) {
      Alert.alert(
        'Notifications are still off',
        'Flockora needs permission in your device Settings to send reminders.',
        [{ text: 'Not now' }, { text: 'Open Settings', onPress: () => Linking.openSettings() }]
      );
    }
  };

  const handleSendTest = async (row: NotificationPreviewRow) => {
    const sent = await sendTestNotification({
      title: row.testTitle,
      body: row.testBody,
      categoryIdentifier: row.categoryIdentifier,
      data: row.testData,
    });
    await refreshPermission();
    if (sent) {
      Alert.alert('Test notification sent', `Check your notification shade for "${row.label}" in a couple of seconds.`);
    } else {
      Alert.alert('Notifications are off', 'Enable notifications in your device Settings, then try again.');
    }
  };

  const copy = permission ? permissionCopy[permission] : null;

  return (
    <View style={styles.card} accessibilityLabel="Notification preview">
      <View style={styles.header}>
        <AppText variant="cardTitle">Notification Preview</AppText>
        {copy ? <StatusPill label={copy.label} tone={copy.tone} /> : null}
      </View>

      {permission === 'denied' ? (
        <AppText variant="caption" color={colors.secondaryText} style={styles.explainer}>
          Notifications are off for Flockora. Reminders you set here are still saved, but you won't get a phone alert
          until you enable notifications in your device Settings.
        </AppText>
      ) : permission === 'undetermined' ? (
        <AppText variant="caption" color={colors.secondaryText} style={styles.explainer}>
          Flockora hasn't asked for notification permission yet. Enable it to get a phone alert for reminders you set
          below.
        </AppText>
      ) : null}

      {permission === 'denied' || permission === 'undetermined' ? (
        <Pressable
          onPress={handleEnable}
          style={styles.enableButton}
          accessibilityRole="button"
          accessibilityLabel="Enable notifications"
          accessibilityHint="Requests notification permission for Flockora"
        >
          <AppText variant="button" color={colors.cardSurface}>
            Enable Notifications
          </AppText>
        </Pressable>
      ) : null}

      {rows.map((row, index) => (
        <View key={row.key} style={[styles.row, index === rows.length - 1 && styles.rowLast]}>
          <View style={styles.rowText}>
            <AppText variant="cardTitle">{row.label}</AppText>
            {row.scheduledDate ? (
              <AppText variant="caption" color={colors.secondaryText}>
                Next reminder: {formatScheduledDate(row.scheduledDate)}
              </AppText>
            ) : (
              <AppText variant="caption" color={colors.mutedText}>
                {row.disabledReason ?? 'Not scheduled'}
              </AppText>
            )}
          </View>
          <Pressable
            onPress={() => handleSendTest(row)}
            style={styles.testButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`Send a test notification for ${row.label}`}
            accessibilityHint="Fires this reminder's notification immediately so you can check it works"
          >
            <AppText variant="caption" color={colors.leafGreen}>
              Send test
            </AppText>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  explainer: {
    marginTop: spacing.xs,
  },
  enableButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.leafGreen,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rowLast: {},
  rowText: {
    flex: 1,
    marginRight: spacing.md,
  },
  testButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
