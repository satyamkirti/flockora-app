import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { feedRepository } from '../db/repositories';
import { FeedLog, FeedLogFilters } from '../types/feed';

export function useFeedHistory(filters: FeedLogFilters) {
  const db = useSQLiteContext();
  const [logs, setLogs] = useState<FeedLog[]>([]);
  const [loading, setLoading] = useState(true);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    const data = await feedRepository.getFeedHistory(db, filters);
    // Bail if a newer refresh (e.g. the user kept typing in the search box) started after this
    // one — otherwise a slower, superseded query could resolve last and overwrite current data.
    if (requestId !== requestIdRef.current) return;
    setLogs(data);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, filters.feedItemId, filters.flockId, filters.birdId, filters.date]);

  // useFocusEffect's own effect already re-runs whenever `refresh`'s identity changes (i.e. on
  // filter changes) as well as on mount/focus, since `refresh` is in its dependency chain — a
  // separate plain useEffect here duplicated every fetch this hook makes.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { logs, loading, refresh };
}
