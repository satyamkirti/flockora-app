# Flockora Security Policy

**This document is a mandatory security policy for all future Flockora development.** It is not optional guidance. Every rule below applies to every human contributor and every AI coding agent working on this repository, regardless of how small the change appears.

This document reflects the findings of the security audit performed on 2026-07-13 against commit `18d25dd` on `main`, and the rules it defines exist specifically to keep the app's current clean security posture (see §Baseline below) intact as real backend, AI, and payment integrations are added.

Companion document: [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) — read both before making any architectural or security-sensitive change.

---

## Mandatory Rules

### 1. Never hardcode secrets in client-side code
No API key, token, password, credential, or private key may ever be written as a literal string, constant, or default value anywhere inside `flockora-app/src/`, `App.tsx`, `app.json`, or any other file that ships inside the compiled mobile app bundle. This includes "temporary" or "just for testing" hardcoding — it is never acceptable, not even behind a `__DEV__` check.

### 2. Never expose paid API secrets through `EXPO_PUBLIC_*` variables
Any environment variable prefixed `EXPO_PUBLIC_` is compiled directly into the client JavaScript bundle and is exactly as extractable as a hardcoded string. `EXPO_PUBLIC_*` is only acceptable for values that are safe to be fully public (e.g. a public analytics project ID). It must never be used for an API key, secret, or credential tied to billing, especially for any paid AI provider.

### 3. Never call paid AI APIs directly from the mobile client with a secret key
Gemini, OpenAI, Claude (Anthropic), or any other paid, metered, or billable API must never be called directly from React Native/Expo client code using a secret API key. A mobile app bundle is not a trusted execution environment — any key embedded in it, by any mechanism, can be extracted by unzipping the built APK/AAB and reading the JS bundle. This applies even if the call is made "just once for a prototype."

### 4. All paid AI requests must go through a secure backend
Every request to a paid AI provider must be proxied through a backend or serverless function that the mobile client calls without ever holding the provider's secret key itself. The backend is the only place the AI provider's API key may exist.

