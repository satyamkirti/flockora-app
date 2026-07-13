import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { breedingRepository } from '../db/repositories';
import { Clutch, ClutchFilters } from '../types/breeding';

export function useClutches(filters: ClutchFilters) {
  const db = useSQLiteContext();
  const [clutches, setClutches] = useState<Clutch[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await breedingRepository.getClutchHistory(db, filters);
    setClutches(data);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, filters.species, filters.breedingPairId, filters.status, filters.date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { clutches, loading, refresh };
}
