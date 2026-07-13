import { FlockPurpose } from '../types/flock';

export type FlockPurposeOption = {
  key: FlockPurpose;
  label: string;
  icon: string;
};

export const flockPurposeOptions: FlockPurposeOption[] = [
  { key: 'pets', label: 'Pets', icon: '🐾' },
  { key: 'eggs', label: 'Eggs', icon: '🥚' },
  { key: 'breeding', label: 'Breeding', icon: '🧬' },
  { key: 'meat', label: 'Meat', icon: '🍗' },
  { key: 'mixed', label: 'Mixed', icon: '🔀' },
  { key: 'other', label: 'Other', icon: '✨' },
];

export const flockPurposeByKey = (key: FlockPurpose | null): FlockPurposeOption | null =>
  key ? flockPurposeOptions.find((option) => option.key === key) ?? null : null;
