import { SQLiteDatabase } from 'expo-sqlite';
import {
  EggDashboardSummary,
  EggMonthlyPoint,
  EggProductionPoint,
  EggRecord,
  EggRecordFilters,
  EggRecordInput,
  EggStatistics,
} from '../../types/eggRecord';
import { startOfDay, toDateInputValue } from '../../utils/taskSchedule';

type EggRecordRow = {
  id: number;
  flockId: number | null;
  birdId: number | null;
  date: string;
  totalEggs: number;
  fertileEggs: number;
  crackedEggs: number;
  dirtyEggs: number;
  doubleYolkEggs: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

const mapRow = (row: EggRecordRow): EggRecord => ({ ...row });

async function getById(db: SQLiteDatabase, id: number): Promise<EggRecord | null> {
  const row = await db.getFirstAsync<EggRecordRow>('SELECT * FROM egg_records WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

async function listAll(db: SQLiteDatabase): Promise<EggRecord[]> {
  const rows = await db.getAllAsync<EggRecordRow>('SELECT * FROM egg_records ORDER BY date DESC, createdAt DESC');
  return rows.map(mapRow);
}

async function getDailyProduction(db: SQLiteDatabase, date: string = toDateInputValue(new Date())): Promise<number> {
  const row = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(totalEggs) as total FROM egg_records WHERE date = ?',
    [date]
  );
  return row?.total ?? 0;
}

async function getWeeklyProduction(db: SQLiteDatabase, referenceDate: Date = new Date()): Promise<number> {
  const start = new Date(referenceDate);
  start.setDate(start.getDate() - 6);
  const row = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(totalEggs) as total FROM egg_records WHERE date >= ? AND date <= ?',
    [toDateInputValue(start), toDateInputValue(referenceDate)]
  );
  return row?.total ?? 0;
}

async function getMonthlyProduction(db: SQLiteDatabase, referenceDate: Date = new Date()): Promise<number> {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const row = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(totalEggs) as total FROM egg_records WHERE date >= ? AND date <= ?',
    [toDateInputValue(start), toDateInputValue(referenceDate)]
  );
  return row?.total ?? 0;
}

async function getEggStatistics(db: SQLiteDatabase): Promise<EggStatistics> {
  const records = await listAll(db);

  const totalEggs = records.reduce((sum, record) => sum + record.totalEggs, 0);
  const fertileTotal = records.reduce((sum, record) => sum + record.fertileEggs, 0);
  const crackedTotal = records.reduce((sum, record) => sum + record.crackedEggs, 0);
  const dirtyTotal = records.reduce((sum, record) => sum + record.dirtyEggs, 0);
  const doubleYolkTotal = records.reduce((sum, record) => sum + record.doubleYolkEggs, 0);

  const byDate = new Map<string, number>();
  records.forEach((record) => {
    byDate.set(record.date, (byDate.get(record.date) ?? 0) + record.totalEggs);
  });

  let bestDay: { date: string; total: number } | null = null;
  byDate.forEach((total, date) => {
    if (!bestDay || total > bestDay.total) {
      bestDay = { date, total };
    }
  });

  const percent = (value: number) => (totalEggs === 0 ? 0 : (value / totalEggs) * 100);

  return {
    totalEggs,
    fertilePercent: percent(fertileTotal),
    crackedPercent: percent(crackedTotal),
    dirtyPercent: percent(dirtyTotal),
    doubleYolkPercent: percent(doubleYolkTotal),
    bestDay,
  };
}

