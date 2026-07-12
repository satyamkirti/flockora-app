import { AIAnalysisResult, PurposeKey, SpeciesKey } from '../types/onboarding';

export type SpeciesOption = {
  key: SpeciesKey;
  label: string;
  icon: string;
  blurb: string;
};

export const speciesOptions: SpeciesOption[] = [
  { key: 'chicken', label: 'Chicken', icon: '🐔', blurb: 'Backyard flocks & layers' },
  { key: 'quail', label: 'Coturnix Quail', icon: '🐦', blurb: 'Compact, fast-cycling' },
  { key: 'duck', label: 'Duck', icon: '🦆', blurb: 'Ponds, eggs & foraging' },
  { key: 'turkey', label: 'Turkey', icon: '🦃', blurb: 'Heritage & broad breasted' },
  { key: 'goose', label: 'Goose', icon: '🪿', blurb: 'Grazers & guardians' },
  { key: 'guinea_fowl', label: 'Guinea Fowl', icon: '🐓', blurb: 'Pest control & alarm calls' },
  { key: 'pheasant', label: 'Pheasant', icon: '🐦', blurb: 'Game bird keeping' },
  { key: 'peafowl', label: 'Peafowl', icon: '🦚', blurb: 'Ornamental & showy' },
];

export type PurposeOption = {
  key: PurposeKey;
  label: string;
  icon: string;
  blurb: string;
};

export const purposeOptions: PurposeOption[] = [
  { key: 'everyday_care', label: 'Everyday Care', icon: '🏡', blurb: 'Feeding, health & daily routines' },
  { key: 'egg_production', label: 'Egg Production', icon: '🥚', blurb: 'Track laying & collection' },
  { key: 'hatching', label: 'Hatching & Incubation', icon: '🐣', blurb: 'Incubator batches & candling' },
  { key: 'breeding', label: 'Breeding & Lineage', icon: '🧬', blurb: 'Pairings, sires & dams' },
  { key: 'showing', label: 'Showing & Exhibition', icon: '🏆', blurb: 'Condition for the show table' },
];

export const speciesByKey = (key: SpeciesKey): SpeciesOption =>
  speciesOptions.find((option) => option.key === key) ?? speciesOptions[0];

export const purposeByKey = (key: PurposeKey): PurposeOption =>
  purposeOptions.find((option) => option.key === key) ?? purposeOptions[0];

const mockAIAnalysisBySpecies: Record<SpeciesKey, AIAnalysisResult> = {
  chicken: {
    breed: { value: 'Rhode Island Red', confidence: 'LIKELY' },
    sex: { value: 'Hen', confidence: 'HIGH' },
    color: { value: 'Reddish-brown with dark tail feathers', confidence: 'HIGH' },
    lifeStage: { value: 'Adult', confidence: 'LIKELY' },
  },
  quail: {
    breed: { value: 'Pharaoh Coturnix', confidence: 'LIKELY' },
    sex: { value: 'Female', confidence: 'UNSURE' },
    color: { value: 'Mottled brown speckling', confidence: 'HIGH' },
    lifeStage: { value: 'Adult', confidence: 'HIGH' },
  },
  duck: {
    breed: { value: 'Pekin', confidence: 'HIGH' },
    sex: { value: 'Female', confidence: 'LIKELY' },
    color: { value: 'White with an orange bill', confidence: 'HIGH' },
    lifeStage: { value: 'Adult', confidence: 'LIKELY' },
  },
  turkey: {
    breed: { value: 'Broad Breasted White', confidence: 'LIKELY' },
    sex: { value: 'Hen', confidence: 'UNSURE' },
    color: { value: 'White plumage', confidence: 'HIGH' },
    lifeStage: { value: 'Juvenile', confidence: 'UNSURE' },
  },
  goose: {
    breed: { value: 'Embden', confidence: 'LIKELY' },
    sex: { value: 'Gander', confidence: 'UNSURE' },
    color: { value: 'White', confidence: 'HIGH' },
    lifeStage: { value: 'Adult', confidence: 'LIKELY' },
  },
  guinea_fowl: {
    breed: { value: 'Pearl Guinea', confidence: 'LIKELY' },
    sex: { value: 'Unclear from photo', confidence: 'UNSURE' },
    color: { value: 'Pearled grey with white dots', confidence: 'HIGH' },
    lifeStage: { value: 'Adult', confidence: 'LIKELY' },
  },
  pheasant: {
    breed: { value: 'Ring-necked Pheasant', confidence: 'LIKELY' },
    sex: { value: 'Male', confidence: 'HIGH' },
    color: { value: 'Copper and green iridescent plumage', confidence: 'HIGH' },
    lifeStage: { value: 'Adult', confidence: 'LIKELY' },
  },
  peafowl: {
    breed: { value: 'Indian Blue Peafowl', confidence: 'HIGH' },
    sex: { value: 'Male', confidence: 'HIGH' },
    color: { value: 'Iridescent blue-green', confidence: 'HIGH' },
    lifeStage: { value: 'Adult', confidence: 'LIKELY' },
  },
};

export const getMockAIAnalysis = (species: SpeciesKey): AIAnalysisResult => mockAIAnalysisBySpecies[species];

export const aiAnalysisStatusMessages = [
  'Detecting species…',
  'Comparing markings…',
  'Estimating life stage…',
  'Preparing your results…',
];
