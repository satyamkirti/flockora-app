import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { healthRecordRepository } from '../db/repositories';
import { HealthRecord, HealthRecordFilters } from '../types/healthRecord';

export function useHealthRecords(filters: HealthRecordFilters) {
  const db = useSQLiteContext();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    const data = await healthRecordRepository.search(db, filters);
    // Bail if a newer refresh (e.g. the user kept typing in the search box) started after this
    // one — otherwise a slower, superseded query could resolve last and overwrite current data.
    if (requestId !== requestIdRef.current) return;
    setRecords(data);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, filters.searchText, filters.birdId, filters.type, filters.status, filters.date]);

  // useFocusEffect's own effect already re-runs whenever `refresh`'s identity changes (i.e. on
  // filter changes) as well as on mount/focus, since `refresh` is in its dependency chain — a
  // separate plain useEffect here duplicated every fetch this hook makes.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { records, loading, refresh };
}
