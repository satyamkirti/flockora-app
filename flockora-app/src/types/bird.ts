import { SpeciesKey } from './onboarding';

export type WeightUnit = 'kg' | 'lb';

export type Bird = {
  id: number;
  name: string;
  species: SpeciesKey;
  breed: string | null;
  sex: string | null;
  dateOfBirth: string | null;
  ageEstimate: string | null;
  acquisitionDate: string | null;
  color: string | null;
  weight: number | null;
  weightUnit: WeightUnit | null;
  notes: string | null;
  photoUri: string | null;
  isActive: boolean;
  flockId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type BirdInput = {
  name: string;
  species: SpeciesKey;
  breed: string | null;
  sex: string | null;
  dateOfBirth: string | null;
  ageEstimate: string | null;
  acquisitionDate: string | null;
  color: string | null;
  weight: number | null;
  weightUnit: WeightUnit | null;
  notes: string | null;
  photoUri: string | null;
  isActive: boolean;
  flockId: number | null;
};

export const createEmptyBirdInput = (): BirdInput => ({
  name: '',
  species: 'chicken',
  breed: null,
  sex: null,
  dateOfBirth: null,
  ageEstimate: null,
  acquisitionDate: null,
  color: null,
  weight: null,
  weightUnit: 'kg',
  notes: null,
  photoUri: null,
  isActive: true,
  flockId: null,
});
