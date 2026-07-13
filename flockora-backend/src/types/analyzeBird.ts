export type SpeciesHint = 'chicken' | 'quail' | 'duck' | 'turkey' | 'goose' | 'guinea_fowl' | 'pheasant' | 'peafowl';

export const SPECIES_HINTS: readonly SpeciesHint[] = [
  'chicken',
  'quail',
  'duck',
  'turkey',
  'goose',
  'guinea_fowl',
  'pheasant',
  'peafowl',
];

export type ConfidenceLevel = 'HIGH' | 'LIKELY' | 'UNSURE';

export type AIField<T = string> = {
  value: T;
  confidence: ConfidenceLevel;
};

/**
 * Deliberately mirrors the shape of AIAnalysisResult in flockora-app/src/types/onboarding.ts.
 * Keeping the response contract identical to what the client already models means that when
 * the client is wired up to this backend in a future sprint, it is a drop-in data source
 * swap rather than a client-side type/UI rework.
 */
export type AnalyzeBirdResult = {
  breed: AIField;
  sex: AIField;
  color: AIField;
  lifeStage: AIField;
};
