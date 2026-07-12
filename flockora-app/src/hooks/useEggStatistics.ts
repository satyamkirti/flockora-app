import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { eggRecordRepository } from '../db/repositories';
import { EggStatistics } from '../types/eggRecord';

const emptyStatistics: EggStatistics = {
  totalEggs: 0,
  fertilePercent: 0,
  crackedPercent: 0,
  dirtyPercent: 0,
  doubleYolkPercent: 0,
  bestDay: null,
};

export function useEggStatistics() {
  const db = useSQLiteContext();
  const [statistics, setStatistics] = useState<EggStatistics>(emptyStatistics);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await eggRecordRepository.getEggStatistics(db);
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
