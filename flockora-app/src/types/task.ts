export type TaskType =
  | 'feed'
  | 'water'
  | 'medicine'
  | 'vaccination'
  | 'deworming'
  | 'supplement'
  | 'health_check'
  | 'injury_care'
  | 'coop_open'
  | 'coop_close'
  | 'egg_collection'
  | 'cleaning'
  | 'custom';

export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly';

export type Task = {
  id: number;
  birdId: number | null;
  flockId: number | null;
  type: TaskType;
  title: string;
  description: string | null;
  dueDate: string;
  repeatType: RepeatType;
  completed: boolean;
  completedAt: string | null;
  notificationEnabled: boolean;
  notificationId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskInput = {
  birdId: number | null;
  flockId: number | null;
  type: TaskType;
  title: string;
  description: string | null;
  dueDate: string;
  repeatType: RepeatType;
  notificationEnabled: boolean;
};

export type TaskStats = {
  todayTotal: number;
  completedToday: number;
  pendingToday: number;
  overdueCount: number;
};

export const createEmptyTaskInput = (): TaskInput => ({
  birdId: null,
  flockId: null,
  type: 'feed',
  title: '',
  description: null,
  dueDate: new Date().toISOString(),
  repeatType: 'none',
  notificationEnabled: false,
});
