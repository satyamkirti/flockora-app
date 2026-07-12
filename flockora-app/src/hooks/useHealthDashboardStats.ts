import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { healthRecordRepository } from '../db/repositories';
import { HealthDashboardStats } from '../types/healthRecord';

const emptyStats: HealthDashboardStats = {
  activeTreatments: 0,
  vaccinationsDue: 0,
  healthAlerts: 0,
  recentRecordsCount: 0,
};

export function useHealthDashboardStats() {
  const db = useSQLiteContext();
  const [stats, setStats] = useState<HealthDashboardStats>(emptyStats);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await healthRecordRepository.getDashboardStats(db);
    setStats(data);
    setLoading(false);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { stats, loading, refresh };
}
