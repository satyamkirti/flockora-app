import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { breedingRepository } from '../db/repositories';
import { Clutch, ClutchFilters } from '../types/breeding';

export function useClutches(filters: ClutchFilters) {
  const db = useSQLiteContext();
  const [clutches, setClutches] = useState<Clutch[]>([]);
  const [loading, setLoading] = useState(true);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    const data = await breedingRepository.getClutchHistory(db, filters);
    // Bail if a newer refresh (e.g. the user kept changing filters) started after this one —
    // otherwise a slower, superseded query could resolve last and overwrite current data.
    if (requestId !== requestIdRef.current) return;
    setClutches(data);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, filters.species, filters.breedingPairId, filters.status, filters.date]);

  // useFocusEffect's own effect already re-runs whenever `refresh`'s identity changes (i.e. on
  // filter changes) as well as on mount/focus, since `refresh` is in its dependency chain — a
  // separate plain useEffect here duplicated every fetch this hook makes.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { clutches, loading, refresh };
}
