import { TaskType } from '../types/task';

export type TaskTypeOption = {
  key: TaskType;
  label: string;
  icon: string;
};

export const taskTypeOptions: TaskTypeOption[] = [
  { key: 'feed', label: 'Feed', icon: '🌾' },
  { key: 'water', label: 'Water', icon: '💧' },
  { key: 'medicine', label: 'Medicine', icon: '💊' },
  { key: 'vaccination', label: 'Vaccination', icon: '💉' },
  { key: 'coop_open', label: 'Coop Open', icon: '🌅' },
  { key: 'coop_close', label: 'Coop Close', icon: '🌇' },
  { key: 'egg_collection', label: 'Egg Collection', icon: '🥚' },
  { key: 'cleaning', label: 'Cleaning', icon: '🧹' },
  { key: 'custom', label: 'Custom', icon: '📝' },
];

export const taskTypeByKey = (key: TaskType): TaskTypeOption =>
  taskTypeOptions.find((option) => option.key === key) ?? taskTypeOptions[taskTypeOptions.length - 1];
