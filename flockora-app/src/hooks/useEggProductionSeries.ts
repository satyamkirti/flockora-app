import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { eggRecordRepository } from '../db/repositories';
import { EggMonthlyPoint, EggProductionPoint } from '../types/eggRecord';

export function useEggProductionSeries(days: number) {
  const db = useSQLiteContext();
  const [points, setPoints] = useState<EggProductionPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await eggRecordRepository.getProductionSeries(db, days);
    setPoints(data);
    setLoading(false);
  }, [db, days]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { points, loading, refresh };
}

export function useEggMonthlyTrend(months: number) {
  const db = useSQLiteContext();
  const [points, setPoints] = useState<EggMonthlyPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await eggRecordRepository.getMonthlyTrend(db, months);
    setPoints(data);
    setLoading(false);
  }, [db, months]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { points, loading, refresh };
}
