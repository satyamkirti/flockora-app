import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { breedingRepository } from '../db/repositories';
import { BreedingPair } from '../types/breeding';

export function useBreedingPairs() {
  const db = useSQLiteContext();
  const [pairs, setPairs] = useState<BreedingPair[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await breedingRepository.listBreedingPairs(db);
    setPairs(data);
    setLoading(false);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { pairs, loading, refresh };
}
