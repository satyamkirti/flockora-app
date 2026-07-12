import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { taskRepository } from '../db/repositories';
import { Task } from '../types/task';

export function useTask(id: number | undefined) {
  const db = useSQLiteContext();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (id == null) {
      setTask(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await taskRepository.getById(db, id);
    setTask(data);
    setLoading(false);
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { task, loading, refresh };
}