export const eggRecordRepository = {
  list: listAll,

  getById,

  async addEggRecord(db: SQLiteDatabase, input: EggRecordInput): Promise<EggRecord> {
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO egg_records
        (flockId, birdId, date, totalEggs, fertileEggs, crackedEggs, dirtyEggs, doubleYolkEggs, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.flockId,
        input.birdId,
        input.date,
        input.totalEggs,
        input.fertileEggs,
        input.crackedEggs,
        input.dirtyEggs,
        input.doubleYolkEggs,
        input.notes,
        now,
        now,
      ]
    );
    const created = await getById(db, result.lastInsertRowId);
    if (!created) {
      throw new Error('Egg record not found after create');
    }
    return created;
  },

  async updateEggRecord(db: SQLiteDatabase, id: number, input: EggRecordInput): Promise<EggRecord> {
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE egg_records SET
        flockId = ?, birdId = ?, date = ?, totalEggs = ?, fertileEggs = ?, crackedEggs = ?,
        dirtyEggs = ?, doubleYolkEggs = ?, notes = ?, updatedAt = ?
       WHERE id = ?`,
      [
        input.flockId,
        input.birdId,
        input.date,
        input.totalEggs,
        input.fertileEggs,
        input.crackedEggs,
        input.dirtyEggs,
        input.doubleYolkEggs,
        input.notes,
        now,
        id,
      ]
    );
    const updated = await getById(db, id);
    if (!updated) {
      throw new Error('Egg record not found after update');
    }
    return updated;
  },

  async deleteEggRecord(db: SQLiteDatabase, id: number): Promise<void> {
    await db.runAsync('DELETE FROM egg_records WHERE id = ?', [id]);
  },

  async getEggHistory(db: SQLiteDatabase, filters: EggRecordFilters): Promise<EggRecord[]> {
    const records = await listAll(db);
    let filtered = records;

    if (filters.flockId != null) {
      filtered = filtered.filter((record) => record.flockId === filters.flockId);
    }
    if (filters.date.trim()) {
      const query = filters.date.trim();
      filtered = filtered.filter((record) => record.date.startsWith(query));
    }
    if (filters.searchText.trim()) {
      const query = filters.searchText.trim().toLowerCase();
      filtered = filtered.filter((record) => (record.notes ?? '').toLowerCase().includes(query));
    }

    return filtered;
  },

  getDailyProduction,
  getWeeklyProduction,
  getMonthlyProduction,
  getEggStatistics,

  async getProductionSeries(db: SQLiteDatabase, days: number): Promise<EggProductionPoint[]> {
    const records = await listAll(db);
    const byDate = new Map<string, number>();
    records.forEach((record) => {
      byDate.set(record.date, (byDate.get(record.date) ?? 0) + record.totalEggs);
    });

    const points: EggProductionPoint[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i -= 1) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const key = toDateInputValue(day);
      points.push({ date: key, total: byDate.get(key) ?? 0 });
    }
    return points;
  },

  async getMonthlyTrend(db: SQLiteDatabase, months: number): Promise<EggMonthlyPoint[]> {
    const records = await listAll(db);
    const byMonth = new Map<string, number>();
    records.forEach((record) => {
      const key = record.date.slice(0, 7);
      byMonth.set(key, (byMonth.get(key) ?? 0) + record.totalEggs);
    });

    const results: EggMonthlyPoint[] = [];
    const today = new Date();
    for (let i = months - 1; i >= 0; i -= 1) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      const label = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(monthDate);
      results.push({ monthLabel: label, total: byMonth.get(key) ?? 0 });
    }
    return results;
  },

  async getDashboardSummary(db: SQLiteDatabase): Promise<EggDashboardSummary> {
    const [todayTotal, weekTotal, monthTotal, statistics, records] = await Promise.all([
      getDailyProduction(db),
      getWeeklyProduction(db),
      getMonthlyProduction(db),
      getEggStatistics(db),
      listAll(db),
    ]);

    let averagePerDay = 0;
    if (records.length > 0) {
      const sortedDates = records.map((record) => record.date).sort();
      const firstDate = new Date(sortedDates[0]);
      const today = new Date();
      const daySpan =
        Math.round((startOfDay(today).getTime() - startOfDay(firstDate).getTime()) / (24 * 60 * 60 * 1000)) + 1;
      averagePerDay = statistics.totalEggs / Math.max(1, daySpan);
    }

    return {
      todayTotal,
      weekTotal,
      monthTotal,
      averagePerDay,
      bestDay: statistics.bestDay,
    };
  },
};
