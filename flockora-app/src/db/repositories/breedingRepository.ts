import { SQLiteDatabase } from 'expo-sqlite';
import {
  BreedingHubSummary,
  BreedingPair,
  BreedingPairInput,
  BreedingPairStatus,
  BreedingStatistics,
  CandlingRecord,
  CandlingRecordInput,
  Clutch,
  ClutchFilters,
  ClutchInput,
  ClutchStatus,
  HatchRecord,
  HatchRecordInput,
  IncubationType,
} from '../../types/breeding';
import { Bird } from '../../types/bird';
import { SpeciesKey } from '../../types/onboarding';
import { birdRepository } from './birdRepository';
import { classifyBirdSex } from '../../utils/birdSex';
import { deriveClutchSpecies, getIncubationPhase, safePercent } from '../../utils/breedingCalc';

export class SameBirdPairingError extends Error {
  constructor() {
    super('A bird cannot be paired with itself.');
    this.name = 'SameBirdPairingError';
  }
}

export class InvalidSexPairingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSexPairingError';
  }
}

export class CandlingCountExceedsClutchError extends Error {
  constructor(public totalEggs: number, public countedEggs: number) {
    super(`Candling counts (${countedEggs}) cannot exceed the clutch total of ${totalEggs} eggs.`);
    this.name = 'CandlingCountExceedsClutchError';
  }
}

export class ClutchTotalReductionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClutchTotalReductionError';
  }
}

export class DuplicateBirdCreationError extends Error {
  constructor() {
    super('Birds have already been created from this hatch record.');
    this.name = 'DuplicateBirdCreationError';
  }
}

