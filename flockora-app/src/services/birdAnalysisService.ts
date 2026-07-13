import { getBackendBaseUrl } from '../config/backendConfig';
import { AIAnalysisResult, CapturedPhoto, SpeciesKey } from '../types/onboarding';

/**
 * The ONLY networking code involved in bird photo analysis. Screens never build FormData or
 * call fetch directly — they call analyzeBirdPhoto() and render one of these outcomes.
 *
 * This calls Flockora's own backend (POST /api/v1/analyze-bird) exclusively. Per SECURITY.md
 * Rules 3 and 4, this file must never call Gemini, OpenAI, Claude, or any other AI provider
 * directly, and never holds or reads any AI-provider API key — the backend is the only
 * allowed gateway, and today it responds using its own MockAIProvider (no real provider,
 * no paid API call, anywhere in this request path).
 */

export type BirdAnalysisErrorKind =
  | 'invalid_image'
  | 'payload_too_large'
  | 'rate_limited'
  | 'timeout'
  | 'network'
  | 'server_error'
  | 'unknown';

export type BirdAnalysisOutcome =
  | { status: 'success'; result: AIAnalysisResult }
  | { status: 'error'; kind: BirdAnalysisErrorKind; message: string };

export type AnalyzeBirdPhotoInput = {
  photo: CapturedPhoto;
  speciesHint?: SpeciesKey;
};

const REQUEST_TIMEOUT_MS = 20000;

const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';

/** Maps the backend's safe, client-facing error `code` (see flockora-backend's ApiError
 *  usages) to a UI-relevant error kind. Falls back to HTTP status when `code` is unavailable
 *  (e.g. a network-level failure with no response body at all). */
function classifyError(statusCode: number | null, code: string | undefined): BirdAnalysisErrorKind {
  if (code === 'RATE_LIMITED' || statusCode === 429) {
    return 'rate_limited';
  }
  if (code === 'FILE_TOO_LARGE') {
    return 'payload_too_large';
  }
  if (code === 'MISSING_FILE' || code === 'INVALID_FILE_TYPE' || code === 'INVALID_SPECIES_HINT') {
    return 'invalid_image';
  }
  if (code === 'REQUEST_TIMEOUT' || statusCode === 504) {
    return 'timeout';
  }
  if (statusCode === null) {
    return 'network';
  }
  if (statusCode >= 500) {
    return 'server_error';
  }
  return 'unknown';
}

async function readSafeErrorBody(response: Response): Promise<{ code?: string; message?: string }> {
  try {
    const data = await response.json();
    return {
      code: typeof data?.code === 'string' ? data.code : undefined,
      message: typeof data?.message === 'string' ? data.message : undefined,
    };
  } catch {
    // Response wasn't valid JSON — fall through to a generic message. Nothing is logged.
    return {};
  }
}

export async function analyzeBirdPhoto(input: AnalyzeBirdPhotoInput): Promise<BirdAnalysisOutcome> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const formData = new FormData();
    // React Native's FormData accepts this { uri, name, type } shape as a file part.
    formData.append('photo', {
      uri: input.photo.uri,
      name: input.photo.fileName,
      type: input.photo.mimeType,
    } as unknown as Blob);
    if (input.speciesHint) {
      formData.append('speciesHint', input.speciesHint);
    }

    const response = await fetch(`${getBackendBaseUrl()}/api/v1/analyze-bird`, {
      method: 'POST',
      body: formData,
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (response.ok) {
      const data = await response.json();
      return { status: 'success', result: data.result as AIAnalysisResult };
    }

    const { code, message } = await readSafeErrorBody(response);
    return { status: 'error', kind: classifyError(response.status, code), message: message ?? DEFAULT_ERROR_MESSAGE };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        status: 'error',
        kind: 'timeout',
        message: 'The analysis is taking longer than expected. Please try again.',
      };
    }
    return {
      status: 'error',
      kind: 'network',
      message: 'Could not reach the analysis service. Check your connection and try again.',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
