import { SQLiteDatabase } from 'expo-sqlite';
import { Flock, FlockWithCount } from '../../types/flock';

export const flockRepository = {
  async listWithCounts(db: SQLiteDatabase): Promise<FlockWithCount[]> {
    return db.getAllAsync<FlockWithCount>(`
      SELECT f.id, f.name, f.createdAt, f.updatedAt, COUNT(b.id) as birdCount
      FROM flocks f
      LEFT JOIN birds b ON b.flockId = f.id
      GROUP BY f.id
      ORDER BY f.name COLLATE NOCASE ASC
    `);
  },

  async getById(db: SQLiteDatabase, id: number): Promise<Flock | null> {
    return db.getFirstAsync<Flock>('SELECT * FROM flocks WHERE id = ?', [id]);
  },

  async create(db: SQLiteDatabase, name: string): Promise<Flock> {
    const now = new Date().toISOString();
    const result = await db.runAsync('INSERT INTO flocks (name, createdAt, updatedAt) VALUES (?, ?, ?)', [
      name,
      now,
      now,
    ]);
    const flock = await db.getFirstAsync<Flock>('SELECT * FROM flocks WHERE id = ?', [result.lastInsertRowId]);
    if (!flock) {
      throw new Error('Flock not found after create');
    }
    return flock;
  },

  async rename(db: SQLiteDatabase, id: number, name: string): Promise<void> {
    await db.runAsync('UPDATE flocks SET name = ?, updatedAt = ? WHERE id = ?', [
      name,
      new Date().toISOString(),
      id,
    ]);
  },

  async remove(db: SQLiteDatabase, id: number): Promise<void> {
    await db.runAsync('DELETE FROM flocks WHERE id = ?', [id]);
  },

  async count(db: SQLiteDatabase): Promise<number> {
    const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM flocks');
    return row?.count ?? 0;
  },
};
