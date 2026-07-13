import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { breedingRepository } from '../db/repositories';
import { Clutch } from '../types/breeding';

export function useClutch(id: number | undefined) {
  const db = useSQLiteContext();
  const [clutch, setClutch] = useState<Clutch | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (id == null) {
      setClutch(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await breedingRepository.getClutch(db, id);
    setClutch(data);
    setLoading(false);
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { clutch, loading, refresh };
}
