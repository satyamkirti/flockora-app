import { SpeciesKey } from '../types/onboarding';

export const incubationPeriodDaysBySpecies: Record<SpeciesKey, number> = {
  chicken: 21,
  quail: 17,
  duck: 28,
  turkey: 28,
  goose: 30,
  guinea_fowl: 27,
  pheasant: 24,
  peafowl: 28,
};

export const getIncubationPeriodDays = (species: SpeciesKey): number => incubationPeriodDaysBySpecies[species];
