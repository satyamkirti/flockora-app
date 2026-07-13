import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { taskRepository } from '../db/repositories';
import { Task } from '../types/task';

export function useTodayTasks() {
  const db = useSQLiteContext();
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [overdue, today, upcoming] = await Promise.all([
      taskRepository.getOverdueTasks(db),
      taskRepository.getTodayTasks(db),
      taskRepository.getUpcomingTasks(db),
    ]);
    setOverdueTasks(overdue);
    setTodayTasks(today);
    setUpcomingTasks(upcoming);
    setLoading(false);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { overdueTasks, todayTasks, upcomingTasks, loading, refresh };
}
