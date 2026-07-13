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

export type CapturedPhoto = {
  uri: string;
  mimeType: string;
  fileName: string;
};

export type BirdDraft = {
  name: string;
  photo: CapturedPhoto | null;
  aiAnalysis: AIAnalysisResult | null;
  confirmedBreed: string;
  confirmedSex: string;
  confirmedColor: string;
  confirmedLifeStage: string;
};

export const createEmptyBirdDraft = (): BirdDraft => ({
  name: '',
  photo: null,
  aiAnalysis: null,
  confirmedBreed: '',
  confirmedSex: '',
  confirmedColor: '',
  confirmedLifeStage: '',
});
