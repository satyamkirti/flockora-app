import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { birdRepository } from '../db/repositories';
import { Bird } from '../types/bird';

export function useBirds(flockId: number | null = null) {
  const db = useSQLiteContext();
  const [birds, setBirds] = useState<Bird[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = flockId != null ? await birdRepository.listByFlock(db, flockId) : await birdRepository.list(db);
    setBirds(data);
    setLoading(false);
  }, [db, flockId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { birds, loading, refresh };
}
