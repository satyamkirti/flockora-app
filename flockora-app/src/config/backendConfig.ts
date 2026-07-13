import Constants from 'expo-constants';

/**
 * Single centralized point that resolves the Flockora backend's base URL. No secret of any
 * kind belongs here or is ever read here — this only resolves a non-sensitive network
 * address, per SECURITY.md Rules 1, 2, 5.
 *
 * Resolution order:
 *   1. EXPO_PUBLIC_BACKEND_URL, if set — an explicit override (e.g. a staging/production
 *      backend URL). This is safe to expose via EXPO_PUBLIC_* because a base URL is not a
 *      secret; the backend itself enforces its own auth/validation on every request.
 *   2. Derived from Constants.expoConfig.hostUri — the Metro dev-server host Expo Go/dev
 *      builds already know about. On a physical device, "localhost" refers to the phone
 *      itself, not the developer's machine, so this derives the developer machine's LAN IP
 *      instead (the same host the phone is already using to load the JS bundle).
 *   3. Falls back to localhost — only correct for a simulator/emulator or web preview running
 *      on the same machine as the backend.
 */
const DEFAULT_BACKEND_PORT = 8787;

function deriveDevHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) {
    return null;
  }
  const host = hostUri.split(':')[0];
  return host || null;
}

export function getBackendBaseUrl(): string {
  const explicitUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (explicitUrl) {
    return explicitUrl.replace(/\/+$/, '');
  }

  const devHost = deriveDevHost();
  if (devHost) {
    return `http://${devHost}:${DEFAULT_BACKEND_PORT}`;
  }

  return `http://localhost:${DEFAULT_BACKEND_PORT}`;
}
