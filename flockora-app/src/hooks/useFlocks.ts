import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { flockRepository } from '../db/repositories';
import { FlockWithCount } from '../types/flock';

export function useFlocks() {
  const db = useSQLiteContext();
  const [flocks, setFlocks] = useState<FlockWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await flockRepository.listWithCounts(db);
    setFlocks(data);
    setLoading(false);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { flocks, loading, refresh };
}
