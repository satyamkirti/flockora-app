import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { healthRecordRepository } from '../db/repositories';
import { HealthRecord } from '../types/healthRecord';

export function useHealthRecord(id: number | undefined) {
  const db = useSQLiteContext();
  const [record, setRecord] = useState<HealthRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (id == null) {
      setRecord(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await healthRecordRepository.getById(db, id);
    setRecord(data);
    setLoading(false);
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { record, loading, refresh };
}
