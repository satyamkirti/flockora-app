import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { eggRecordRepository } from '../db/repositories';
import { EggRecord } from '../types/eggRecord';

export function useEggRecord(id: number | undefined) {
  const db = useSQLiteContext();
  const [record, setRecord] = useState<EggRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (id == null) {
      setRecord(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await eggRecordRepository.getById(db, id);
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
