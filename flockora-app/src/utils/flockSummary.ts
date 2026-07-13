import { Bird } from '../types/bird';
import { classifyBirdSex } from './birdSex';

export type FlockSummary = {
  totalBirds: number;
  speciesCount: number;
  groupCount: number;
  maleCount: number;
  femaleCount: number;
  unknownCount: number;
  careAlertCount: number;
};

export function computeFlockSummary(birds: Bird[], groupCount: number, careAlertCount: number): FlockSummary {
  const speciesCount = new Set(birds.map((bird) => bird.species)).size;

  let maleCount = 0;
  let femaleCount = 0;
  let unknownCount = 0;
  for (const bird of birds) {
    const classified = classifyBirdSex(bird.sex);
    if (classified === 'male') {
      maleCount += 1;
    } else if (classified === 'female') {
      femaleCount += 1;
    } else {
      unknownCount += 1;
    }
  }

  return {
    totalBirds: birds.length,
    speciesCount,
    groupCount,
    maleCount,
    femaleCount,
    unknownCount,
    careAlertCount,
  };
}
