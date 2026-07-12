import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { taskRepository } from '../db/repositories';
import { TaskStats } from '../types/task';

const emptyStats: TaskStats = {
  todayTotal: 0,
  completedToday: 0,
  pendingToday: 0,
  overdueCount: 0,
};

export function useTaskStats() {
  const db = useSQLiteContext();
  const [stats, setStats] = useState<TaskStats>(emptyStats);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await taskRepository.getStats(db);
    setStats(data);
    setLoading(false);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { stats, loading, refresh };
}
