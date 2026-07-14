import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';
import { Task } from '../types/task';
import { HealthRecord } from '../types/healthRecord';
import { FeedItem } from '../types/feed';
import { Clutch } from '../types/breeding';
import { taskTypeByKey } from '../data/taskTypes';
import { healthRecordTypeByKey } from '../data/healthRecordTypes';
import { parseLocalDateString } from '../utils/taskSchedule';

/** iOS notification-category identifiers, registered once at app startup (see notificationNavigation.ts). */
export const NOTIFICATION_CATEGORIES = {
  task: 'task-reminder',
  health: 'health-reminder',
  feed: 'feed-alert',
  breeding: 'breeding-reminder',
} as const;

/**
 * Cross-platform routing discriminant carried in every notification's `data` payload (in
 * addition to `categoryIdentifier`, which iOS uses natively but Android ignores) so a tap can be
 * routed to the right detail screen on either platform. See notificationNavigation.ts.
 */
export type NotificationDataType = 'task' | 'healthRecord' | 'feedItem' | 'clutch';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export async function ensureNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') {
    return true;
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Read-only permission check — never prompts. Used by UI that just wants to *display* current
 * status (e.g. a notification preview card) without triggering an OS permission dialog as a
 * side effect of rendering.
 */
export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/**
 * Call after saving an entity whose reminder the user wanted but that came back with no
 * notification ID. Re-checks permission (rather than trusting the null alone) so a reminder
 * skipped for a legitimate reason (e.g. a feed-expiry/hatch date already in the past) isn't
 * misreported as a permission problem.
 */
export async function warnIfNotificationPermissionMissing(missingNotification: boolean): Promise<void> {
  if (!missingNotification) {
    return;
  }
  const granted = await ensureNotificationPermission();
  if (!granted) {
    Alert.alert('Notifications are off', 'Enable notifications for Flockora in your device settings to get reminders.');
  }
}

export async function cancelNotification(notificationId: string | null): Promise<void> {
  if (!notificationId) {
    return;
  }
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    // Notification may already be gone; nothing further to do.
  }
}

function buildTaskTrigger(
  task: Pick<Task, 'dueDate' | 'repeatType'>
): Notifications.SchedulableNotificationTriggerInput {
  const due = new Date(task.dueDate);

  switch (task.repeatType) {
    case 'daily':
      return {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: due.getHours(),
        minute: due.getMinutes(),
      };
    case 'weekly':
      return {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: due.getDay() + 1,
        hour: due.getHours(),
        minute: due.getMinutes(),
      };
    case 'monthly':
      return {
        type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
        day: due.getDate(),
        hour: due.getHours(),
        minute: due.getMinutes(),
      };
    default:
      return {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: due,
      };
  }
}

type SchedulableTask = Pick<Task, 'id' | 'title' | 'type' | 'description' | 'dueDate' | 'repeatType'>;

export async function scheduleTaskNotification(task: SchedulableTask): Promise<string | null> {
  const granted = await ensureNotificationPermission();
  if (!granted) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    identifier: `task-${task.id}`,
    content: {
      title: task.title,
      body: task.description || taskTypeByKey(task.type).label,
      categoryIdentifier: NOTIFICATION_CATEGORIES.task,
      data: { type: 'task' satisfies NotificationDataType, category: 'Task Reminder', taskId: task.id },
    },
    trigger: buildTaskTrigger(task),
  });
}

export async function syncTaskNotification(
  task: SchedulableTask & { notificationEnabled: boolean },
  previousNotificationId: string | null
): Promise<string | null> {
  await cancelNotification(previousNotificationId);
  if (!task.notificationEnabled) {
    return null;
  }
  return scheduleTaskNotification(task);
}

type SchedulableHealthReminder = Pick<HealthRecord, 'id' | 'title' | 'type' | 'notes' | 'reminderDate'>;

export async function scheduleHealthReminder(record: SchedulableHealthReminder): Promise<string | null> {
  if (!record.reminderDate) {
    return null;
  }
  const granted = await ensureNotificationPermission();
  if (!granted) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    identifier: `health-${record.id}`,
    content: {
      title: record.title,
      body: record.notes || healthRecordTypeByKey(record.type).label,
      categoryIdentifier: NOTIFICATION_CATEGORIES.health,
      data: { type: 'healthRecord' satisfies NotificationDataType, category: 'Health Reminder', recordId: record.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(record.reminderDate),
    },
  });
}

