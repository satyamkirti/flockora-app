import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { eggRecordRepository } from '../db/repositories';
import { EggRecord, EggRecordFilters } from '../types/eggRecord';

export function useEggHistory(filters: EggRecordFilters) {
  const db = useSQLiteContext();
  const [records, setRecords] = useState<EggRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await eggRecordRepository.getEggHistory(db, filters);
    setRecords(data);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, filters.searchText, filters.flockId, filters.date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { records, loading, refresh };
}
