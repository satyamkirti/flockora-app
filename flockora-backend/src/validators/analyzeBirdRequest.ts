import { z } from 'zod';
import { SPECIES_HINTS } from '../types/analyzeBird';
import { ApiError } from '../utils/ApiError';

const speciesHintSchema = z.enum(SPECIES_HINTS as [string, ...string[]]).optional();

/** Validates the optional `speciesHint` form field. Throws a safe 400 ApiError on bad input. */
export function parseSpeciesHint(rawValue: unknown): (typeof SPECIES_HINTS)[number] | undefined {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return undefined;
  }
  const result = speciesHintSchema.safeParse(rawValue);
  if (!result.success) {
    throw new ApiError(400, 'INVALID_SPECIES_HINT', `speciesHint must be one of: ${SPECIES_HINTS.join(', ')}`);
  }
  return result.data as (typeof SPECIES_HINTS)[number] | undefined;
}
