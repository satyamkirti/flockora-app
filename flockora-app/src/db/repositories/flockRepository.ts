import { SQLiteDatabase } from 'expo-sqlite';
import { Flock, FlockInput, FlockPurpose, FlockWithCount } from '../../types/flock';
import { SpeciesKey } from '../../types/onboarding';

type FlockRow = {
  id: number;
  name: string;
  species: string | null;
  breed: string | null;
  purpose: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

const mapRow = (row: FlockRow): Flock => ({
  ...row,
  species: row.species as SpeciesKey | null,
  purpose: row.purpose as FlockPurpose | null,
});

export const flockRepository = {
  async listWithCounts(db: SQLiteDatabase): Promise<FlockWithCount[]> {
    const rows = await db.getAllAsync<FlockRow & { birdCount: number }>(`
      SELECT f.id, f.name, f.species, f.breed, f.purpose, f.notes, f.createdAt, f.updatedAt, COUNT(b.id) as birdCount
      FROM flocks f
      LEFT JOIN birds b ON b.flockId = f.id
      GROUP BY f.id
      ORDER BY f.name COLLATE NOCASE ASC
    `);
    return rows.map((row) => ({ ...mapRow(row), birdCount: row.birdCount }));
  },

  async getById(db: SQLiteDatabase, id: number): Promise<Flock | null> {
    const row = await db.getFirstAsync<FlockRow>('SELECT * FROM flocks WHERE id = ?', [id]);
    return row ? mapRow(row) : null;
  },

  async createFlock(db: SQLiteDatabase, input: FlockInput): Promise<Flock> {
    const now = new Date().toISOString();
    const result = await db.runAsync(
      'INSERT INTO flocks (name, species, breed, purpose, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [input.name, input.species, input.breed, input.purpose, input.notes, now, now]
    );
    const row = await db.getFirstAsync<FlockRow>('SELECT * FROM flocks WHERE id = ?', [result.lastInsertRowId]);
    if (!row) {
      throw new Error('Flock not found after create');
    }
    return mapRow(row);
  },

  async updateFlock(db: SQLiteDatabase, id: number, input: FlockInput): Promise<Flock> {
    const now = new Date().toISOString();
    await db.runAsync(
      'UPDATE flocks SET name = ?, species = ?, breed = ?, purpose = ?, notes = ?, updatedAt = ? WHERE id = ?',
      [input.name, input.species, input.breed, input.purpose, input.notes, now, id]
    );
    const row = await db.getFirstAsync<FlockRow>('SELECT * FROM flocks WHERE id = ?', [id]);
    if (!row) {
      throw new Error('Flock not found after update');
    }
    return mapRow(row);
  },

  /** Lightweight rename used by the quick-create/rename flow in FlockManagerModal — leaves
   *  species/breed/purpose/notes untouched. Full editing goes through updateFlock() above. */
  async rename(db: SQLiteDatabase, id: number, name: string): Promise<void> {
    await db.runAsync('UPDATE flocks SET name = ?, updatedAt = ? WHERE id = ?', [
      name,
      new Date().toISOString(),
      id,
    ]);
  },

  async deleteFlock(db: SQLiteDatabase, id: number): Promise<void> {
    await db.runAsync('DELETE FROM flocks WHERE id = ?', [id]);
  },

  async count(db: SQLiteDatabase): Promise<number> {
    const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM flocks');
    return row?.count ?? 0;
  },
};
