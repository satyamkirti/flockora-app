import * as Notifications from 'expo-notifications';
import { Task } from '../types/task';
import { taskTypeByKey } from '../data/taskTypes';

export async function ensureNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') {
    return true;
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

function buildTrigger(
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

export async function cancelTaskNotification(notificationId: string | null): Promise<void> {
  if (!notificationId) {
    return;
  }
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    // Notification may already be gone; nothing further to do.
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
    trigger: buildTrigger(task),
  });
}

export async function syncTaskNotification(
  task: SchedulableTask & { notificationEnabled: boolean },
  previousNotificationId: string | null
): Promise<string | null> {
  await cancelTaskNotification(previousNotificationId);
  if (!task.notificationEnabled) {
    return null;
  }
  return scheduleTaskNotification(task);
}
