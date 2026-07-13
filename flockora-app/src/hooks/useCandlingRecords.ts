import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { breedingRepository } from '../db/repositories';
import { CandlingRecord } from '../types/breeding';

export function useCandlingRecords(clutchId: number | undefined) {
  const db = useSQLiteContext();
  const [records, setRecords] = useState<CandlingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (clutchId == null) {
      setRecords([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await breedingRepository.listCandlingRecords(db, clutchId);
    setRecords(data);
    setLoading(false);
  }, [db, clutchId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { records, loading, refresh };
}
