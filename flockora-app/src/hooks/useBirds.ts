import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { birdRepository } from '../db/repositories';
import { Bird } from '../types/bird';

export function useBirds(flockId: number | null = null) {
  const db = useSQLiteContext();
  const [birds, setBirds] = useState<Bird[]>([]);
  const [loading, setLoading] = useState(true);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    const data = flockId != null ? await birdRepository.listByFlock(db, flockId) : await birdRepository.list(db);
    // Bail if a newer refresh (e.g. the user switched flocks again) started after this one —
    // otherwise a slower, superseded query could resolve last and overwrite current data.
    if (requestId !== requestIdRef.current) return;
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
