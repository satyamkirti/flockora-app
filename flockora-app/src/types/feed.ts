export type FeedType =
  | 'starter'
  | 'grower'
  | 'layer'
  | 'scratch'
  | 'pellets'
  | 'crumbles'
  | 'mixed_grain'
  | 'supplement'
  | 'treats'
  | 'other';

export type FeedItem = {
  id: number;
  name: string;
  feedType: FeedType;
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

export type FeedItemInput = {
  name: string;
  feedType: FeedType;
  brand: string | null;
  quantity: number;
  unit: string;
  lowStockThreshold: number | null;
  costPerUnit: number | null;
  purchaseDate: string | null;
  expiryDate: string | null;
  notes: string | null;
};

export type FeedLog = {
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

export type FeedLogInput = {
  feedItemId: number;
  flockId: number | null;
  birdId: number | null;
  quantityUsed: number;
  unit: string;
  date: string;
  notes: string | null;
};

export type FeedStockState = 'ok' | 'low' | 'out';
export type FeedExpiryState = 'none' | 'ok' | 'expiring' | 'expired';

export type FeedQuantityByUnit = {
  unit: string;
  total: number;
};

export type FeedStatistics = {
  usedToday: FeedQuantityByUnit[];
  usedThisWeek: FeedQuantityByUnit[];
  usedThisMonth: FeedQuantityByUnit[];
  currentStockByUnit: FeedQuantityByUnit[];
  estimatedCost: number;
  averageDailyUsage: FeedQuantityByUnit[];
};

export type FeedDashboardSummary = {
  lowStockCount: number;
  outOfStockCount: number;
  usedTodayByUnit: FeedQuantityByUnit[];
  expiringSoonCount: number;
};

export type FeedLogFilters = {
  feedItemId: number | null;
  flockId: number | null;
  birdId: number | null;
  date: string;
};

export const createEmptyFeedItemInput = (): FeedItemInput => ({
  name: '',
  feedType: 'layer',
  brand: null,
  quantity: 0,
  unit: 'kg',
  lowStockThreshold: null,
  costPerUnit: null,
  purchaseDate: new Date().toISOString().slice(0, 10),
  expiryDate: null,
  notes: null,
});

export const createEmptyFeedLogInput = (feedItemId: number, unit: string): FeedLogInput => ({
  feedItemId,
  flockId: null,
  birdId: null,
  quantityUsed: 0,
  unit,
  date: new Date().toISOString().slice(0, 10),
  notes: null,
});

export const emptyFeedLogFilters: FeedLogFilters = {
  feedItemId: null,
  flockId: null,
  birdId: null,
  date: '',
};
