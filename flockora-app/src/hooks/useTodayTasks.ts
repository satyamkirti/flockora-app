import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { taskRepository } from '../db/repositories';
import { Task } from '../types/task';

export function useTodayTasks() {
  const db = useSQLiteContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await taskRepository.getTodayTasks(db);
    setTasks(data);
    setLoading(false);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { tasks, loading, refresh };
}