### 5. API secrets live only in secure server-side storage
Provider API keys, database credentials, and any other secret must exist only in: (a) server-side environment variables on the backend/serverless platform, or (b) a dedicated secrets manager (e.g. the hosting platform's built-in secrets store). They must never be committed to source control, written into `app.json`, or passed through any client-bundled configuration file.

### 6. Future backend endpoints require auth, authorization, input validation, and rate limiting
Any backend endpoint added to Flockora in the future must implement, as appropriate to what it does: authentication (verifying who is calling), authorization (verifying they're allowed to do what they're asking), input validation (rejecting malformed/malicious payloads before they reach business logic or a paid API), and rate limiting or abuse protection (especially for any endpoint that fans out to a paid AI API, where an unprotected endpoint directly becomes an unexpected billing event).

### 7. Add per-user and global usage controls for paid AI APIs
Once real AI integration exists, implement both per-user quotas (e.g. daily/monthly request caps per account) and a global usage ceiling (a circuit breaker that stops all AI calls if spend or volume crosses a defined threshold). This is the primary defense against API key theft, scripted abuse, and surprise bills — do not ship AI integration without it.

### 8. Never log sensitive information
Do not `console.log`, `console.warn`, `console.error`, remote-log, or otherwise output: API keys, authentication tokens, session identifiers, private user data, health or medical notes (medicine, dosage, veterinarian, symptom/health record text), or any other sensitive field. This applies to client code and any future backend/serverless logs alike. (The codebase is currently clean of all logging — keep it that way as features are added, don't introduce debug logging as a shortcut during development and forget to remove it.)

### 9. Never commit secrets of any kind to Git
`.env` files (bare `.env`, `.env.local`, `.env.production`, etc.), service-account JSON credentials, private keys (`.pem`, `.key`, `.jks`, `.p8`, `.p12`, `.mobileprovision`), and access tokens must never be committed. Before any `git add`/`git commit`, review what is being staged — a filename looking innocuous is not sufficient assurance. If a secret is ever committed, it must be treated as compromised (rotated at the provider, not just deleted from a future commit — git history retains it).

### 10. Sensitive health data requires review before production; current risk is documented, not fixed
Flockora's `health_records` table stores `medicine`, `dosage`, `veterinarian`, and free-text `notes` in a local SQLite database (`flockora.db`) with **no encryption at rest** (`expo-sqlite` default). This is a known, currently-accepted MEDIUM risk for a local-only, single-user, no-login app — it is **not** flagged as blocking today, but it **must** receive a dedicated security review (encryption at rest, e.g. SQLCipher, or migration of sensitive fields to `expo-secure-store`) before any production launch or before this data is ever synced off-device.

### 11. Cloud sync or authentication requires a dedicated data-access review first
Before adding cloud sync, multi-device support, or any authentication system (e.g. the Supabase Auth integration named in `PRODUCT_CONSTITUTION.md`), a separate, dedicated data-access and authorization security review must be performed — covering session handling, token storage, row-level security / per-user data isolation, and what happens to the existing local-only data model. This must not be bundled into a feature PR as an afterthought.

### 12. New platform permissions require justification
Before adding any new Android or iOS permission (camera, location, contacts, microphone, storage, etc.) — whether via a new Expo plugin/dependency or native config — confirm the permission is strictly necessary for the feature being built, and document in the PR/commit description why it's required and what it's used for. Flockora currently has a minimal permission footprint (only notification permission); keep it that way deliberately, not by accident.

### 13. No blind dependency upgrades
Do not run `npm audit fix --force`, and do not perform major dependency or Expo SDK version upgrades, without first checking Expo/React Native compatibility for every affected package. The 12 moderate vulnerabilities currently present (see baseline below) require an Expo SDK 54→57 major upgrade to resolve — this must be planned and tested as its own dedicated piece of work, not applied reactively or automatically.

### 14. Future AI agents must read this file and PROJECT_CONTEXT.md first
Any AI coding agent (or human contributor) making an architectural or security-sensitive change to Flockora must read `SECURITY.md` (this file) and `PROJECT_CONTEXT.md` in full before starting. Do not assume prior conversation memory reflects current rules — this file is the source of truth and may have been updated since.

### 15. A new security audit is mandatory immediately after any of the following
- Real AI integration (Gemini, OpenAI, Claude, or any other provider actually replacing the current mock)
- Backend integration of any kind
- Authentication implementation
- Cloud sync implementation
- Payment or subscription integration (e.g. RevenueCat)

No exceptions — each of these categories introduces a fundamentally new attack surface that this document's current rules were not written against in detail. Re-audit before shipping, not after.

---

## Audit Baseline (2026-07-13, commit `18d25dd`)

This is the security posture Flockora had at the time this policy was written. Future audits should be diffed against this baseline.

- **Security score: 91/100**
- No hardcoded secrets found anywhere in the codebase
- No `EXPO_PUBLIC_*` secrets found (in fact, no `EXPO_PUBLIC_*` or `process.env` usage exists at all)
- No direct calls to any paid API currently exist in the client
- No backend currently exists in this repository
- No network calls of any kind currently exist in the app (`fetch`/`axios`/`XMLHttpRequest`/`http(s)://` — zero matches)
- Current "AI photo analysis" onboarding flow is fully mocked (hardcoded per-species lookup table, fake timer, no camera capture, no network call)
- **MEDIUM risk, documented, currently accepted:** unencrypted SQLite storage of health/medical notes (see Rule 10)
- **MEDIUM risk, documented, currently accepted:** 12 moderate-severity dependency vulnerabilities, confined to the Expo CLI/build-tooling chain (`@expo/cli`, `@expo/config`, `@expo/config-plugins`, `@expo/metro-config`, `@expo/prebuild-config`, `xcode`, `uuid`), not shipped in the runtime app bundle; fix requires a major Expo SDK upgrade (see Rule 13)
- **LOW risk, documented:** `.gitignore` excludes `.env*.local` but does not explicitly exclude a bare `.env` file — no `.env` exists today, but the gap should be closed before one is ever introduced

Any change to this baseline (new secrets handling, new network calls, new dependencies, new permissions) must be reflected in an updated audit and this section revised accordingly.

---

## Implementation Log

This section records concrete security controls actually implemented, in date order. It does not modify or supersede the Mandatory Rules above — it documents progress against them. The Mandatory Rules and Audit Baseline sections are left as originally written; this log is purely additive.

### 2026-07-13 — Phase 3 Sprint 3.1: Secure AI Backend Foundation

A new backend service (`flockora-backend/`) was created as the mandatory gateway required by Rules 3 and 4 — the mobile client still cannot call any AI provider directly (it has no AI provider code, mocked or real, and makes zero network calls, unchanged from baseline). The backend itself also contains **no real AI provider integration** — only a mocked provider (`MockAIProvider`) behind an `AIProvider` interface, so this sprint introduces no new secret, no new billing risk, and no new external network dependency.

Controls implemented and verified this sprint (full detail in `PROJECT_CONTEXT.md` §14):
- **Environment variable validation** (Rule 5 support): `zod`-schema-validated startup config in `src/config/env.ts`; the process refuses to start on invalid/missing config and reports only variable *names*, never values.
- **No secrets in source** (Rules 1, 2, 5, 9): verified by grep across all new files for key/token/secret patterns (none found), and by `git add --dry-run` confirming `.env`, `node_modules/`, and `dist/` are excluded from version control by `flockora-backend/.gitignore`.
- **Request validation** (Rule 6): MIME-type allowlist (JPEG/PNG/WEBP only) and file-size limit (`MAX_UPLOAD_MB`, default 8MB) enforced via `multer`; an optional `speciesHint` field is validated against a fixed enum via `zod`. All verified by live testing (valid upload, invalid MIME type, invalid species hint, oversized file all return the expected safe error response).
- **Rate-limit architecture** (Rule 6/7, partial): `express-rate-limit` is live on the AI-facing endpoint. Explicitly documented as IP-based only and **not** a complete implementation of Rule 7 — per-user quotas and a global usage ceiling remain required before a real provider is connected, since no authentication exists anywhere in Flockora yet to key a per-user quota on.
- **Request timeout handling** (Rule 6): middleware wired to return a safe 504 if a request exceeds `REQUEST_TIMEOUT_MS`; not yet exercised against real provider latency since the mock resolves near-instantly.
- **Centralized, safe error handling** (Rules 6, 8): a single Express error-handling middleware maps all errors (validation, upload, timeout, rate-limit, unexpected) to a generic client-safe JSON shape — no stack traces, no internal error messages, no request data ever returned to the client or written to logs.
- **No sensitive logging** (Rule 8): the logger module's type signature only accepts a fixed, non-sensitive field set (`requestId`, `route`, `statusCode`, `provider`, `mimeType`, `sizeBytes`, `code`) — there is no code path capable of logging a file's bytes, a request body, or a future auth token. Verified by manual review of every log call site and by inspecting actual log output from a live test run.
- **Security headers** (Rule 6 support): `helmet` applied with conservative defaults for a JSON/file API.
- **Provider abstraction** (Rule 4 support): the `AIProvider` interface means a future real provider integration is additive (new file + new factory case), not a rewrite of the request-handling path — reducing the risk of security controls being accidentally dropped when a real provider is eventually added.

**Not yet implemented, explicitly out of scope for this sprint** (tracked in `PROJECT_CONTEXT.md` §14.6): any real AI provider, per-user usage quotas, a global usage ceiling, authentication of any kind, deployment/hosting configuration, and mobile client integration with this backend. Per Rule 15, real AI integration, authentication, and backend-goes-live-in-production each independently trigger a mandatory fresh security audit — none of those triggers have occurred yet, since this backend is not deployed and is not called by the client.
