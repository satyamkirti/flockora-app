import { SQLiteDatabase } from 'expo-sqlite';
import {
  BirdHealthStats,
  HealthDashboardStats,
  HealthRecord,
  HealthRecordFilters,
  HealthRecordInput,
  HealthRecordStatus,
  HealthRecordType,
} from '../../types/healthRecord';
import { startOfDay } from '../../utils/taskSchedule';

type HealthRecordRow = {
  id: number;
  birdId: number | null;
  flockId: number | null;
  type: string;
  title: string;
  notes: string | null;
  medicine: string | null;
  dosage: string | null;
  startDate: string | null;
  endDate: string | null;
  time: string | null;
  veterinarian: string | null;
  cost: number | null;
  reminderDate: string | null;
  status: string;
  notificationId: string | null;
  createdAt: string;
  updatedAt: string;
};

const mapRow = (row: HealthRecordRow): HealthRecord => ({
  ...row,
  type: row.type as HealthRecordType,
  status: row.status as HealthRecordStatus,
});

async function getById(db: SQLiteDatabase, id: number): Promise<HealthRecord | null> {
  const row = await db.getFirstAsync<HealthRecordRow>('SELECT * FROM health_records WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

const TREATMENT_TYPES: HealthRecordType[] = ['illness', 'treatment', 'injury', 'deworming'];

export const healthRecordRepository = {
  async list(db: SQLiteDatabase): Promise<HealthRecord[]> {
    const rows = await db.getAllAsync<HealthRecordRow>(
      'SELECT * FROM health_records ORDER BY startDate DESC, createdAt DESC'
    );
    return rows.map(mapRow);
  },

  getById,

  async createHealthRecord(db: SQLiteDatabase, input: HealthRecordInput): Promise<HealthRecord> {
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO health_records
        (birdId, flockId, type, title, notes, medicine, dosage, startDate, endDate, time, veterinarian, cost, reminderDate, status, notificationId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
      [
        input.birdId,
        input.flockId,
        input.type,
        input.title,
        input.notes,
        input.medicine,
        input.dosage,
        input.startDate,
        input.endDate,
        input.time,
        input.veterinarian,
        input.cost,
        input.reminderDate,
        input.status,
        now,
        now,
      ]
    );
    const created = await getById(db, result.lastInsertRowId);
    if (!created) {
      throw new Error('Health record not found after create');
    }
    return created;
  },

  async updateHealthRecord(db: SQLiteDatabase, id: number, input: HealthRecordInput): Promise<HealthRecord> {
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE health_records SET
        birdId = ?, flockId = ?, type = ?, title = ?, notes = ?, medicine = ?, dosage = ?, startDate = ?, endDate = ?, time = ?,
        veterinarian = ?, cost = ?, reminderDate = ?, status = ?, updatedAt = ?
       WHERE id = ?`,
      [
        input.birdId,
        input.flockId,
        input.type,
        input.title,
        input.notes,
        input.medicine,
        input.dosage,
        input.startDate,
        input.endDate,
        input.time,
        input.veterinarian,
        input.cost,
        input.reminderDate,
        input.status,
        now,
        id,
      ]
    );
    const updated = await getById(db, id);
    if (!updated) {
      throw new Error('Health record not found after update');
    }
    return updated;
  },

  async deleteHealthRecord(db: SQLiteDatabase, id: number): Promise<void> {
    await db.runAsync('DELETE FROM health_records WHERE id = ?', [id]);
  },

  async setNotificationId(db: SQLiteDatabase, id: number, notificationId: string | null): Promise<void> {
    await db.runAsync('UPDATE health_records SET notificationId = ? WHERE id = ?', [notificationId, id]);
  },

  async setStatus(db: SQLiteDatabase, id: number, status: HealthRecordStatus): Promise<HealthRecord> {
    const now = new Date().toISOString();
    await db.runAsync('UPDATE health_records SET status = ?, updatedAt = ? WHERE id = ?', [status, now, id]);
    const updated = await getById(db, id);
    if (!updated) {
      throw new Error('Health record not found after status update');
    }
    return updated;
  },

  async getBirdHealthHistory(db: SQLiteDatabase, birdId: number): Promise<HealthRecord[]> {
    const rows = await db.getAllAsync<HealthRecordRow>(
      'SELECT * FROM health_records WHERE birdId = ? ORDER BY startDate DESC, createdAt DESC',
      [birdId]
    );
    return rows.map(mapRow);
  },

  async getUpcomingHealthEvents(db: SQLiteDatabase, days = 30): Promise<HealthRecord[]> {
    const rows = await db.getAllAsync<HealthRecordRow>(
      "SELECT * FROM health_records WHERE status = 'active' AND reminderDate IS NOT NULL ORDER BY reminderDate ASC"
    );
    const records = rows.map(mapRow);
    const now = new Date();
    const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return records.filter((record) => new Date(record.reminderDate as string) <= end);
  },

  async getActiveTreatments(db: SQLiteDatabase): Promise<HealthRecord[]> {
    const rows = await db.getAllAsync<HealthRecordRow>(
      "SELECT * FROM health_records WHERE status = 'active' ORDER BY startDate DESC"
    );
    return rows.map(mapRow).filter((record) => TREATMENT_TYPES.includes(record.type));
  },

  async getStatsForBird(db: SQLiteDatabase, birdId: number): Promise<BirdHealthStats> {
    const rows = await db.getAllAsync<HealthRecordRow>('SELECT * FROM health_records WHERE birdId = ?', [birdId]);
    const records = rows.map(mapRow);
    return {
      treatmentCount: records.filter((record) => record.type === 'treatment').length,
      vaccinationsCompleted: records.filter((record) => record.type === 'vaccination' && record.status === 'completed')
        .length,
      totalExpenses: records.reduce((sum, record) => sum + (record.cost ?? 0), 0),
      activeMedicineCount: records.filter((record) => record.status === 'active' && Boolean(record.medicine)).length,
    };
  },

  async getDashboardStats(db: SQLiteDatabase): Promise<HealthDashboardStats> {
    const rows = await db.getAllAsync<HealthRecordRow>('SELECT * FROM health_records');
    const records = rows.map(mapRow);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const activeTreatments = records.filter(
      (record) => record.status === 'active' && TREATMENT_TYPES.includes(record.type)
    ).length;

    const vaccinationsDue = records.filter(
      (record) =>
        record.type === 'vaccination' &&
        record.status === 'active' &&
        record.reminderDate != null &&
        new Date(record.reminderDate) <= weekFromNow
    ).length;

    const healthAlerts = records.filter(
      (record) =>
        record.status === 'active' && record.reminderDate != null && new Date(record.reminderDate) < startOfDay(now)
    ).length;

    const recentRecordsCount = records.filter((record) => record.createdAt >= sevenDaysAgo).length;

    return { activeTreatments, vaccinationsDue, healthAlerts, recentRecordsCount };
  },

  async search(db: SQLiteDatabase, filters: HealthRecordFilters): Promise<HealthRecord[]> {
    const rows = await db.getAllAsync<HealthRecordRow>(
      'SELECT * FROM health_records ORDER BY startDate DESC, createdAt DESC'
    );
    let records = rows.map(mapRow);

    if (filters.birdId != null) {
      records = records.filter((record) => record.birdId === filters.birdId);
    }
    if (filters.flockId != null) {
      records = records.filter((record) => record.flockId === filters.flockId);
    }
    if (filters.type != null) {
      records = records.filter((record) => record.type === filters.type);
    }
    if (filters.status != null) {
      records = records.filter((record) => record.status === filters.status);
    }
    if (filters.date.trim()) {
      const query = filters.date.trim();
      records = records.filter((record) => (record.startDate ?? '').startsWith(query));
    }
    if (filters.searchText.trim()) {
      const query = filters.searchText.trim().toLowerCase();
      records = records.filter(
        (record) =>
          record.title.toLowerCase().includes(query) ||
          (record.notes ?? '').toLowerCase().includes(query) ||
          (record.medicine ?? '').toLowerCase().includes(query)
      );
    }

    return records;
  },
};
