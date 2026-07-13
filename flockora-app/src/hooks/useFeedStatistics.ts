import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { feedRepository } from '../db/repositories';
import { FeedStatistics } from '../types/feed';

const emptyStatistics: FeedStatistics = {
  usedToday: [],
  usedThisWeek: [],
  usedThisMonth: [],
  currentStockByUnit: [],
  estimatedCost: 0,
  averageDailyUsage: [],
};

export function useFeedStatistics() {
  const db = useSQLiteContext();
  const [statistics, setStatistics] = useState<FeedStatistics>(emptyStatistics);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await feedRepository.getFeedStatistics(db);
    setStatistics(data);
    setLoading(false);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { statistics, loading, refresh };
}
