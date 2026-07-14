import { Platform } from 'react-native';
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
    // A row with no columns at all (e.g. `{}`) can never be a real exported row — every table
    // requires at least an `id`. Silently skipping it would let a corrupted backup restore
    // "successfully" while quietly dropping data; throwing instead fails the whole transaction
    // (see restoreAllTables) so the caller reports a real restore failure.
    throw new Error(`Malformed backup row for table "${table}": no columns.`);
  }
  const placeholders = columns.map(() => '?').join(', ');
  const values = columns.map((column) => row[column] ?? null);
  await db.runAsync(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`, values as never[]);
}

async function restoreAllTables(db: SQLiteDatabase, data: BackupData): Promise<void> {
  // Restore wipes and repopulates every table in the database — the single highest-blast-radius
  // write in the app. db.withTransactionAsync() is explicitly documented by expo-sqlite as "not
  // exclusive and can be interrupted by other async queries" issued elsewhere on the same shared
  // connection (e.g. a concurrent export, or any screen's own data refresh), which could read a
  // half-restored table or even get folded into this transaction. withExclusiveTransactionAsync
  // opens a genuinely separate connection and gives real mutual exclusion: any concurrent write
  // (including a second, overlapping restore) blocks or fails instead of interleaving.
  // The fresh connection defaults to `foreign_keys = OFF` (SQLite's own per-connection default,
  // matching this function's previous explicit PRAGMA), so DELETE/INSERT can run in a single pass
  // without needing to toggle it — TABLES is already a parent-first topological order, so the
  // reverse-order deletes and as-listed inserts below never violate a constraint even when FK
  // enforcement is on.
  const runDeleteAndInsert = async (executor: SQLiteDatabase) => {
    for (const { table } of [...TABLES].reverse()) {
      await executor.runAsync(`DELETE FROM ${table}`);
    }
    for (const { key, table } of TABLES) {
      for (const row of data[key]) {
        await insertRow(executor, table, sanitizeRow(table, row));
      }
    }
  };

  // expo-sqlite's withExclusiveTransactionAsync throws immediately on web (it opens a second
  // native connection, which the web/WASM backend doesn't support). Web is an unshipped Expo
  // scaffold script here (see PROJECT_CONTEXT.md §2 — this app is mobile-only), not a target
  // platform, so it falls back to the previously-used non-exclusive transaction there rather than
  // losing restore entirely on that path.
  if (Platform.OS === 'web') {
    await db.withTransactionAsync(() => runDeleteAndInsert(db));
    return;
  }
  await db.withExclusiveTransactionAsync((txn) => runDeleteAndInsert(txn));
}

export const backupRepository = {
  exportAllTables,
  restoreAllTables,
};