type BreedingPairRow = {
  id: number;
  maleBirdId: number;
  femaleBirdId: number;
  pairName: string | null;
  pairedDate: string;
  separatedDate: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type ClutchRow = {
  id: number;
  breedingPairId: number | null;
  flockId: number | null;
  clutchName: string | null;
  laidDate: string;
  totalEggs: number;
  incubationType: string;
  incubatorName: string | null;
  incubationStartDate: string | null;
  expectedHatchDate: string | null;
  actualHatchDate: string | null;
  status: string;
  notes: string | null;
  candlingNotificationId: string | null;
  hatchExpectedNotificationId: string | null;
  hatchDueNotificationId: string | null;
  createdAt: string;
  updatedAt: string;
};

type CandlingRow = {
  id: number;
  clutchId: number;
  date: string;
  fertileEggs: number;
  infertileEggs: number;
  uncertainEggs: number;
  deadEmbryos: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type HatchRow = {
  id: number;
  clutchId: number;
  hatchedEggs: number;
  failedEggs: number;
  assistedHatches: number;
  hatchDate: string;
  notes: string | null;
  birdsCreated: number;
  createdAt: string;
  updatedAt: string;
};

const mapPairRow = (row: BreedingPairRow): BreedingPair => ({ ...row, status: row.status as BreedingPairStatus });
const mapClutchRow = (row: ClutchRow): Clutch => ({
  ...row,
  incubationType: row.incubationType as IncubationType,
  status: row.status as ClutchStatus,
});
const mapCandlingRow = (row: CandlingRow): CandlingRecord => ({ ...row });
const mapHatchRow = (row: HatchRow): HatchRecord => ({ ...row, birdsCreated: row.birdsCreated === 1 });

async function getBreedingPairById(db: SQLiteDatabase, id: number): Promise<BreedingPair | null> {
  const row = await db.getFirstAsync<BreedingPairRow>('SELECT * FROM breeding_pairs WHERE id = ?', [id]);
  return row ? mapPairRow(row) : null;
}

async function listBreedingPairsRaw(db: SQLiteDatabase): Promise<BreedingPair[]> {
  const rows = await db.getAllAsync<BreedingPairRow>('SELECT * FROM breeding_pairs ORDER BY pairedDate DESC');
  return rows.map(mapPairRow);
}

async function getClutchById(db: SQLiteDatabase, id: number): Promise<Clutch | null> {
  const row = await db.getFirstAsync<ClutchRow>('SELECT * FROM clutches WHERE id = ?', [id]);
  return row ? mapClutchRow(row) : null;
}

async function listClutchesRaw(db: SQLiteDatabase): Promise<Clutch[]> {
  const rows = await db.getAllAsync<ClutchRow>('SELECT * FROM clutches ORDER BY laidDate DESC');
  return rows.map(mapClutchRow);
}

async function listCandlingRecordsForClutch(db: SQLiteDatabase, clutchId: number): Promise<CandlingRecord[]> {
  const rows = await db.getAllAsync<CandlingRow>(
    'SELECT * FROM candling_records WHERE clutchId = ? ORDER BY date DESC, createdAt DESC',
    [clutchId]
  );
  return rows.map(mapCandlingRow);
}

async function getCandlingRecordById(db: SQLiteDatabase, id: number): Promise<CandlingRecord | null> {
  const row = await db.getFirstAsync<CandlingRow>('SELECT * FROM candling_records WHERE id = ?', [id]);
  return row ? mapCandlingRow(row) : null;
}

async function getHatchRecordForClutchRaw(db: SQLiteDatabase, clutchId: number): Promise<HatchRecord | null> {
  const row = await db.getFirstAsync<HatchRow>('SELECT * FROM hatch_records WHERE clutchId = ?', [clutchId]);
  return row ? mapHatchRow(row) : null;
}

async function getHatchRecordById(db: SQLiteDatabase, id: number): Promise<HatchRecord | null> {
  const row = await db.getFirstAsync<HatchRow>('SELECT * FROM hatch_records WHERE id = ?', [id]);
  return row ? mapHatchRow(row) : null;
}

async function validatePairSelection(db: SQLiteDatabase, maleBirdId: number, femaleBirdId: number): Promise<void> {
  if (maleBirdId === femaleBirdId) {
    throw new SameBirdPairingError();
  }
  const maleBird = await birdRepository.getById(db, maleBirdId);
  const femaleBird = await birdRepository.getById(db, femaleBirdId);
  if (maleBird && classifyBirdSex(maleBird.sex) === 'female') {
    throw new InvalidSexPairingError(`${maleBird.name} is recorded as female and cannot be selected as the male.`);
  }
  if (femaleBird && classifyBirdSex(femaleBird.sex) === 'male') {
    throw new InvalidSexPairingError(`${femaleBird.name} is recorded as male and cannot be selected as the female.`);
  }
}

async function validateTotalEggsReduction(db: SQLiteDatabase, clutchId: number, newTotalEggs: number): Promise<void> {
  const candlingRecords = await listCandlingRecordsForClutch(db, clutchId);
  const maxCandlingSum = candlingRecords.reduce(
    (max, record) => Math.max(max, record.fertileEggs + record.infertileEggs + record.uncertainEggs + record.deadEmbryos),
    0
  );
  if (newTotalEggs < maxCandlingSum) {
    throw new ClutchTotalReductionError(
      `Total eggs cannot be reduced below ${maxCandlingSum}; a candling record already accounts for that many eggs.`
    );
  }
  const hatchRecord = await getHatchRecordForClutchRaw(db, clutchId);
  if (hatchRecord) {
    const hatchSum = hatchRecord.hatchedEggs + hatchRecord.failedEggs;
    if (newTotalEggs < hatchSum) {
      throw new ClutchTotalReductionError(
        `Total eggs cannot be reduced below ${hatchSum}; hatch results already account for that many eggs.`
      );
    }
  }
}

export const breedingRepository = {
  listBreedingPairs: listBreedingPairsRaw,
  getBreedingPair: getBreedingPairById,

  async createBreedingPair(db: SQLiteDatabase, input: BreedingPairInput): Promise<BreedingPair> {
    await validatePairSelection(db, input.maleBirdId, input.femaleBirdId);
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO breeding_pairs (maleBirdId, femaleBirdId, pairName, pairedDate, separatedDate, status, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.maleBirdId,
        input.femaleBirdId,
        input.pairName,
        input.pairedDate,
        input.separatedDate,
        input.status,
        input.notes,
        now,
        now,
      ]
    );
    const created = await getBreedingPairById(db, result.lastInsertRowId);
    if (!created) {
      throw new Error('Breeding pair not found after create');
    }
    return created;
  },

  async updateBreedingPair(db: SQLiteDatabase, id: number, input: BreedingPairInput): Promise<BreedingPair> {
    await validatePairSelection(db, input.maleBirdId, input.femaleBirdId);
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE breeding_pairs SET
        maleBirdId = ?, femaleBirdId = ?, pairName = ?, pairedDate = ?, separatedDate = ?, status = ?, notes = ?, updatedAt = ?
       WHERE id = ?`,
      [
        input.maleBirdId,
        input.femaleBirdId,
        input.pairName,
        input.pairedDate,
        input.separatedDate,
        input.status,
        input.notes,
        now,
        id,
      ]
    );
    const updated = await getBreedingPairById(db, id);
    if (!updated) {
      throw new Error('Breeding pair not found after update');
    }
    return updated;
  },

  async deleteBreedingPair(db: SQLiteDatabase, id: number): Promise<void> {
    await db.runAsync('DELETE FROM breeding_pairs WHERE id = ?', [id]);
  },

  async getClutchCountsByPairId(db: SQLiteDatabase): Promise<Record<number, number>> {
    const rows = await db.getAllAsync<{ breedingPairId: number; count: number }>(
      'SELECT breedingPairId, COUNT(*) as count FROM clutches WHERE breedingPairId IS NOT NULL GROUP BY breedingPairId'
    );
    return Object.fromEntries(rows.map((row) => [row.breedingPairId, row.count]));
  },

  listClutches: listClutchesRaw,
  getClutch: getClutchById,

  async createClutch(db: SQLiteDatabase, input: ClutchInput): Promise<Clutch> {
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO clutches
        (breedingPairId, flockId, clutchName, laidDate, totalEggs, incubationType, incubatorName,
         incubationStartDate, expectedHatchDate, actualHatchDate, status, notes,
         candlingNotificationId, hatchExpectedNotificationId, hatchDueNotificationId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?)`,
      [
        input.breedingPairId,
        input.flockId,
        input.clutchName,
        input.laidDate,
        input.totalEggs,
        input.incubationType,
        input.incubatorName,
        input.incubationStartDate,
        input.expectedHatchDate,
        input.actualHatchDate,
        input.status,
        input.notes,
        now,
        now,
      ]
    );
    const created = await getClutchById(db, result.lastInsertRowId);
    if (!created) {
      throw new Error('Clutch not found after create');
    }
    return created;
  },

  async updateClutch(db: SQLiteDatabase, id: number, input: ClutchInput): Promise<Clutch> {
    const existing = await getClutchById(db, id);
    if (existing && input.totalEggs < existing.totalEggs) {
      await validateTotalEggsReduction(db, id, input.totalEggs);
    }
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE clutches SET
        breedingPairId = ?, flockId = ?, clutchName = ?, laidDate = ?, totalEggs = ?, incubationType = ?,
        incubatorName = ?, incubationStartDate = ?, expectedHatchDate = ?, actualHatchDate = ?, status = ?,
        notes = ?, updatedAt = ?
       WHERE id = ?`,
      [
        input.breedingPairId,
        input.flockId,
        input.clutchName,
        input.laidDate,
        input.totalEggs,
        input.incubationType,
        input.incubatorName,
        input.incubationStartDate,
        input.expectedHatchDate,
        input.actualHatchDate,
        input.status,
        input.notes,
        now,
        id,
      ]
    );
    const updated = await getClutchById(db, id);
    if (!updated) {
      throw new Error('Clutch not found after update');
    }
    return updated;
  },

  async deleteClutch(db: SQLiteDatabase, id: number): Promise<void> {
    await db.runAsync('DELETE FROM clutches WHERE id = ?', [id]);
  },

  async getClutchHistory(db: SQLiteDatabase, filters: ClutchFilters): Promise<Clutch[]> {
    const [clutches, pairs, birds] = await Promise.all([
      listClutchesRaw(db),
      listBreedingPairsRaw(db),
      birdRepository.list(db),
    ]);
    let filtered = clutches;

    if (filters.breedingPairId != null) {
      filtered = filtered.filter((clutch) => clutch.breedingPairId === filters.breedingPairId);
    }
    if (filters.status != null) {
      filtered = filtered.filter((clutch) => clutch.status === filters.status);
    }
    if (filters.date.trim()) {
      const query = filters.date.trim();
      filtered = filtered.filter((clutch) => clutch.laidDate.startsWith(query));
    }
    if (filters.species != null) {
      filtered = filtered.filter((clutch) => deriveClutchSpecies(clutch, pairs, birds) === filters.species);
    }

    return filtered;
  },

  async setClutchNotificationIds(
    db: SQLiteDatabase,
    id: number,
    ids: { candling?: string | null; hatchExpected?: string | null; hatchDue?: string | null }
  ): Promise<void> {
    const clutch = await getClutchById(db, id);
    if (!clutch) {
      return;
    }
    await db.runAsync(
      'UPDATE clutches SET candlingNotificationId = ?, hatchExpectedNotificationId = ?, hatchDueNotificationId = ? WHERE id = ?',
      [
        ids.candling !== undefined ? ids.candling : clutch.candlingNotificationId,
        ids.hatchExpected !== undefined ? ids.hatchExpected : clutch.hatchExpectedNotificationId,
        ids.hatchDue !== undefined ? ids.hatchDue : clutch.hatchDueNotificationId,
        id,
      ]
    );
  },

  listCandlingRecords: listCandlingRecordsForClutch,

  async getLatestCandlingRecord(db: SQLiteDatabase, clutchId: number): Promise<CandlingRecord | null> {
    const records = await listCandlingRecordsForClutch(db, clutchId);
    return records[0] ?? null;
  },

  async addCandlingRecord(db: SQLiteDatabase, input: CandlingRecordInput): Promise<CandlingRecord> {
    const sum = input.fertileEggs + input.infertileEggs + input.uncertainEggs + input.deadEmbryos;
    const clutch = await getClutchById(db, input.clutchId);
    if (!clutch) {
      throw new Error('Clutch not found');
    }
    if (sum > clutch.totalEggs) {
      throw new CandlingCountExceedsClutchError(clutch.totalEggs, sum);
    }
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO candling_records (clutchId, date, fertileEggs, infertileEggs, uncertainEggs, deadEmbryos, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [input.clutchId, input.date, input.fertileEggs, input.infertileEggs, input.uncertainEggs, input.deadEmbryos, input.notes, now, now]
    );
    const created = await getCandlingRecordById(db, result.lastInsertRowId);
    if (!created) {
      throw new Error('Candling record not found after create');
    }
    return created;
  },

  async updateCandlingRecord(db: SQLiteDatabase, id: number, input: CandlingRecordInput): Promise<CandlingRecord> {
    const sum = input.fertileEggs + input.infertileEggs + input.uncertainEggs + input.deadEmbryos;
    const clutch = await getClutchById(db, input.clutchId);
    if (!clutch) {
      throw new Error('Clutch not found');
    }
    if (sum > clutch.totalEggs) {
      throw new CandlingCountExceedsClutchError(clutch.totalEggs, sum);
    }
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE candling_records SET date = ?, fertileEggs = ?, infertileEggs = ?, uncertainEggs = ?, deadEmbryos = ?, notes = ?, updatedAt = ?
       WHERE id = ?`,
      [input.date, input.fertileEggs, input.infertileEggs, input.uncertainEggs, input.deadEmbryos, input.notes, now, id]
    );
    const updated = await getCandlingRecordById(db, id);
    if (!updated) {
      throw new Error('Candling record not found after update');
    }
    return updated;
  },

  async deleteCandlingRecord(db: SQLiteDatabase, id: number): Promise<void> {
    await db.runAsync('DELETE FROM candling_records WHERE id = ?', [id]);
  },

  getHatchRecordForClutch: getHatchRecordForClutchRaw,
  getHatchRecord: getHatchRecordById,

  async saveHatchRecord(db: SQLiteDatabase, input: HatchRecordInput): Promise<HatchRecord> {
    const existing = await getHatchRecordForClutchRaw(db, input.clutchId);
    const now = new Date().toISOString();
    if (existing) {
      await db.runAsync(
        `UPDATE hatch_records SET hatchedEggs = ?, failedEggs = ?, assistedHatches = ?, hatchDate = ?, notes = ?, updatedAt = ?
         WHERE id = ?`,
        [input.hatchedEggs, input.failedEggs, input.assistedHatches, input.hatchDate, input.notes, now, existing.id]
      );
      const updated = await getHatchRecordById(db, existing.id);
      if (!updated) {
        throw new Error('Hatch record not found after update');
      }
      return updated;
    }

    const result = await db.runAsync(
      `INSERT INTO hatch_records (clutchId, hatchedEggs, failedEggs, assistedHatches, hatchDate, notes, birdsCreated, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [input.clutchId, input.hatchedEggs, input.failedEggs, input.assistedHatches, input.hatchDate, input.notes, now, now]
    );
    const created = await getHatchRecordById(db, result.lastInsertRowId);
    if (!created) {
      throw new Error('Hatch record not found after create');
    }
    return created;
  },

  async deleteHatchRecord(db: SQLiteDatabase, id: number): Promise<void> {
    await db.runAsync('DELETE FROM hatch_records WHERE id = ?', [id]);
  },

  async createBirdsFromHatch(
    db: SQLiteDatabase,
    hatchRecordId: number,
    options: { count: number; species: SpeciesKey; namePrefix: string; flockId: number | null }
  ): Promise<Bird[]> {
    const createdBirds: Bird[] = [];
    await db.withTransactionAsync(async () => {
      const hatchRecord = await getHatchRecordById(db, hatchRecordId);
      if (!hatchRecord) {
        throw new Error('Hatch record not found');
      }
      if (hatchRecord.birdsCreated) {
        throw new DuplicateBirdCreationError();
      }

      for (let index = 1; index <= options.count; index += 1) {
        const name = options.count === 1 ? options.namePrefix : `${options.namePrefix} ${index}`;
        const bird = await birdRepository.createBird(db, {
          name,
          species: options.species,
          breed: null,
          sex: null,
          dateOfBirth: hatchRecord.hatchDate,
          ageEstimate: null,
          acquisitionDate: hatchRecord.hatchDate,
          color: null,
          weight: null,
          weightUnit: 'kg',
          notes: `Hatched from clutch #${hatchRecord.clutchId}.`,
          photoUri: null,
          tagId: null,
          isActive: true,
          flockId: options.flockId,
        });
        createdBirds.push(bird);
      }

      const now = new Date().toISOString();
      await db.runAsync('UPDATE hatch_records SET birdsCreated = 1, updatedAt = ? WHERE id = ?', [now, hatchRecordId]);
    });
    return createdBirds;
  },

  async getBreedingStatistics(db: SQLiteDatabase): Promise<BreedingStatistics> {
    const clutches = await listClutchesRaw(db);
    const totalClutches = clutches.length;
    const totalEggsIncubated = clutches.reduce((sum, clutch) => sum + clutch.totalEggs, 0);

    // Single aggregate query (via ROW_NUMBER) for each clutch's latest candling record, and a
    // single bulk query for hatch records — replaces what was previously two queries per clutch.
    const latestCandlingRows = await db.getAllAsync<{ clutchId: number; fertileEggs: number }>(
      `SELECT clutchId, fertileEggs FROM (
         SELECT clutchId, fertileEggs,
                ROW_NUMBER() OVER (PARTITION BY clutchId ORDER BY date DESC, createdAt DESC) AS rn
         FROM candling_records
       ) WHERE rn = 1`
    );
    const latestFertileByClutchId = new Map(latestCandlingRows.map((row) => [row.clutchId, row.fertileEggs]));

    const hatchRows = await db.getAllAsync<{ clutchId: number; hatchedEggs: number }>(
      'SELECT clutchId, hatchedEggs FROM hatch_records'
    );
    const hatchedEggsByClutchId = new Map(hatchRows.map((row) => [row.clutchId, row.hatchedEggs]));

    let fertileSum = 0;
    let candledTotalEggsSum = 0;
    let hatchedSum = 0;
    let hatchableFertileSum = 0;
    let hatchedFromFertileSum = 0;

    for (const clutch of clutches) {
      const latestFertile = latestFertileByClutchId.get(clutch.id);
      if (latestFertile != null) {
        fertileSum += latestFertile;
        candledTotalEggsSum += clutch.totalEggs;
      }
      const hatchedEggs = hatchedEggsByClutchId.get(clutch.id);
      if (hatchedEggs != null) {
        hatchedSum += hatchedEggs;
        if (latestFertile != null && latestFertile > 0) {
          hatchableFertileSum += latestFertile;
          hatchedFromFertileSum += hatchedEggs;
        }
      }
    }

    return {
      totalClutches,
      totalEggsIncubated,
      fertilityRatePercent: safePercent(fertileSum, candledTotalEggsSum),
      hatchRatePercent: safePercent(hatchedSum, totalEggsIncubated),
      hatchabilityOfFertilePercent: safePercent(hatchedFromFertileSum, hatchableFertileSum),
      successfulHatches: hatchedSum,
    };
  },

  async getBreedingDashboardSummary(db: SQLiteDatabase): Promise<BreedingHubSummary> {
    const [pairs, clutches] = await Promise.all([listBreedingPairsRaw(db), listClutchesRaw(db)]);
    const today = new Date();
    const activePairs = pairs.filter((pair) => pair.status === 'active').length;
    const activeClutchList = clutches.filter((clutch) => clutch.status === 'active' && !clutch.actualHatchDate);
    const activeClutches = activeClutchList.length;
    const eggsIncubating = activeClutchList.reduce((sum, clutch) => sum + clutch.totalEggs, 0);

    let hatchesDueSoon = 0;
    let overdueHatches = 0;
    activeClutchList.forEach((clutch) => {
      const phase = getIncubationPhase(clutch, today);
      if (phase === 'due_soon' || phase === 'hatch_due') {
        hatchesDueSoon += 1;
      }
      if (phase === 'overdue') {
        overdueHatches += 1;
      }
    });

    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const recentHatchCount = clutches.filter(
      (clutch) => clutch.actualHatchDate != null && clutch.actualHatchDate >= sevenDaysAgo
    ).length;

    return { activePairs, activeClutches, eggsIncubating, hatchesDueSoon, overdueHatches, recentHatchCount };
  },
};
