import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { eggRecordRepository } from '../db/repositories';
import { EggDashboardSummary } from '../types/eggRecord';

const emptySummary: EggDashboardSummary = {
  todayTotal: 0,
  weekTotal: 0,
  monthTotal: 0,
  averagePerDay: 0,
  bestDay: null,
};

export function useEggDashboard() {
  const db = useSQLiteContext();
  const [summary, setSummary] = useState<EggDashboardSummary>(emptySummary);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await eggRecordRepository.getDashboardSummary(db);
    setSummary(data);
    setLoading(false);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { summary, loading, refresh };
}
