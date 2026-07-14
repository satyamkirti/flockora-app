import { SQLiteDatabase } from 'expo-sqlite';
import { Task } from '../types/task';
import { taskRepository } from '../db/repositories';
import { cancelNotification, scheduleTaskNotification } from '../services/notificationService';
import { isTaskCompletedToday } from './taskSchedule';

/**
 * Completing/reopening a one-off task previously never touched its notification — a task marked
 * complete early still buzzed the user at the original due time. Consolidates the logic that was
 * duplicated across TodayScreen and TaskDetailScreen so both call one, correct implementation.
 */
export async function toggleTaskCompletion(db: SQLiteDatabase, task: Task): Promise<void> {
  if (isTaskCompletedToday(task)) {
    await taskRepository.reopenTask(db, task.id);
    const shouldReschedule = task.repeatType === 'none' && task.notificationEnabled && new Date(task.dueDate) > new Date();
    if (shouldReschedule) {
      const notificationId = await scheduleTaskNotification(task);
      await taskRepository.setNotificationId(db, task.id, notificationId);
    }
    return;
  }

  await taskRepository.completeTask(db, task.id);
  if (task.repeatType === 'none' && task.notificationId) {
    await cancelNotification(task.notificationId);
    await taskRepository.setNotificationId(db, task.id, null);
  }
}
