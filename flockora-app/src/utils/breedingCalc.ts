import { Bird } from '../types/bird';
import {
  BreedingPair,
  CandlingRecord,
  Clutch,
  ClutchFertilitySummary,
  ClutchHatchSummary,
  HatchRecord,
  IncubationPhase,
} from '../types/breeding';
import { SpeciesKey } from '../types/onboarding';
import { startOfDay } from './taskSchedule';

const DAY_MS = 24 * 60 * 60 * 1000;

export function safePercent(numerator: number, denominator: number): number {
  if (!denominator || denominator <= 0) {
    return 0;
  }
  return (numerator / denominator) * 100;
}

export function getIncubationDaysElapsed(
  clutch: Pick<Clutch, 'incubationStartDate'>,
  referenceDate: Date = new Date()
): number | null {
  if (!clutch.incubationStartDate) {
    return null;
  }
  const start = startOfDay(new Date(clutch.incubationStartDate));
  const today = startOfDay(referenceDate);
  return Math.max(0, Math.round((today.getTime() - start.getTime()) / DAY_MS));
}

export function getIncubationDaysRemaining(
  clutch: Pick<Clutch, 'expectedHatchDate'>,
  referenceDate: Date = new Date()
): number | null {
  if (!clutch.expectedHatchDate) {
    return null;
  }
  const expected = startOfDay(new Date(clutch.expectedHatchDate));
  const today = startOfDay(referenceDate);
  return Math.round((expected.getTime() - today.getTime()) / DAY_MS);
}

export function getIncubationProgressPercent(
  clutch: Pick<Clutch, 'incubationStartDate' | 'expectedHatchDate'>,
  referenceDate: Date = new Date()
): number | null {
  if (!clutch.incubationStartDate || !clutch.expectedHatchDate) {
    return null;
  }
  const start = startOfDay(new Date(clutch.incubationStartDate)).getTime();
  const expected = startOfDay(new Date(clutch.expectedHatchDate)).getTime();
  const today = startOfDay(referenceDate).getTime();
  const totalSpan = expected - start;
  if (totalSpan <= 0) {
    return null;
  }
  const percent = ((today - start) / totalSpan) * 100;
  return Math.min(100, Math.max(0, percent));
}

export function getIncubationPhase(
  clutch: Pick<Clutch, 'status' | 'expectedHatchDate' | 'actualHatchDate'>,
  referenceDate: Date = new Date()
): IncubationPhase {
  if (clutch.status !== 'active' || clutch.actualHatchDate) {
    return 'completed';
  }
  const daysRemaining = getIncubationDaysRemaining(clutch, referenceDate);
  if (daysRemaining == null) {
    return 'incubating';
  }
  if (daysRemaining < 0) {
    return 'overdue';
  }
  if (daysRemaining === 0) {
    return 'hatch_due';
  }
  if (daysRemaining <= 3) {
    return 'due_soon';
  }
  return 'incubating';
}

export function computeClutchFertilitySummary(
  clutch: Pick<Clutch, 'totalEggs'>,
  latestCandling: CandlingRecord | null
): ClutchFertilitySummary | null {
  if (!latestCandling) {
    return null;
  }
  return {
    fertileEggs: latestCandling.fertileEggs,
    infertileEggs: latestCandling.infertileEggs,
    uncertainEggs: latestCandling.uncertainEggs,
    deadEmbryos: latestCandling.deadEmbryos,
    fertilityRatePercent: safePercent(latestCandling.fertileEggs, clutch.totalEggs),
  };
}

export function computeClutchHatchSummary(
  clutch: Pick<Clutch, 'totalEggs'>,
  hatchRecord: HatchRecord | null,
  latestCandling: CandlingRecord | null
): ClutchHatchSummary | null {
  if (!hatchRecord) {
    return null;
  }
  const hatchabilityOfFertilePercent =
    latestCandling && latestCandling.fertileEggs > 0
      ? safePercent(hatchRecord.hatchedEggs, latestCandling.fertileEggs)
      : null;
  return {
    hatchedEggs: hatchRecord.hatchedEggs,
    failedEggs: hatchRecord.failedEggs,
    assistedHatches: hatchRecord.assistedHatches,
    hatchRatePercent: safePercent(hatchRecord.hatchedEggs, clutch.totalEggs),
    hatchabilityOfFertilePercent,
  };
}

export const incubationPhaseLabels: Record<IncubationPhase, { label: string; tone: 'success' | 'warning' | 'neutral' }> = {
  incubating: { label: 'Incubating', tone: 'neutral' },
  due_soon: { label: 'Due Soon', tone: 'warning' },
  hatch_due: { label: 'Hatch Due', tone: 'warning' },
  overdue: { label: 'Overdue', tone: 'warning' },
  completed: { label: 'Completed', tone: 'success' },
};

export function deriveClutchSpecies(
  clutch: Pick<Clutch, 'breedingPairId' | 'flockId'>,
  pairs: BreedingPair[],
  birds: Bird[]
): SpeciesKey | null {
  if (clutch.breedingPairId != null) {
    const pair = pairs.find((candidate) => candidate.id === clutch.breedingPairId);
    if (pair) {
      const maleBird = birds.find((bird) => bird.id === pair.maleBirdId);
      if (maleBird) {
        return maleBird.species;
      }
      const femaleBird = birds.find((bird) => bird.id === pair.femaleBirdId);
      if (femaleBird) {
        return femaleBird.species;
      }
    }
  }

  if (clutch.flockId != null) {
    const flockBirds = birds.filter((bird) => bird.flockId === clutch.flockId);
    const counts = new Map<SpeciesKey, number>();
    flockBirds.forEach((bird) => counts.set(bird.species, (counts.get(bird.species) ?? 0) + 1));
    let best: SpeciesKey | null = null;
    let bestCount = 0;
    counts.forEach((count, species) => {
      if (count > bestCount) {
        best = species;
        bestCount = count;
      }
    });
    return best;
  }

  return null;
}
