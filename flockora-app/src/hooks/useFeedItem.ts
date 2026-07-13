import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { feedRepository } from '../db/repositories';
import { FeedItem } from '../types/feed';

export function useFeedItem(id: number | undefined) {
  const db = useSQLiteContext();
  const [item, setItem] = useState<FeedItem | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (id == null) {
      setItem(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await feedRepository.getFeedItem(db, id);
    setItem(data);
    setLoading(false);
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { item, loading, refresh };
}
