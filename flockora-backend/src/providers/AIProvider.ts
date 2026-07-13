import { AnalyzeBirdResult, SpeciesHint } from '../types/analyzeBird';

export type AnalyzeBirdInput = {
  /** Validated MIME type of the uploaded photo. The raw file bytes are never passed to or
   *  retained by a provider implementation in this sprint — only size/type metadata. */
  mimeType: string;
  sizeBytes: number;
  speciesHint?: SpeciesHint;
};

/**
 * The one contract every AI provider must implement. The route layer only ever depends on
 * this interface, never on a concrete provider — swapping MockAIProvider for a real provider
 * (GeminiProvider, OpenAIProvider, ...) in a future sprint requires no change to
 * src/routes/analyzeBird.ts and no change to the mobile client's API contract.
 */
export interface AIProvider {
  readonly name: string;
  analyzeBird(input: AnalyzeBirdInput): Promise<AnalyzeBirdResult>;
}
