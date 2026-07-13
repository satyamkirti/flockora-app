import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { breedingRepository } from '../db/repositories';
import { BreedingHubSummary } from '../types/breeding';

const emptySummary: BreedingHubSummary = {
  activePairs: 0,
  activeClutches: 0,
  eggsIncubating: 0,
  hatchesDueSoon: 0,
  overdueHatches: 0,
  recentHatchCount: 0,
};

export function useBreedingDashboard() {
  const db = useSQLiteContext();
  const [summary, setSummary] = useState<BreedingHubSummary>(emptySummary);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await breedingRepository.getBreedingDashboardSummary(db);
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
