import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { birdRepository } from '../db/repositories';
import { Bird } from '../types/bird';

export function useBird(id: number | undefined) {
  const db = useSQLiteContext();
  const [bird, setBird] = useState<Bird | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (id == null) {
      setBird(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await birdRepository.getById(db, id);
    setBird(data);
    setLoading(false);
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { bird, loading, refresh };
}