export async function syncHealthReminder(
  record: SchedulableHealthReminder,
  previousNotificationId: string | null
): Promise<string | null> {
  await cancelNotification(previousNotificationId);
  return scheduleHealthReminder(record);
}

const FEED_EXPIRY_WARNING_DAYS = 3;

type SchedulableFeedExpiry = Pick<FeedItem, 'id' | 'name' | 'expiryDate'>;

/** Pure — also used by NotificationPreviewCard so the preview can never drift from what actually schedules. */
export function buildFeedExpiryReminderDate(expiryDate: string): Date {
  const reminderDate = parseLocalDateString(expiryDate, 9, 0);
  reminderDate.setDate(reminderDate.getDate() - FEED_EXPIRY_WARNING_DAYS);
  return reminderDate;
}

export async function scheduleFeedExpiryReminder(item: SchedulableFeedExpiry): Promise<string | null> {
  if (!item.expiryDate) {
    return null;
  }
  const reminderDate = buildFeedExpiryReminderDate(item.expiryDate);
  if (reminderDate.getTime() <= Date.now()) {
    return null;
  }
  const granted = await ensureNotificationPermission();
  if (!granted) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    identifier: `feed-expiry-${item.id}`,
    content: {
      title: `${item.name} is expiring soon`,
      body: `This feed expires on ${item.expiryDate}.`,
      categoryIdentifier: NOTIFICATION_CATEGORIES.feed,
      data: { type: 'feedItem' satisfies NotificationDataType, category: 'Feed Alert', feedItemId: item.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
    },
  });
}

export async function syncFeedExpiryReminder(
  item: SchedulableFeedExpiry,
  previousNotificationId: string | null
): Promise<string | null> {
  await cancelNotification(previousNotificationId);
  return scheduleFeedExpiryReminder(item);
}

export async function notifyLowStock(item: Pick<FeedItem, 'id' | 'name' | 'quantity' | 'unit'>): Promise<void> {
  const granted = await ensureNotificationPermission();
  if (!granted) {
    return;
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${item.name} is running low`,
      body: `Only ${item.quantity} ${item.unit} left in stock.`,
      categoryIdentifier: NOTIFICATION_CATEGORIES.feed,
      data: { type: 'feedItem' satisfies NotificationDataType, category: 'Feed Alert', feedItemId: item.id },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1, repeats: false },
  });
}

export async function notifyOutOfStock(item: Pick<FeedItem, 'id' | 'name'>): Promise<void> {
  const granted = await ensureNotificationPermission();
  if (!granted) {
    return;
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${item.name} is out of stock`,
      body: 'Restock soon to keep your flock fed.',
      categoryIdentifier: NOTIFICATION_CATEGORIES.feed,
      data: { type: 'feedItem' satisfies NotificationDataType, category: 'Feed Alert', feedItemId: item.id },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1, repeats: false },
  });
}

type SchedulableClutchCandling = Pick<Clutch, 'id' | 'clutchName' | 'incubationStartDate'> & {
  incubationPeriodDays: number;
};

/** Pure — also used by NotificationPreviewCard. */
export function buildCandlingReminderDate(incubationStartDate: string, incubationPeriodDays: number): Date {
  const reminderDate = parseLocalDateString(incubationStartDate, 9, 0);
  reminderDate.setDate(reminderDate.getDate() + Math.floor(incubationPeriodDays / 2));
  return reminderDate;
}

export async function scheduleCandlingReminder(clutch: SchedulableClutchCandling): Promise<string | null> {
  if (!clutch.incubationStartDate) {
    return null;
  }
  const reminderDate = buildCandlingReminderDate(clutch.incubationStartDate, clutch.incubationPeriodDays);
  if (reminderDate.getTime() <= Date.now()) {
    return null;
  }
  const granted = await ensureNotificationPermission();
  if (!granted) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    identifier: `clutch-candling-${clutch.id}`,
    content: {
      title: `Time to candle ${clutch.clutchName || 'your clutch'}`,
      body: 'Check egg development partway through incubation.',
      categoryIdentifier: NOTIFICATION_CATEGORIES.breeding,
      data: {
        type: 'clutch' satisfies NotificationDataType,
        category: 'Breeding Reminder',
        clutchId: clutch.id,
        reminderType: 'candling',
      },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderDate },
  });
}

