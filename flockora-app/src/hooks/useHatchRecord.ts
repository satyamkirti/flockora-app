import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { breedingRepository } from '../db/repositories';
import { HatchRecord } from '../types/breeding';

export function useHatchRecord(clutchId: number | undefined) {
  const db = useSQLiteContext();
  const [record, setRecord] = useState<HatchRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (clutchId == null) {
      setRecord(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await breedingRepository.getHatchRecordForClutch(db, clutchId);
    setRecord(data);
    setLoading(false);
  }, [db, clutchId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { record, loading, refresh };
}
