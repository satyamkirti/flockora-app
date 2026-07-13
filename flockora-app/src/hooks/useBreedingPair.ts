import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { breedingRepository } from '../db/repositories';
import { BreedingPair } from '../types/breeding';

export function useBreedingPair(id: number | undefined) {
  const db = useSQLiteContext();
  const [pair, setPair] = useState<BreedingPair | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (id == null) {
      setPair(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await breedingRepository.getBreedingPair(db, id);
    setPair(data);
    setLoading(false);
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { pair, loading, refresh };
}