export async function syncCandlingReminder(
  clutch: SchedulableClutchCandling,
  previousNotificationId: string | null
): Promise<string | null> {
  await cancelNotification(previousNotificationId);
  return scheduleCandlingReminder(clutch);
}

const HATCH_EXPECTED_WARNING_DAYS = 2;

type SchedulableClutchHatch = Pick<Clutch, 'id' | 'clutchName' | 'expectedHatchDate'>;

/** Pure — also used by NotificationPreviewCard. */
export function buildHatchExpectedReminderDate(expectedHatchDate: string): Date {
  const reminderDate = parseLocalDateString(expectedHatchDate, 9, 0);
  reminderDate.setDate(reminderDate.getDate() - HATCH_EXPECTED_WARNING_DAYS);
  return reminderDate;
}

export async function scheduleHatchExpectedReminder(clutch: SchedulableClutchHatch): Promise<string | null> {
  if (!clutch.expectedHatchDate) {
    return null;
  }
  const reminderDate = buildHatchExpectedReminderDate(clutch.expectedHatchDate);
  if (reminderDate.getTime() <= Date.now()) {
    return null;
  }
  const granted = await ensureNotificationPermission();
  if (!granted) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    identifier: `clutch-hatch-expected-${clutch.id}`,
    content: {
      title: `${clutch.clutchName || 'Your clutch'} is hatching soon`,
      body: `Expected hatch in ${HATCH_EXPECTED_WARNING_DAYS} days — get ready.`,
      categoryIdentifier: NOTIFICATION_CATEGORIES.breeding,
      data: {
        type: 'clutch' satisfies NotificationDataType,
        category: 'Breeding Reminder',
        clutchId: clutch.id,
        reminderType: 'hatch_expected',
      },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderDate },
  });
}

export async function syncHatchExpectedReminder(
  clutch: SchedulableClutchHatch,
  previousNotificationId: string | null
): Promise<string | null> {
  await cancelNotification(previousNotificationId);
  return scheduleHatchExpectedReminder(clutch);
}

/** Pure — also used by NotificationPreviewCard. */
export function buildHatchDueReminderDate(expectedHatchDate: string): Date {
  return parseLocalDateString(expectedHatchDate, 9, 0);
}

export async function scheduleHatchDueReminder(clutch: SchedulableClutchHatch): Promise<string | null> {
  if (!clutch.expectedHatchDate) {
    return null;
  }
  const dueDate = buildHatchDueReminderDate(clutch.expectedHatchDate);
  if (dueDate.getTime() <= Date.now()) {
    return null;
  }
  const granted = await ensureNotificationPermission();
  if (!granted) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    identifier: `clutch-hatch-due-${clutch.id}`,
    content: {
      title: `${clutch.clutchName || 'Your clutch'} hatch is due today`,
      body: 'Check your incubator or nest for new hatchlings.',
      categoryIdentifier: NOTIFICATION_CATEGORIES.breeding,
      data: {
        type: 'clutch' satisfies NotificationDataType,
        category: 'Breeding Reminder',
        clutchId: clutch.id,
        reminderType: 'hatch_due',
      },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dueDate },
  });
}

export async function syncHatchDueReminder(
  clutch: SchedulableClutchHatch,
  previousNotificationId: string | null
): Promise<string | null> {
  await cancelNotification(previousNotificationId);
  return scheduleHatchDueReminder(clutch);
}

/**
 * Fires a real, immediate notification using the exact same content a real reminder of this
 * kind would use, so "send test" exercises the identical deep-link path as production reminders.
 * Returns false (and shows no notification) if permission isn't granted, so the caller can
 * surface that to the user instead of silently doing nothing.
 */
export async function sendTestNotification(preview: {
  title: string;
  body: string;
  categoryIdentifier: string;
  data: Record<string, unknown>;
}): Promise<boolean> {
  const granted = await ensureNotificationPermission();
  if (!granted) {
    return false;
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Test: ${preview.title}`,
      body: preview.body,
      categoryIdentifier: preview.categoryIdentifier,
      data: preview.data,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2, repeats: false },
  });
  return true;
}
