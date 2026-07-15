/**
 * Flockora's official website is https://flockora.com. `PRIVACY_POLICY_URL` is the confirmed,
 * final intended location of Flockora's privacy policy — https://flockora.com/privacy — but as
 * of 2026-07-15 that page is NOT yet live/published. `PRIVACY_POLICY_URL_IS_PLACEHOLDER` must
 * stay `true` (so `SettingsScreen` keeps showing its honest "not yet published" fallback instead
 * of opening a dead link) until the page is confirmed live, at which point flip this to `false`.
 * Do not flip this based on the URL being *decided* — only flip it once the page is *reachable*.
 */
export const PRIVACY_POLICY_URL_IS_PLACEHOLDER = true;
export const PRIVACY_POLICY_URL = 'https://flockora.com/privacy';
