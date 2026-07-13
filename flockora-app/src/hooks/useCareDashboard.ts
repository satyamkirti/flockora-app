import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { taskRepository, healthRecordRepository } from '../db/repositories';
import { Task } from '../types/task';
import { HealthRecord } from '../types/healthRecord';
import { CARE_TASK_TYPES } from '../data/taskTypes';
import { isTaskOverdue, startOfDay } from '../utils/taskSchedule';

const RECENT_RECORDS_LIMIT = 5;
const UPCOMING_WINDOW_DAYS = 14;

export type CareDashboardData = {
  upcomingReminders: Task[];
  overdueReminders: Task[];
  recentRecords: HealthRecord[];
  attentionBirdIds: number[];
  attentionFlockIds: number[];
};

const emptyData: CareDashboardData = {
  upcomingReminders: [],
  overdueReminders: [],
  recentRecords: [],
  attentionBirdIds: [],
  attentionFlockIds: [],
};

export function useCareDashboard() {
  const db = useSQLiteContext();
  const [data, setData] = useState<CareDashboardData>(emptyData);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [tasks, records] = await Promise.all([taskRepository.list(db), healthRecordRepository.list(db)]);
    const now = new Date();
    const windowEnd = new Date(now.getTime() + UPCOMING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const careTasks = tasks.filter((task) => CARE_TASK_TYPES.includes(task.type) && !task.completed);

    const overdueReminders = careTasks.filter((task) => isTaskOverdue(task, now));

    const upcomingReminders = careTasks
      .filter((task) => !isTaskOverdue(task, now))
      .filter((task) => {
        if (task.repeatType !== 'none') return true;
        const due = new Date(task.dueDate);
        return due >= now && due <= windowEnd;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const recentRecords = records.slice(0, RECENT_RECORDS_LIMIT);

    const overdueHealthAlerts = records.filter(
      (record) =>
        record.status === 'active' && record.reminderDate != null && new Date(record.reminderDate) < startOfDay(now)
    );

    const attentionBirdIds = Array.from(
      new Set(
        [...overdueReminders, ...overdueHealthAlerts]
          .map((item) => item.birdId)
          .filter((id): id is number => id != null)
      )
    );
    const attentionFlockIds = Array.from(
      new Set(
        [...overdueReminders, ...overdueHealthAlerts]
          .map((item) => item.flockId)
          .filter((id): id is number => id != null)
      )
    );

    setData({ upcomingReminders, overdueReminders, recentRecords, attentionBirdIds, attentionFlockIds });
    setLoading(false);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { data, loading, refresh };
}
