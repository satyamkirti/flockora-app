import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { feedRepository } from '../db/repositories';
import { FeedItem } from '../types/feed';

export function useFeedItems() {
  const db = useSQLiteContext();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await feedRepository.getFeedItems(db);
    setItems(data);
    setLoading(false);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { items, loading, refresh };
}
