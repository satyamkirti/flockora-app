import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { healthRecordRepository } from '../db/repositories';
import { HealthRecord } from '../types/healthRecord';

export function useBirdHealthHistory(birdId: number | undefined) {
  const db = useSQLiteContext();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (birdId == null) {
      setRecords([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await healthRecordRepository.getBirdHealthHistory(db, birdId);
    setRecords(data);
    setLoading(false);
  }, [db, birdId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { records, loading, refresh };
}
