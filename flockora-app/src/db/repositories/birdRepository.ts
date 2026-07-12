import { SQLiteDatabase } from 'expo-sqlite';
import { Bird, BirdInput } from '../../types/bird';
import { SpeciesKey } from '../../types/onboarding';

type BirdRow = {
  id: number;
  name: string;
  species: string;
  breed: string | null;
  sex: string | null;
  dateOfBirth: string | null;
  ageEstimate: string | null;
  acquisitionDate: string | null;
  color: string | null;
  weight: number | null;
  weightUnit: string | null;
  notes: string | null;
  photoUri: string | null;
  isActive: number;
  flockId: number | null;
  createdAt: string;
  updatedAt: string;
};

const mapRow = (row: BirdRow): Bird => ({
  ...row,
  species: row.species as SpeciesKey,
  weightUnit: row.weightUnit as Bird['weightUnit'],
  isActive: row.isActive === 1,
});

async function getById(db: SQLiteDatabase, id: number): Promise<Bird | null> {
  const row = await db.getFirstAsync<BirdRow>('SELECT * FROM birds WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export const birdRepository = {
  async list(db: SQLiteDatabase): Promise<Bird[]> {
    const rows = await db.getAllAsync<BirdRow>('SELECT * FROM birds ORDER BY createdAt DESC');
    return rows.map(mapRow);
  },

  async listByFlock(db: SQLiteDatabase, flockId: number): Promise<Bird[]> {
    const rows = await db.getAllAsync<BirdRow>(
      'SELECT * FROM birds WHERE flockId = ? ORDER BY createdAt DESC',
      [flockId]
    );
    return rows.map(mapRow);
  },

  async mostRecent(db: SQLiteDatabase, limit: number): Promise<Bird[]> {
    const rows = await db.getAllAsync<BirdRow>('SELECT * FROM birds ORDER BY createdAt DESC LIMIT ?', [limit]);
    return rows.map(mapRow);
  },

  getById,

  async create(db: SQLiteDatabase, input: BirdInput): Promise<Bird> {
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO birds
        (name, species, breed, sex, dateOfBirth, ageEstimate, acquisitionDate, color, weight, weightUnit, notes, photoUri, isActive, flockId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.name,
        input.species,
        input.breed,
        input.sex,
        input.dateOfBirth,
        input.ageEstimate,
        input.acquisitionDate,
        input.color,
        input.weight,
        input.weightUnit,
        input.notes,
        input.photoUri,
        input.isActive ? 1 : 0,
        input.flockId,
        now,
        now,
      ]
    );
    const created = await getById(db, result.lastInsertRowId);
    if (!created) {
      throw new Error('Bird not found after create');
    }
    return created;
  },

  async update(db: SQLiteDatabase, id: number, input: BirdInput): Promise<Bird> {
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE birds SET
        name = ?, species = ?, breed = ?, sex = ?, dateOfBirth = ?, ageEstimate = ?, acquisitionDate = ?,
        color = ?, weight = ?, weightUnit = ?, notes = ?, photoUri = ?, isActive = ?, flockId = ?, updatedAt = ?
       WHERE id = ?`,
      [
        input.name,
        input.species,
        input.breed,
        input.sex,
        input.dateOfBirth,
        input.ageEstimate,
        input.acquisitionDate,
        input.color,
        input.weight,
        input.weightUnit,
        input.notes,
        input.photoUri,
        input.isActive ? 1 : 0,
        input.flockId,
        now,
        id,
      ]
    );
    const updated = await getById(db, id);
    if (!updated) {
      throw new Error('Bird not found after update');
    }
    return updated;
  },

  async remove(db: SQLiteDatabase, id: number): Promise<void> {
    await db.runAsync('DELETE FROM birds WHERE id = ?', [id]);
  },

  async setActive(db: SQLiteDatabase, id: number, isActive: boolean): Promise<void> {
    await db.runAsync('UPDATE birds SET isActive = ?, updatedAt = ? WHERE id = ?', [
      isActive ? 1 : 0,
      new Date().toISOString(),
      id,
    ]);
  },

  async countAll(db: SQLiteDatabase): Promise<number> {
    const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM birds');
    return row?.count ?? 0;
  },

  async countActive(db: SQLiteDatabase): Promise<number> {
    const row = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM birds WHERE isActive = 1'
    );
    return row?.count ?? 0;
  },

  async countCreatedSince(db: SQLiteDatabase, sinceIso: string): Promise<number> {
    const row = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM birds WHERE createdAt >= ?',
      [sinceIso]
    );
    return row?.count ?? 0;
  },
};
