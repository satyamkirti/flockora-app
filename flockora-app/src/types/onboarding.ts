export type ConfidenceLevel = 'HIGH' | 'LIKELY' | 'UNSURE';

export type SpeciesKey =
  | 'chicken'
  | 'quail'
  | 'duck'
  | 'turkey'
  | 'goose'
  | 'guinea_fowl'
  | 'pheasant'
  | 'peafowl';

export type PurposeKey =
  | 'everyday_care'
  | 'egg_production'
  | 'hatching'
  | 'breeding'
  | 'showing';

export type AIField<T = string> = {
  value: T;
  confidence: ConfidenceLevel;
};

export type AIAnalysisResult = {
  breed: AIField;
  sex: AIField;
  color: AIField;
  lifeStage: AIField;
};

export type BirdDraft = {
  name: string;
  photoCaptured: boolean;
  aiAnalysis: AIAnalysisResult | null;
  confirmedBreed: string;
  confirmedSex: string;
  confirmedColor: string;
  confirmedLifeStage: string;
};

export const createEmptyBirdDraft = (): BirdDraft => ({
  name: '',
  photoCaptured: false,
  aiAnalysis: null,
  confirmedBreed: '',
  confirmedSex: '',
  confirmedColor: '',
  confirmedLifeStage: '',
});
