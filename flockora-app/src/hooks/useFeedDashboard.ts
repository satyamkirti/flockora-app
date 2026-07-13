import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { feedRepository } from '../db/repositories';
import { FeedDashboardSummary } from '../types/feed';

const emptySummary: FeedDashboardSummary = {
  lowStockCount: 0,
  outOfStockCount: 0,
  usedTodayByUnit: [],
  expiringSoonCount: 0,
};

export function useFeedDashboard() {
  const db = useSQLiteContext();
  const [summary, setSummary] = useState<FeedDashboardSummary>(emptySummary);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await feedRepository.getDashboardSummary(db);
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
