export type EggRecord = {
  id: number;
  flockId: number | null;
  birdId: number | null;
  date: string;
  time: string | null;
  totalEggs: number;
  fertileEggs: number;
  crackedEggs: number;
  dirtyEggs: number;
  doubleYolkEggs: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EggRecordInput = {
  flockId: number | null;
  birdId: number | null;
  date: string;
  time: string | null;
  totalEggs: number;
  fertileEggs: number;
  crackedEggs: number;
  dirtyEggs: number;
  doubleYolkEggs: number;
  notes: string | null;
};

export type EggProductionPoint = {
  date: string;
  total: number;
};

export type EggMonthlyPoint = {
  monthLabel: string;
  total: number;
};

export type EggBestDay = {
  date: string;
  total: number;
};

export type EggStatistics = {
  totalEggs: number;
  fertilePercent: number;
  crackedPercent: number;
  dirtyPercent: number;
  doubleYolkPercent: number;
  bestDay: EggBestDay | null;
};

export type EggDashboardSummary = {
  todayTotal: number;
  weekTotal: number;
  monthTotal: number;
  averagePerDay: number;
  bestDay: EggBestDay | null;
};

export type EggRecordFilters = {
  searchText: string;
  flockId: number | null;
  date: string;
};

const currentTimeValue = (): string => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

export const createEmptyEggRecordInput = (): EggRecordInput => ({
  flockId: null,
  birdId: null,
  date: new Date().toISOString().slice(0, 10),
  time: currentTimeValue(),
  totalEggs: 0,
  fertileEggs: 0,
  crackedEggs: 0,
  dirtyEggs: 0,
  doubleYolkEggs: 0,
  notes: null,
});

export const emptyEggRecordFilters: EggRecordFilters = {
  searchText: '',
  flockId: null,
  date: '',
};
