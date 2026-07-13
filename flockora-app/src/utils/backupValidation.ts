import { BackupData, BackupTableKey } from '../types/backup';

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

export function isValidBackupData(value: unknown): value is BackupData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.schemaVersion !== 'number' || typeof candidate.exportedAt !== 'string') {
    return false;
  }
  return TABLE_KEYS.every((key) => Array.isArray(candidate[key]));
}

export type SchemaCompatibility = 'compatible' | 'too_new';

export function checkSchemaCompatibility(backupSchemaVersion: number, currentSchemaVersion: number): SchemaCompatibility {
  return backupSchemaVersion > currentSchemaVersion ? 'too_new' : 'compatible';
}
