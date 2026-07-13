import { AIProvider, AnalyzeBirdInput } from './AIProvider';
import { AnalyzeBirdResult, SpeciesHint } from '../types/analyzeBird';

/**
 * Deterministic, offline mock — no network call, no paid API, no real image analysis.
 * Exists purely to validate the request/response architecture end-to-end (upload →
 * validation → provider → response) before any real, billable AI provider is introduced.
 * It never reads or retains the uploaded file's bytes, only its already-validated
 * mimeType/sizeBytes metadata.
 */
const RESULTS_BY_SPECIES: Record<SpeciesHint, AnalyzeBirdResult> = {
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

const DEFAULT_SPECIES: SpeciesHint = 'chicken';

export class MockAIProvider implements AIProvider {
  readonly name = 'mock';

  async analyzeBird(input: AnalyzeBirdInput): Promise<AnalyzeBirdResult> {
    const species = input.speciesHint ?? DEFAULT_SPECIES;
    return RESULTS_BY_SPECIES[species];
  }
}
