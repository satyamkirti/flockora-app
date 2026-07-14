import { SQLiteDatabase } from 'expo-sqlite';
import { RepeatType, Task, TaskInput, TaskStats, TaskType } from '../../types/task';
import { isTaskCompletedToday, isTaskDueToday, isTaskOverdue } from '../../utils/taskSchedule';

type TaskRow = {
  id: number;
  birdId: number | null;
  flockId: number | null;
  type: string;
  title: string;
  description: string | null;
  dueDate: string;
  repeatType: string;
  completed: number;
  completedAt: string | null;
  notificationEnabled: number;
  notificationId: string | null;
  createdAt: string;
  updatedAt: string;
};

const mapRow = (row: TaskRow): Task => ({
  ...row,
  type: row.type as TaskType,
  repeatType: row.repeatType as RepeatType,
  completed: row.completed === 1,
  notificationEnabled: row.notificationEnabled === 1,
});

async function getById(db: SQLiteDatabase, id: number): Promise<Task | null> {
  const row = await db.getFirstAsync<TaskRow>('SELECT * FROM tasks WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export const taskRepository = {
  async list(db: SQLiteDatabase): Promise<Task[]> {
    const rows = await db.getAllAsync<TaskRow>('SELECT * FROM tasks ORDER BY dueDate ASC');
    return rows.map(mapRow);
  },

  getById,

  async createTask(db: SQLiteDatabase, input: TaskInput): Promise<Task> {
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO tasks
        (birdId, flockId, type, title, description, dueDate, repeatType, completed, completedAt, notificationEnabled, notificationId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL, ?, NULL, ?, ?)`,
      [
        input.birdId,
        input.flockId,
        input.type,
        input.title,
        input.description,
        input.dueDate,
        input.repeatType,
        input.notificationEnabled ? 1 : 0,
        now,
        now,
      ]
    );
    const created = await getById(db, result.lastInsertRowId);
    if (!created) {
      throw new Error('Task not found after create');
    }
    return created;
  },

  async updateTask(db: SQLiteDatabase, id: number, input: TaskInput): Promise<Task> {
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE tasks SET
        birdId = ?, flockId = ?, type = ?, title = ?, description = ?, dueDate = ?, repeatType = ?,
        notificationEnabled = ?, updatedAt = ?
       WHERE id = ?`,
      [
        input.birdId,
        input.flockId,
        input.type,
        input.title,
        input.description,
        input.dueDate,
        input.repeatType,
        input.notificationEnabled ? 1 : 0,
        now,
        id,
      ]
    );
    const updated = await getById(db, id);
    if (!updated) {
      throw new Error('Task not found after update');
    }
    return updated;
  },

  async deleteTask(db: SQLiteDatabase, id: number): Promise<void> {
    await db.runAsync('DELETE FROM tasks WHERE id = ?', [id]);
  },

  /** Notification ids for a bird's tasks — used to cancel them before a hard bird delete, since
   * `tasks.birdId` is `ON DELETE CASCADE` and would otherwise orphan their OS notifications. */
  async getNotificationIdsByBird(db: SQLiteDatabase, birdId: number): Promise<string[]> {
    const rows = await db.getAllAsync<{ notificationId: string }>(
      'SELECT notificationId FROM tasks WHERE birdId = ? AND notificationId IS NOT NULL',
      [birdId]
    );
    return rows.map((row) => row.notificationId);
  },

  async completeTask(db: SQLiteDatabase, id: number): Promise<Task> {
    const now = new Date().toISOString();
    await db.runAsync('UPDATE tasks SET completed = 1, completedAt = ?, updatedAt = ? WHERE id = ?', [
      now,
      now,
      id,
    ]);
    const updated = await getById(db, id);
    if (!updated) {
      throw new Error('Task not found after complete');
    }
    return updated;
  },

  async reopenTask(db: SQLiteDatabase, id: number): Promise<Task> {
    const now = new Date().toISOString();
    await db.runAsync('UPDATE tasks SET completed = 0, completedAt = NULL, updatedAt = ? WHERE id = ?', [
      now,
      id,
    ]);
    const updated = await getById(db, id);
    if (!updated) {
      throw new Error('Task not found after reopen');
    }
    return updated;
  },

  async setNotificationId(db: SQLiteDatabase, id: number, notificationId: string | null): Promise<void> {
    await db.runAsync('UPDATE tasks SET notificationId = ? WHERE id = ?', [notificationId, id]);
  },

  async getTodayTasks(db: SQLiteDatabase): Promise<Task[]> {
    const rows = await db.getAllAsync<TaskRow>('SELECT * FROM tasks ORDER BY dueDate ASC');
    const tasks = rows.map(mapRow);
    const today = new Date();
    return tasks.filter((task) => isTaskDueToday(task, today));
  },

  async getOverdueTasks(db: SQLiteDatabase): Promise<Task[]> {
    const rows = await db.getAllAsync<TaskRow>(
      "SELECT * FROM tasks WHERE repeatType = 'none' AND completed = 0 ORDER BY dueDate ASC"
    );
    const tasks = rows.map(mapRow);
    const today = new Date();
    return tasks.filter((task) => isTaskOverdue(task, today));
  },

  async getUpcomingTasks(db: SQLiteDatabase, days = 14): Promise<Task[]> {
    const rows = await db.getAllAsync<TaskRow>(
      "SELECT * FROM tasks WHERE repeatType = 'none' AND completed = 0 ORDER BY dueDate ASC"
    );
    const tasks = rows.map(mapRow);
    const now = new Date();
    const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return tasks.filter((task) => {
      const due = new Date(task.dueDate);
      return due > now && due <= end;
    });
  },

  async getStats(db: SQLiteDatabase): Promise<TaskStats> {
    const rows = await db.getAllAsync<TaskRow>('SELECT * FROM tasks');
    const tasks = rows.map(mapRow);
    const today = new Date();

    const todays = tasks.filter((task) => isTaskDueToday(task, today));
    const completedToday = todays.filter((task) => isTaskCompletedToday(task, today));
    const overdue = tasks.filter((task) => isTaskOverdue(task, today));

    return {
      todayTotal: todays.length,
      completedToday: completedToday.length,
      pendingToday: todays.length - completedToday.length,
      overdueCount: overdue.length,
    };
  },
};
