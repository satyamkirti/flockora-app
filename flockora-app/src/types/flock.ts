import { SpeciesKey } from './onboarding';

export type FlockPurpose = 'pets' | 'eggs' | 'breeding' | 'meat' | 'mixed' | 'other';

export type Flock = {
  id: number;
  name: string;
  species: SpeciesKey | null;
  breed: string | null;
  purpose: FlockPurpose | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FlockWithCount = Flock & {
  birdCount: number;
};

export type FlockInput = {
  name: string;
  species: SpeciesKey | null;
  breed: string | null;
  purpose: FlockPurpose | null;
  notes: string | null;
};

export const createEmptyFlockInput = (): FlockInput => ({
  name: '',
  species: null,
  breed: null,
  purpose: null,
  notes: null,
});
