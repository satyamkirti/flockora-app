import { FeedType } from '../types/feed';

export type FeedTypeOption = {
  key: FeedType;
  label: string;
  icon: string;
};

export const feedTypeOptions: FeedTypeOption[] = [
  { key: 'starter', label: 'Starter', icon: '🐣' },
  { key: 'grower', label: 'Grower', icon: '🌱' },
  { key: 'layer', label: 'Layer', icon: '🥚' },
  { key: 'scratch', label: 'Scratch Grain', icon: '🌾' },
  { key: 'pellets', label: 'Pellets', icon: '🟤' },
  { key: 'crumbles', label: 'Crumbles', icon: '🟡' },
  { key: 'mixed_grain', label: 'Mixed Grain', icon: '🌽' },
  { key: 'supplement', label: 'Supplement', icon: '💊' },
  { key: 'treats', label: 'Treats', icon: '🍬' },
  { key: 'other', label: 'Other', icon: '📦' },
];

export const feedTypeByKey = (key: FeedType): FeedTypeOption =>
  feedTypeOptions.find((option) => option.key === key) ?? feedTypeOptions[feedTypeOptions.length - 1];
