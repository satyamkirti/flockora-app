import { SQLiteDatabase } from 'expo-sqlite';
import { DATABASE_VERSION } from '../migrations';
import { BackupData, BackupRow, BackupTableKey } from '../../types/backup';

// Parent-first order, so a restore can insert rows before anything that references them via a
// foreign key. Delete uses the reverse of this order for the same reason.
const TABLES: { key: BackupTableKey; table: string }[] = [
  { key: 'flocks', table: 'flocks' },
  { key: 'birds', table: 'birds' },
  { key: 'tasks', table: 'tasks' },
  { key: 'healthRecords', table: 'health_records' },
  { key: 'eggRecords', table: 'egg_records' },
  { key: 'feedItems', table: 'feed_items' },
  { key: 'feedLogs', table: 'feed_logs' },
  { key: 'breedingPairs', table: 'breeding_pairs' },
  { key: 'clutches', table: 'clutches' },
  { key: 'candlingRecords', table: 'candling_records' },
  { key: 'hatchRecords', table: 'hatch_records' },
];

// Scheduled-notification IDs are device- and session-specific (expo-notifications), and this
// backup only captures SQLite rows, not the OS notification schedule itself. Restoring a stale ID
// would leave it pointing at a notification that doesn't exist on this device, so these columns
// are always cleared on restore rather than carried over.
const NOTIFICATION_ID_COLUMNS: Partial<Record<string, string[]>> = {
  tasks: ['notificationId'],
  health_records: ['notificationId'],
  feed_items: ['notificationId'],
  clutches: ['candlingNotificationId', 'hatchExpectedNotificationId', 'hatchDueNotificationId'],
};

async function exportAllTables(db: SQLiteDatabase): Promise<BackupData> {
  const results = await Promise.all(TABLES.map(({ table }) => db.getAllAsync<BackupRow>(`SELECT * FROM ${table}`)));

  const data = { schemaVersion: DATABASE_VERSION, exportedAt: new Date().toISOString() } as BackupData;
  TABLES.forEach(({ key }, index) => {
    data[key] = results[index];
  });
  return data;
}

function sanitizeRow(table: string, row: BackupRow): BackupRow {
  const notificationColumns = NOTIFICATION_ID_COLUMNS[table];
  if (!notificationColumns) {
    return row;
  }
  const sanitized = { ...row };
  notificationColumns.forEach((column) => {
    sanitized[column] = null;
  });
  return sanitized;
}

async function insertRow(db: SQLiteDatabase, table: string, row: BackupRow): Promise<void> {
  const columns = Object.keys(row);
  if (columns.length === 0) {
    return;
  }
  const placeholders = columns.map(() => '?').join(', ');
  const values = columns.map((column) => row[column] ?? null);
  await db.runAsync(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`, values as never[]);
}

async function restoreAllTables(db: SQLiteDatabase, data: BackupData): Promise<void> {
  // SQLite forbids toggling foreign_keys inside a transaction, so this happens outside the
  // withTransactionAsync block below, and is restored to ON afterwards either way.
  await db.execAsync('PRAGMA foreign_keys = OFF;');
  try {
    await db.withTransactionAsync(async () => {
      for (const { table } of [...TABLES].reverse()) {
        await db.runAsync(`DELETE FROM ${table}`);
      }
      for (const { key, table } of TABLES) {
        for (const row of data[key]) {
          await insertRow(db, table, sanitizeRow(table, row));
        }
      }
    });
  } finally {
    await db.execAsync('PRAGMA foreign_keys = ON;');
  }
}

export const backupRepository = {
  exportAllTables,
  restoreAllTables,
};
