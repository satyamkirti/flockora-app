import { SQLiteDatabase } from 'expo-sqlite';
import {
  FeedDashboardSummary,
  FeedItem,
  FeedItemInput,
  FeedLog,
  FeedLogFilters,
  FeedLogInput,
  FeedQuantityByUnit,
  FeedStatistics,
  FeedType,
} from '../../types/feed';
import { startOfDay, toDateInputValue } from '../../utils/taskSchedule';
import { getFeedExpiryState, getFeedStockState } from '../../utils/feedStock';

export class InsufficientStockError extends Error {
  constructor(public feedName: string, public available: number, public unit: string) {
    super(`Not enough ${feedName} in stock. Only ${available} ${unit} available.`);
    this.name = 'InsufficientStockError';
  }
}

type FeedItemRow = {
  id: number;
  name: string;
  feedType: string;
  brand: string | null;
  quantity: number;
  unit: string;
  lowStockThreshold: number | null;
  costPerUnit: number | null;
  purchaseDate: string | null;
  expiryDate: string | null;
  notes: string | null;
  notificationId: string | null;
  createdAt: string;
  updatedAt: string;
};

type FeedLogRow = {
  id: number;
  feedItemId: number;
  flockId: number | null;
  birdId: number | null;
  quantityUsed: number;
  unit: string;
  date: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

const mapItemRow = (row: FeedItemRow): FeedItem => ({ ...row, feedType: row.feedType as FeedType });
const mapLogRow = (row: FeedLogRow): FeedLog => ({ ...row });

async function getFeedItemById(db: SQLiteDatabase, id: number): Promise<FeedItem | null> {
  const row = await db.getFirstAsync<FeedItemRow>('SELECT * FROM feed_items WHERE id = ?', [id]);
  return row ? mapItemRow(row) : null;
}

async function getFeedLogById(db: SQLiteDatabase, id: number): Promise<FeedLog | null> {
  const row = await db.getFirstAsync<FeedLogRow>('SELECT * FROM feed_logs WHERE id = ?', [id]);
  return row ? mapLogRow(row) : null;
}

async function listFeedItems(db: SQLiteDatabase): Promise<FeedItem[]> {
  const rows = await db.getAllAsync<FeedItemRow>('SELECT * FROM feed_items ORDER BY name COLLATE NOCASE ASC');
  return rows.map(mapItemRow);
}

async function listFeedLogs(db: SQLiteDatabase): Promise<FeedLog[]> {
  const rows = await db.getAllAsync<FeedLogRow>('SELECT * FROM feed_logs ORDER BY date DESC, createdAt DESC');
  return rows.map(mapLogRow);
}

async function setFeedItemQuantity(db: SQLiteDatabase, id: number, quantity: number): Promise<void> {
  await db.runAsync('UPDATE feed_items SET quantity = ?, updatedAt = ? WHERE id = ?', [
    quantity,
    new Date().toISOString(),
    id,
  ]);
}

function sumByUnit(entries: { unit: string; quantity: number }[]): FeedQuantityByUnit[] {
  const map = new Map<string, number>();
  entries.forEach((entry) => {
    map.set(entry.unit, (map.get(entry.unit) ?? 0) + entry.quantity);
  });
  return Array.from(map.entries()).map(([unit, total]) => ({ unit, total }));
}

export const feedRepository = {
  async getFeedItems(db: SQLiteDatabase): Promise<FeedItem[]> {
    return listFeedItems(db);
  },

  async getFeedItem(db: SQLiteDatabase, id: number): Promise<FeedItem | null> {
    return getFeedItemById(db, id);
  },

  async createFeedItem(db: SQLiteDatabase, input: FeedItemInput): Promise<FeedItem> {
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO feed_items
        (name, feedType, brand, quantity, unit, lowStockThreshold, costPerUnit, purchaseDate, expiryDate, notes, notificationId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
      [
        input.name,
        input.feedType,
        input.brand,
        input.quantity,
        input.unit,
        input.lowStockThreshold,
        input.costPerUnit,
        input.purchaseDate,
        input.expiryDate,
        input.notes,
        now,
        now,
      ]
    );
    const created = await getFeedItemById(db, result.lastInsertRowId);
    if (!created) {
      throw new Error('Feed item not found after create');
    }
    return created;
  },

  async updateFeedItem(db: SQLiteDatabase, id: number, input: FeedItemInput): Promise<FeedItem> {
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE feed_items SET
        name = ?, feedType = ?, brand = ?, quantity = ?, unit = ?, lowStockThreshold = ?,
        costPerUnit = ?, purchaseDate = ?, expiryDate = ?, notes = ?, updatedAt = ?
       WHERE id = ?`,
      [
        input.name,
        input.feedType,
        input.brand,
        input.quantity,
        input.unit,
        input.lowStockThreshold,
        input.costPerUnit,
        input.purchaseDate,
        input.expiryDate,
        input.notes,
        now,
        id,
      ]
    );
    const updated = await getFeedItemById(db, id);
    if (!updated) {
      throw new Error('Feed item not found after update');
    }
    return updated;
  },

  async deleteFeedItem(db: SQLiteDatabase, id: number): Promise<void> {
    await db.runAsync('DELETE FROM feed_items WHERE id = ?', [id]);
  },

  async setNotificationId(db: SQLiteDatabase, id: number, notificationId: string | null): Promise<void> {
    await db.runAsync('UPDATE feed_items SET notificationId = ? WHERE id = ?', [notificationId, id]);
  },

  async getFeedLog(db: SQLiteDatabase, id: number): Promise<FeedLog | null> {
    return getFeedLogById(db, id);
  },

  async addFeedLog(db: SQLiteDatabase, input: FeedLogInput): Promise<FeedLog> {
    let created: FeedLog | null = null;
    await db.withTransactionAsync(async () => {
      const item = await getFeedItemById(db, input.feedItemId);
      if (!item) {
        throw new Error('Feed item not found');
      }
      const nextQuantity = item.quantity - input.quantityUsed;
      if (nextQuantity < 0) {
        throw new InsufficientStockError(item.name, item.quantity, item.unit);
      }
      await setFeedItemQuantity(db, item.id, nextQuantity);

      const now = new Date().toISOString();
      const result = await db.runAsync(
        `INSERT INTO feed_logs (feedItemId, flockId, birdId, quantityUsed, unit, date, notes, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [input.feedItemId, input.flockId, input.birdId, input.quantityUsed, input.unit, input.date, input.notes, now, now]
      );
      created = await getFeedLogById(db, result.lastInsertRowId);
    });
    if (!created) {
      throw new Error('Feed log not found after create');
    }
    return created;
  },

  async updateFeedLog(db: SQLiteDatabase, id: number, input: FeedLogInput): Promise<FeedLog> {
    let updated: FeedLog | null = null;
    await db.withTransactionAsync(async () => {
      const existingLog = await getFeedLogById(db, id);
      if (!existingLog) {
        throw new Error('Feed log not found');
      }

      const oldItem = await getFeedItemById(db, existingLog.feedItemId);
      if (oldItem) {
        await setFeedItemQuantity(db, oldItem.id, oldItem.quantity + existingLog.quantityUsed);
      }

      const newItem = await getFeedItemById(db, input.feedItemId);
      if (!newItem) {
        throw new Error('Feed item not found');
      }
      const nextQuantity = newItem.quantity - input.quantityUsed;
      if (nextQuantity < 0) {
        throw new InsufficientStockError(newItem.name, newItem.quantity, newItem.unit);
      }
      await setFeedItemQuantity(db, newItem.id, nextQuantity);

      const now = new Date().toISOString();
      await db.runAsync(
        `UPDATE feed_logs SET
          feedItemId = ?, flockId = ?, birdId = ?, quantityUsed = ?, unit = ?, date = ?, notes = ?, updatedAt = ?
         WHERE id = ?`,
        [input.feedItemId, input.flockId, input.birdId, input.quantityUsed, input.unit, input.date, input.notes, now, id]
      );
      updated = await getFeedLogById(db, id);
    });
    if (!updated) {
      throw new Error('Feed log not found after update');
    }
    return updated;
  },

  async deleteFeedLog(db: SQLiteDatabase, id: number): Promise<void> {
    await db.withTransactionAsync(async () => {
      const existingLog = await getFeedLogById(db, id);
      if (!existingLog) {
        return;
      }
      const item = await getFeedItemById(db, existingLog.feedItemId);
      if (item) {
        await setFeedItemQuantity(db, item.id, item.quantity + existingLog.quantityUsed);
      }
      await db.runAsync('DELETE FROM feed_logs WHERE id = ?', [id]);
    });
  },

  async getFeedHistory(db: SQLiteDatabase, filters: FeedLogFilters): Promise<FeedLog[]> {
    const logs = await listFeedLogs(db);
    let filtered = logs;

    if (filters.feedItemId != null) {
      filtered = filtered.filter((log) => log.feedItemId === filters.feedItemId);
    }
    if (filters.flockId != null) {
      filtered = filtered.filter((log) => log.flockId === filters.flockId);
    }
    if (filters.birdId != null) {
      filtered = filtered.filter((log) => log.birdId === filters.birdId);
    }
    if (filters.date.trim()) {
      const query = filters.date.trim();
      filtered = filtered.filter((log) => log.date.startsWith(query));
    }

    return filtered;
  },

  async getLowStockItems(db: SQLiteDatabase): Promise<FeedItem[]> {
    const items = await listFeedItems(db);
    return items.filter((item) => getFeedStockState(item) === 'low');
  },

  async getOutOfStockItems(db: SQLiteDatabase): Promise<FeedItem[]> {
    const items = await listFeedItems(db);
    return items.filter((item) => getFeedStockState(item) === 'out');
  },

  async getExpiringFeedItems(db: SQLiteDatabase): Promise<FeedItem[]> {
    const items = await listFeedItems(db);
    return items.filter((item) => getFeedExpiryState(item) === 'expiring');
  },

  async getExpiredFeedItems(db: SQLiteDatabase): Promise<FeedItem[]> {
    const items = await listFeedItems(db);
    return items.filter((item) => getFeedExpiryState(item) === 'expired');
  },

  async getFeedStatistics(db: SQLiteDatabase): Promise<FeedStatistics> {
    const [items, logs] = await Promise.all([listFeedItems(db), listFeedLogs(db)]);
    const today = toDateInputValue(new Date());

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    const weekStartKey = toDateInputValue(weekStart);

    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartKey = toDateInputValue(monthStart);

    const todayLogs = logs.filter((log) => log.date === today);
    const weekLogs = logs.filter((log) => log.date >= weekStartKey && log.date <= today);
    const monthLogs = logs.filter((log) => log.date >= monthStartKey && log.date <= today);

    const toEntries = (entries: FeedLog[]) => entries.map((log) => ({ unit: log.unit, quantity: log.quantityUsed }));

    const usedToday = sumByUnit(toEntries(todayLogs));
    const usedThisWeek = sumByUnit(toEntries(weekLogs));
    const usedThisMonth = sumByUnit(toEntries(monthLogs));
    const currentStockByUnit = sumByUnit(items.map((item) => ({ unit: item.unit, quantity: item.quantity })));
    const estimatedCost = items.reduce((sum, item) => sum + item.quantity * (item.costPerUnit ?? 0), 0);

    let averageDailyUsage: FeedQuantityByUnit[] = [];
    if (logs.length > 0) {
      const sortedDates = logs.map((log) => log.date).sort();
      const firstDate = new Date(sortedDates[0]);
      const now = new Date();
      const daySpan =
        Math.round((startOfDay(now).getTime() - startOfDay(firstDate).getTime()) / (24 * 60 * 60 * 1000)) + 1;
      const totals = sumByUnit(toEntries(logs));
      averageDailyUsage = totals.map((entry) => ({ unit: entry.unit, total: entry.total / Math.max(1, daySpan) }));
    }

    return {
      usedToday,
      usedThisWeek,
      usedThisMonth,
      currentStockByUnit,
      estimatedCost,
      averageDailyUsage,
    };
  },

  async getDashboardSummary(db: SQLiteDatabase): Promise<FeedDashboardSummary> {
    const items = await listFeedItems(db);
    const today = toDateInputValue(new Date());
    const todayLogs = await db.getAllAsync<FeedLogRow>('SELECT * FROM feed_logs WHERE date = ?', [today]);

    const lowStockCount = items.filter((item) => getFeedStockState(item) === 'low').length;
    const outOfStockCount = items.filter((item) => getFeedStockState(item) === 'out').length;
    const expiringSoonCount = items.filter((item) => getFeedExpiryState(item) === 'expiring').length;
    const usedTodayByUnit = sumByUnit(todayLogs.map((log) => ({ unit: log.unit, quantity: log.quantityUsed })));

    return { lowStockCount, outOfStockCount, usedTodayByUnit, expiringSoonCount };
  },
};
