export type ClassifiedSex = 'male' | 'female' | 'unknown';

const FEMALE_TERMS = ['female', 'hen', 'pullet', 'peahen', 'doe'];
const MALE_TERMS = ['male', 'rooster', 'cockerel', 'cock', 'drake', 'gander', 'tom', 'peacock'];

export function classifyBirdSex(sex: string | null): ClassifiedSex {
  if (!sex) {
    return 'unknown';
  }
  const normalized = sex.trim().toLowerCase();
  if (FEMALE_TERMS.some((term) => normalized === term || normalized.includes(term))) {
    return 'female';
  }
  if (MALE_TERMS.some((term) => normalized === term || normalized.includes(term))) {
    return 'male';
  }
  return 'unknown';
}
