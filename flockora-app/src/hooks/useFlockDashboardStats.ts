import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { birdRepository, flockRepository, healthRecordRepository } from '../db/repositories';
import { computeFlockSummary, FlockSummary } from '../utils/flockSummary';

const emptySummary: FlockSummary = {
  totalBirds: 0,
  speciesCount: 0,
  groupCount: 0,
  maleCount: 0,
  femaleCount: 0,
  unknownCount: 0,
  careAlertCount: 0,
};

export function useFlockDashboardStats() {
  const db = useSQLiteContext();
  const [summary, setSummary] = useState<FlockSummary>(emptySummary);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [birds, groupCount, healthStats] = await Promise.all([
      birdRepository.list(db),
      flockRepository.count(db),
      healthRecordRepository.getDashboardStats(db),
    ]);
    setSummary(computeFlockSummary(birds, groupCount, healthStats.healthAlerts + healthStats.vaccinationsDue));
    setLoading(false);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { summary, loading, refresh };
}
