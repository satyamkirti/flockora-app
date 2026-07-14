import { BackupData, BackupRow, BackupTableKey } from '../types/backup';

const TABLE_KEYS: BackupTableKey[] = [
  'flocks',
  'birds',
  'tasks',
  'healthRecords',
  'eggRecords',
  'feedItems',
  'feedLogs',
  'breedingPairs',
  'clutches',
  'candlingRecords',
  'hatchRecords',
];

// Every table's primary key is `id`, so a well-formed backup row is a plain object carrying at
// least a numeric id — this also rejects the `{}`/array/primitive rows a corrupted or
// hand-edited backup file could contain.
function isValidBackupRow(row: unknown): row is BackupRow {
  return typeof row === 'object' && row !== null && !Array.isArray(row) && typeof (row as BackupRow).id === 'number';
}

export function isValidBackupData(value: unknown): value is BackupData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.schemaVersion !== 'number' || typeof candidate.exportedAt !== 'string') {
    return false;
  }
  return TABLE_KEYS.every((key) => Array.isArray(candidate[key]) && (candidate[key] as unknown[]).every(isValidBackupRow));
}

export type SchemaCompatibility = 'compatible' | 'too_new';

export function checkSchemaCompatibility(backupSchemaVersion: number, currentSchemaVersion: number): SchemaCompatibility {
  return backupSchemaVersion > currentSchemaVersion ? 'too_new' : 'compatible';
}

// Every nullable/non-null foreign key relationship from db/migrations.ts (see PROJECT_CONTEXT.md
// §4), expressed over backup table keys so it can be checked in-memory before any row is written.
// Restore itself runs with `foreign_keys = OFF` (see backupRepository.ts) for its DELETE/INSERT
// ordering, so a backup with a dangling reference would otherwise be inserted as a silent orphan
// instead of failing loudly — this check catches that case up front, while the database is still
// untouched, so the app can refuse the restore outright rather than leave broken relationships behind.
const FOREIGN_KEYS: { table: BackupTableKey; column: string; references: BackupTableKey }[] = [
  { table: 'birds', column: 'flockId', references: 'flocks' },
  { table: 'tasks', column: 'birdId', references: 'birds' },
  { table: 'tasks', column: 'flockId', references: 'flocks' },
  { table: 'healthRecords', column: 'birdId', references: 'birds' },
  { table: 'healthRecords', column: 'flockId', references: 'flocks' },
  { table: 'eggRecords', column: 'flockId', references: 'flocks' },
  { table: 'eggRecords', column: 'birdId', references: 'birds' },
  { table: 'feedLogs', column: 'feedItemId', references: 'feedItems' },
  { table: 'feedLogs', column: 'flockId', references: 'flocks' },
  { table: 'feedLogs', column: 'birdId', references: 'birds' },
  { table: 'breedingPairs', column: 'maleBirdId', references: 'birds' },
  { table: 'breedingPairs', column: 'femaleBirdId', references: 'birds' },
  { table: 'clutches', column: 'breedingPairId', references: 'breedingPairs' },
  { table: 'clutches', column: 'flockId', references: 'flocks' },
  { table: 'candlingRecords', column: 'clutchId', references: 'clutches' },
  { table: 'hatchRecords', column: 'clutchId', references: 'clutches' },
];

/** Assumes `data` has already passed isValidBackupData (so every row carries a numeric `id`). */
export function hasReferentialIntegrity(data: BackupData): boolean {
  const idsByTable = new Map<BackupTableKey, Set<number>>(
    TABLE_KEYS.map((key) => [key, new Set(data[key].map((row) => row.id as number))])
  );

  return FOREIGN_KEYS.every(({ table, column, references }) => {
    const referencedIds = idsByTable.get(references)!;
    return data[table].every((row) => {
      const value = row[column];
      if (value === null || value === undefined) {
        return true;
      }
      return typeof value === 'number' && referencedIds.has(value);
    });
  });
}
