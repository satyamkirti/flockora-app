import { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_VERSION = 10;

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS flocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS birds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        species TEXT NOT NULL,
        breed TEXT,
        sex TEXT,
        dateOfBirth TEXT,
        ageEstimate TEXT,
        acquisitionDate TEXT,
        color TEXT,
        weight REAL,
        weightUnit TEXT,
        notes TEXT,
        photoUri TEXT,
        isActive INTEGER NOT NULL DEFAULT 1,
        flockId INTEGER REFERENCES flocks(id) ON DELETE SET NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_birds_flockId ON birds(flockId);
      CREATE INDEX IF NOT EXISTS idx_birds_createdAt ON birds(createdAt);
    `);
    currentVersion = 1;
  }

  if (currentVersion === 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        birdId INTEGER REFERENCES birds(id) ON DELETE CASCADE,
        flockId INTEGER REFERENCES flocks(id) ON DELETE SET NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        dueDate TEXT NOT NULL,
        repeatType TEXT NOT NULL DEFAULT 'none',
        completed INTEGER NOT NULL DEFAULT 0,
        completedAt TEXT,
        notificationEnabled INTEGER NOT NULL DEFAULT 0,
        notificationId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_tasks_dueDate ON tasks(dueDate);
      CREATE INDEX IF NOT EXISTS idx_tasks_birdId ON tasks(birdId);
      CREATE INDEX IF NOT EXISTS idx_tasks_flockId ON tasks(flockId);
      CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
      CREATE INDEX IF NOT EXISTS idx_tasks_repeatType ON tasks(repeatType);
    `);
    currentVersion = 2;
  }

  if (currentVersion === 2) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS health_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        birdId INTEGER NOT NULL REFERENCES birds(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        notes TEXT,
        medicine TEXT,
        dosage TEXT,
        startDate TEXT,
        endDate TEXT,
        veterinarian TEXT,
        cost REAL,
        reminderDate TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        notificationId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_health_records_birdId ON health_records(birdId);
      CREATE INDEX IF NOT EXISTS idx_health_records_type ON health_records(type);
      CREATE INDEX IF NOT EXISTS idx_health_records_status ON health_records(status);
      CREATE INDEX IF NOT EXISTS idx_health_records_startDate ON health_records(startDate);
      CREATE INDEX IF NOT EXISTS idx_health_records_reminderDate ON health_records(reminderDate);
    `);
    currentVersion = 3;
  }

  if (currentVersion === 3) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS egg_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        flockId INTEGER REFERENCES flocks(id) ON DELETE SET NULL,
        birdId INTEGER REFERENCES birds(id) ON DELETE SET NULL,
        date TEXT NOT NULL,
        totalEggs INTEGER NOT NULL DEFAULT 0,
        fertileEggs INTEGER NOT NULL DEFAULT 0,
        crackedEggs INTEGER NOT NULL DEFAULT 0,
        dirtyEggs INTEGER NOT NULL DEFAULT 0,
        doubleYolkEggs INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_egg_records_date ON egg_records(date);
      CREATE INDEX IF NOT EXISTS idx_egg_records_flockId ON egg_records(flockId);
      CREATE INDEX IF NOT EXISTS idx_egg_records_birdId ON egg_records(birdId);
    `);
    currentVersion = 4;
  }

  if (currentVersion === 4) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS feed_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        feedType TEXT NOT NULL,
        brand TEXT,
        quantity REAL NOT NULL DEFAULT 0,
        unit TEXT NOT NULL,
        lowStockThreshold REAL,
        costPerUnit REAL,
        purchaseDate TEXT,
        expiryDate TEXT,
        notes TEXT,
        notificationId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_feed_items_feedType ON feed_items(feedType);
      CREATE INDEX IF NOT EXISTS idx_feed_items_expiryDate ON feed_items(expiryDate);

      CREATE TABLE IF NOT EXISTS feed_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feedItemId INTEGER NOT NULL REFERENCES feed_items(id) ON DELETE CASCADE,
        flockId INTEGER REFERENCES flocks(id) ON DELETE SET NULL,
        birdId INTEGER REFERENCES birds(id) ON DELETE SET NULL,
        quantityUsed REAL NOT NULL,
        unit TEXT NOT NULL,
        date TEXT NOT NULL,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_feed_logs_feedItemId ON feed_logs(feedItemId);
      CREATE INDEX IF NOT EXISTS idx_feed_logs_flockId ON feed_logs(flockId);
      CREATE INDEX IF NOT EXISTS idx_feed_logs_birdId ON feed_logs(birdId);
      CREATE INDEX IF NOT EXISTS idx_feed_logs_date ON feed_logs(date);
    `);
    currentVersion = 5;
  }

  if (currentVersion === 5) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS breeding_pairs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        maleBirdId INTEGER NOT NULL REFERENCES birds(id) ON DELETE CASCADE,
        femaleBirdId INTEGER NOT NULL REFERENCES birds(id) ON DELETE CASCADE,
        pairName TEXT,
        pairedDate TEXT NOT NULL,
        separatedDate TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_breeding_pairs_maleBirdId ON breeding_pairs(maleBirdId);
      CREATE INDEX IF NOT EXISTS idx_breeding_pairs_femaleBirdId ON breeding_pairs(femaleBirdId);
      CREATE INDEX IF NOT EXISTS idx_breeding_pairs_status ON breeding_pairs(status);

      CREATE TABLE IF NOT EXISTS clutches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        breedingPairId INTEGER REFERENCES breeding_pairs(id) ON DELETE SET NULL,
        flockId INTEGER REFERENCES flocks(id) ON DELETE SET NULL,
        clutchName TEXT,
        laidDate TEXT NOT NULL,
        totalEggs INTEGER NOT NULL DEFAULT 0,
        incubationType TEXT NOT NULL DEFAULT 'natural',
        incubatorName TEXT,
        incubationStartDate TEXT,
        expectedHatchDate TEXT,
        actualHatchDate TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        notes TEXT,
        candlingNotificationId TEXT,
        hatchExpectedNotificationId TEXT,
        hatchDueNotificationId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_clutches_breedingPairId ON clutches(breedingPairId);
      CREATE INDEX IF NOT EXISTS idx_clutches_flockId ON clutches(flockId);
      CREATE INDEX IF NOT EXISTS idx_clutches_status ON clutches(status);
      CREATE INDEX IF NOT EXISTS idx_clutches_expectedHatchDate ON clutches(expectedHatchDate);

      CREATE TABLE IF NOT EXISTS candling_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clutchId INTEGER NOT NULL REFERENCES clutches(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        fertileEggs INTEGER NOT NULL DEFAULT 0,
        infertileEggs INTEGER NOT NULL DEFAULT 0,
        uncertainEggs INTEGER NOT NULL DEFAULT 0,
        deadEmbryos INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_candling_records_clutchId ON candling_records(clutchId);
      CREATE INDEX IF NOT EXISTS idx_candling_records_date ON candling_records(date);

      CREATE TABLE IF NOT EXISTS hatch_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clutchId INTEGER NOT NULL REFERENCES clutches(id) ON DELETE CASCADE,
        hatchedEggs INTEGER NOT NULL DEFAULT 0,
        failedEggs INTEGER NOT NULL DEFAULT 0,
        assistedHatches INTEGER NOT NULL DEFAULT 0,
        hatchDate TEXT NOT NULL,
        notes TEXT,
        birdsCreated INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_hatch_records_clutchId ON hatch_records(clutchId);
    `);
    currentVersion = 6;
  }

  if (currentVersion === 6) {
    await db.execAsync(`
      ALTER TABLE birds ADD COLUMN tagId TEXT;
      ALTER TABLE flocks ADD COLUMN species TEXT;
      ALTER TABLE flocks ADD COLUMN breed TEXT;
      ALTER TABLE flocks ADD COLUMN purpose TEXT;
      ALTER TABLE flocks ADD COLUMN notes TEXT;

      CREATE INDEX IF NOT EXISTS idx_birds_tagId ON birds(tagId);
    `);
    currentVersion = 7;
  }

  if (currentVersion === 7) {
    await db.execAsync(`
      ALTER TABLE egg_records ADD COLUMN time TEXT;
    `);
    currentVersion = 8;
  }

  if (currentVersion === 8) {
    await db.execAsync(`
      CREATE TABLE health_records_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        birdId INTEGER REFERENCES birds(id) ON DELETE CASCADE,
        flockId INTEGER REFERENCES flocks(id) ON DELETE SET NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        notes TEXT,
        medicine TEXT,
        dosage TEXT,
        startDate TEXT,
        endDate TEXT,
        time TEXT,
        veterinarian TEXT,
        cost REAL,
        reminderDate TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        notificationId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      INSERT INTO health_records_new
        (id, birdId, flockId, type, title, notes, medicine, dosage, startDate, endDate, time, veterinarian, cost, reminderDate, status, notificationId, createdAt, updatedAt)
      SELECT
        id, birdId, NULL, type, title, notes, medicine, dosage, startDate, endDate, NULL, veterinarian, cost, reminderDate, status, notificationId, createdAt, updatedAt
      FROM health_records;

      DROP TABLE health_records;
      ALTER TABLE health_records_new RENAME TO health_records;

      CREATE INDEX IF NOT EXISTS idx_health_records_birdId ON health_records(birdId);
      CREATE INDEX IF NOT EXISTS idx_health_records_flockId ON health_records(flockId);
      CREATE INDEX IF NOT EXISTS idx_health_records_type ON health_records(type);
      CREATE INDEX IF NOT EXISTS idx_health_records_status ON health_records(status);
      CREATE INDEX IF NOT EXISTS idx_health_records_startDate ON health_records(startDate);
      CREATE INDEX IF NOT EXISTS idx_health_records_reminderDate ON health_records(reminderDate);
    `);
    currentVersion = 9;
  }

  if (currentVersion === 9) {
    await db.execAsync(`
      ALTER TABLE health_records ADD COLUMN documentUri TEXT;
    `);
    currentVersion = 10;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
