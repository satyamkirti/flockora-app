import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { feedRepository } from '../db/repositories';
import { FeedLog } from '../types/feed';

export function useFeedLog(id: number | undefined) {
  const db = useSQLiteContext();
  const [log, setLog] = useState<FeedLog | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (id == null) {
      setLog(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await feedRepository.getFeedLog(db, id);
    setLog(data);
    setLoading(false);
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { log, loading, refresh };
}
