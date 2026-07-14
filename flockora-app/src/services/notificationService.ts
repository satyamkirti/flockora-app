import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';
import { Task } from '../types/task';
import { HealthRecord } from '../types/healthRecord';
import { FeedItem } from '../types/feed';
import { Clutch } from '../types/breeding';
import { taskTypeByKey } from '../data/taskTypes';
import { healthRecordTypeByKey } from '../data/healthRecordTypes';

export async function ensureNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') {
    return true;
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
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
    content: {
      title: task.title,
      body: task.description || taskTypeByKey(task.type).label,
      data: { taskId: task.id },
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
    content: {
      title: record.title,
      body: record.notes || healthRecordTypeByKey(record.type).label,
      data: { healthRecordId: record.id },
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

function buildFeedExpiryReminderDate(expiryDate: string): Date {
  const expiry = new Date(expiryDate);
  const reminderDate = new Date(expiry);
  reminderDate.setDate(reminderDate.getDate() - FEED_EXPIRY_WARNING_DAYS);
  reminderDate.setHours(9, 0, 0, 0);
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
    content: {
      title: `${item.name} is expiring soon`,
      body: `This feed expires on ${item.expiryDate}.`,
      data: { feedItemId: item.id },
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
      data: { feedItemId: item.id },
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
      data: { feedItemId: item.id },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1, repeats: false },
  });
}

type SchedulableClutchCandling = Pick<Clutch, 'id' | 'clutchName' | 'incubationStartDate'> & {
  incubationPeriodDays: number;
};

function buildCandlingReminderDate(incubationStartDate: string, incubationPeriodDays: number): Date {
  const start = new Date(incubationStartDate);
  const reminderDate = new Date(start);
  reminderDate.setDate(reminderDate.getDate() + Math.floor(incubationPeriodDays / 2));
  reminderDate.setHours(9, 0, 0, 0);
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
    content: {
      title: `Time to candle ${clutch.clutchName || 'your clutch'}`,
      body: 'Check egg development partway through incubation.',
      data: { clutchId: clutch.id, reminderType: 'candling' },
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

export async function scheduleHatchExpectedReminder(clutch: SchedulableClutchHatch): Promise<string | null> {
  if (!clutch.expectedHatchDate) {
    return null;
  }
  const expected = new Date(clutch.expectedHatchDate);
  const reminderDate = new Date(expected);
  reminderDate.setDate(reminderDate.getDate() - HATCH_EXPECTED_WARNING_DAYS);
  reminderDate.setHours(9, 0, 0, 0);
  if (reminderDate.getTime() <= Date.now()) {
    return null;
  }
  const granted = await ensureNotificationPermission();
  if (!granted) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: `${clutch.clutchName || 'Your clutch'} is hatching soon`,
      body: `Expected hatch in ${HATCH_EXPECTED_WARNING_DAYS} days — get ready.`,
      data: { clutchId: clutch.id, reminderType: 'hatch_expected' },
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

export async function scheduleHatchDueReminder(clutch: SchedulableClutchHatch): Promise<string | null> {
  if (!clutch.expectedHatchDate) {
    return null;
  }
  const dueDate = new Date(clutch.expectedHatchDate);
  dueDate.setHours(9, 0, 0, 0);
  if (dueDate.getTime() <= Date.now()) {
    return null;
  }
  const granted = await ensureNotificationPermission();
  if (!granted) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: `${clutch.clutchName || 'Your clutch'} hatch is due today`,
      body: 'Check your incubator or nest for new hatchlings.',
      data: { clutchId: clutch.id, reminderType: 'hatch_due' },
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
