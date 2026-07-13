import { SpeciesKey } from './onboarding';

export type BreedingPairStatus = 'active' | 'separated' | 'retired';

export type BreedingPair = {
  id: number;
  maleBirdId: number;
  femaleBirdId: number;
  pairName: string | null;
  pairedDate: string;
  separatedDate: string | null;
  status: BreedingPairStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BreedingPairInput = {
  maleBirdId: number;
  femaleBirdId: number;
  pairName: string | null;
  pairedDate: string;
  separatedDate: string | null;
  status: BreedingPairStatus;
  notes: string | null;
};

export type IncubationType = 'natural' | 'incubator';
export type ClutchStatus = 'active' | 'hatched' | 'failed' | 'cancelled';
export type IncubationPhase = 'incubating' | 'due_soon' | 'hatch_due' | 'overdue' | 'completed';

export type Clutch = {
  id: number;
  breedingPairId: number | null;
  flockId: number | null;
  clutchName: string | null;
  laidDate: string;
  totalEggs: number;
  incubationType: IncubationType;
  incubatorName: string | null;
  incubationStartDate: string | null;
  expectedHatchDate: string | null;
  actualHatchDate: string | null;
  status: ClutchStatus;
  notes: string | null;
  candlingNotificationId: string | null;
  hatchExpectedNotificationId: string | null;
  hatchDueNotificationId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClutchInput = {
  breedingPairId: number | null;
  flockId: number | null;
  clutchName: string | null;
  laidDate: string;
  totalEggs: number;
  incubationType: IncubationType;
  incubatorName: string | null;
  incubationStartDate: string | null;
  expectedHatchDate: string | null;
  actualHatchDate: string | null;
  status: ClutchStatus;
  notes: string | null;
};

export type CandlingRecord = {
  id: number;
  clutchId: number;
  date: string;
  fertileEggs: number;
  infertileEggs: number;
  uncertainEggs: number;
  deadEmbryos: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CandlingRecordInput = {
  clutchId: number;
  date: string;
  fertileEggs: number;
  infertileEggs: number;
  uncertainEggs: number;
  deadEmbryos: number;
  notes: string | null;
};

export type HatchRecord = {
  id: number;
  clutchId: number;
  hatchedEggs: number;
  failedEggs: number;
  assistedHatches: number;
  hatchDate: string;
  notes: string | null;
  birdsCreated: boolean;
  createdAt: string;
  updatedAt: string;
};

export type HatchRecordInput = {
  clutchId: number;
  hatchedEggs: number;
  failedEggs: number;
  assistedHatches: number;
  hatchDate: string;
  notes: string | null;
};

export type ClutchFertilitySummary = {
  fertileEggs: number;
  infertileEggs: number;
  uncertainEggs: number;
  deadEmbryos: number;
  fertilityRatePercent: number;
};

export type ClutchHatchSummary = {
  hatchedEggs: number;
  failedEggs: number;
  assistedHatches: number;
  hatchRatePercent: number;
  hatchabilityOfFertilePercent: number | null;
};

export type BreedingStatistics = {
  totalClutches: number;
  totalEggsIncubated: number;
  fertilityRatePercent: number;
  hatchRatePercent: number;
  hatchabilityOfFertilePercent: number;
  successfulHatches: number;
};

export type BreedingDashboardSummary = {
  activePairs: number;
  activeClutches: number;
  eggsIncubating: number;
  hatchesDueSoon: number;
  overdueHatches: number;
};

export type BreedingHubSummary = BreedingDashboardSummary & {
  recentHatchCount: number;
};

export type ClutchFilters = {
  species: SpeciesKey | null;
  breedingPairId: number | null;
  status: ClutchStatus | null;
  date: string;
};

export const createEmptyBreedingPairInput = (): BreedingPairInput => ({
  maleBirdId: 0,
  femaleBirdId: 0,
  pairName: null,
  pairedDate: new Date().toISOString().slice(0, 10),
  separatedDate: null,
  status: 'active',
  notes: null,
});

export const createEmptyClutchInput = (): ClutchInput => ({
  breedingPairId: null,
  flockId: null,
  clutchName: null,
  laidDate: new Date().toISOString().slice(0, 10),
  totalEggs: 0,
  incubationType: 'natural',
  incubatorName: null,
  incubationStartDate: null,
  expectedHatchDate: null,
  actualHatchDate: null,
  status: 'active',
  notes: null,
});

export const createEmptyCandlingRecordInput = (clutchId: number): CandlingRecordInput => ({
  clutchId,
  date: new Date().toISOString().slice(0, 10),
  fertileEggs: 0,
  infertileEggs: 0,
  uncertainEggs: 0,
  deadEmbryos: 0,
  notes: null,
});

export const createEmptyHatchRecordInput = (clutchId: number): HatchRecordInput => ({
  clutchId,
  hatchedEggs: 0,
  failedEggs: 0,
  assistedHatches: 0,
  hatchDate: new Date().toISOString().slice(0, 10),
  notes: null,
});

export const emptyClutchFilters: ClutchFilters = {
  species: null,
  breedingPairId: null,
  status: null,
  date: '',
};
