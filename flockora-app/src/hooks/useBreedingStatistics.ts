import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { breedingRepository } from '../db/repositories';
import { BreedingStatistics } from '../types/breeding';

const emptyStatistics: BreedingStatistics = {
  totalClutches: 0,
  totalEggsIncubated: 0,
  fertilityRatePercent: 0,
  hatchRatePercent: 0,
  hatchabilityOfFertilePercent: 0,
  successfulHatches: 0,
};

export function useBreedingStatistics() {
  const db = useSQLiteContext();
  const [statistics, setStatistics] = useState<BreedingStatistics>(emptyStatistics);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await breedingRepository.getBreedingStatistics(db);
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
