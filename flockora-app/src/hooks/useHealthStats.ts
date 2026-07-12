import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { healthRecordRepository } from '../db/repositories';
import { BirdHealthStats } from '../types/healthRecord';

const emptyStats: BirdHealthStats = {
  treatmentCount: 0,
  vaccinationsCompleted: 0,
  totalExpenses: 0,
  activeMedicineCount: 0,
};

export function useHealthStats(birdId: number | undefined) {
  const db = useSQLiteContext();
  const [stats, setStats] = useState<BirdHealthStats>(emptyStats);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (birdId == null) {
      setStats(emptyStats);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await healthRecordRepository.getStatsForBird(db, birdId);
    setStats(data);
    setLoading(false);
  }, [db, birdId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { stats, loading, refresh };
}
