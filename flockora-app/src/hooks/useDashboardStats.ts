import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { birdRepository, flockRepository } from '../db/repositories';

export type DashboardStats = {
  totalBirds: number;
  activeBirds: number;
  totalFlocks: number;
  recentlyAddedCount: number;
  latestBirdName: string | null;
};

const emptyStats: DashboardStats = {
  totalBirds: 0,
  activeBirds: 0,
  totalFlocks: 0,
  recentlyAddedCount: 0,
  latestBirdName: null,
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function useDashboardStats() {
  const db = useSQLiteContext();
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const sinceIso = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();
    const [totalBirds, activeBirds, totalFlocks, recentlyAddedCount, recentBirds] = await Promise.all([
      birdRepository.countAll(db),
      birdRepository.countActive(db),
      flockRepository.count(db),
      birdRepository.countCreatedSince(db, sinceIso),
      birdRepository.mostRecent(db, 1),
    ]);
    setStats({
      totalBirds,
      activeBirds,
      totalFlocks,
      recentlyAddedCount,
      latestBirdName: recentBirds[0]?.name ?? null,
    });
    setLoading(false);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { stats, loading, refresh };
}
