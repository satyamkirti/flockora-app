import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { breedingRepository } from '../db/repositories';
import { HatchRecord } from '../types/breeding';

export function useHatchRecordById(id: number | undefined) {
  const db = useSQLiteContext();
  const [record, setRecord] = useState<HatchRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (id == null) {
      setRecord(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await breedingRepository.getHatchRecord(db, id);
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
