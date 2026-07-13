import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { feedRepository } from '../db/repositories';
import { FeedLog, FeedLogFilters } from '../types/feed';

export function useFeedHistory(filters: FeedLogFilters) {
  const db = useSQLiteContext();
  const [logs, setLogs] = useState<FeedLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await feedRepository.getFeedHistory(db, filters);
    setLogs(data);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, filters.feedItemId, filters.flockId, filters.birdId, filters.date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { logs, loading, refresh };
}
