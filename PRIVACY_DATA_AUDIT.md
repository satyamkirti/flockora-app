# Flockora — Privacy & Data-Flow Audit

**Audited:** 2026-07-15, against `main` at commit `cb9fdce` (working tree changes described in §0 below applied on top during this same sprint — see `PROJECT_CONTEXT.md` §5.24 for the exact diff).

**Method:** Every claim in this document is derived from direct inspection of the current source code in `flockora-app/` and `flockora-backend/` — repository reads, targeted greps for network/analytics/tracking/identifier patterns, and manual reading of every file a grep hit touched. No claim here is copied from a prior report without re-verification. Where a fact depends on something outside this repository (a hosting platform's own behavior, a future deployment), it is explicitly marked **EXTERNAL FACT REQUIRES VERIFICATION** rather than asserted.

**Headline finding:** Flockora is a local-only, no-account, no-analytics, no-advertising app. Exactly one network call exists in the entire client codebase — the onboarding bird-photo upload to Flockora's own backend, which today is not deployed anywhere and answers every request with a mocked (non-AI) provider. Everything else a user enters — birds, flocks, tasks, health records, eggs, feed, breeding/hatching data — stays in a local, on-device SQLite database and never leaves the device except by the user's own explicit export/share action.

---

## 0. Repository-wide search evidence

Grepped the full `flockora-app/src/` and `flockora-backend/src/` trees for the terms specified in this sprint's audit brief. Results (fresh, re-run this sprint):

| Pattern | Client (`flockora-app/src`) | Backend (`flockora-backend/src`) |
|---|---|---|
| `fetch(` | 1 match — `src/services/birdAnalysisService.ts` (the only network call in the client) | N/A (server, not a caller) |
| `axios` / `XMLHttpRequest` / `WebSocket` | 0 | 0 |
| `http://` / `https://` | `backendConfig.ts` (`http://localhost:8787` dev fallback only) | `env.ts` default `ALLOWED_ORIGINS` = `http://localhost:19006` (dev only) |
| `EXPO_PUBLIC_` / `process.env` | 1 variable: `EXPO_PUBLIC_BACKEND_URL` (non-secret base-URL override, `backendConfig.ts`) | N/A (server reads normal server-side env vars via `dotenv`, never bundled to a client) |
| `analytics`, `telemetry`, `sentry`, `firebase`, `admob`, `segment`, `mixpanel`, `posthog`, `supabase` | 0 | 0 |
| `login`, `signup`, `account`, `userId`, `deviceId`, `advertisingId`, `tracking` | 0 (no auth/account/identifier code anywhere) | 0 |
| `camera`, `image picker`, `media library` | `expo-image-picker` (camera + gallery only, no media-library package) | N/A |
| `location`, `contacts`, `microphone` | 0 real usage; `microphonePermission: false` is an explicit *suppression* in the image-picker plugin config, not a request | 0 |
| `console.log/warn/error/info` | 0 in client | Present, but type-constrained — see §11 |

No file in either project imports an analytics, crash-reporting, advertising, or authentication SDK. `package.json` (both projects, read in full) lists only Expo/React Native/React Navigation packages on the client and Express/validation/security-middleware packages on the backend — no AI provider SDK, no analytics SDK, no ad SDK, no auth SDK.

---

## 1. Bird data, flock data, task data, health/vaccination records, egg records, feed inventory & usage, breeding data, clutch/hatch data

These eight categories are grouped because they are structurally identical in this codebase: each is a table in one local SQLite database, written and read only through that table's own repository file, with no code path that transmits any of it off-device automatically.

- **DATA TYPE:** Bird records (name, species, breed, sex, DOB, photo URI, tag ID, notes, weight); flock/group records; care tasks/reminders; health records (type, notes, **medicine, dosage, veterinarian, cost**, optional attached document photo); egg production logs; feed inventory + usage logs; breeding pair records; clutch/candling/hatch records.
- **SOURCE:** Directly typed or selected by the user in the app's Add/Edit forms. Some fields (breed/sex/color/life-stage on the *first* bird only) may originate as AI-*suggested* values the user reviews and confirms/edits before saving (see §3).
- **WHERE STORED:** A single local SQLite file, `flockora.db`, on the device (`flockora-app/src/db/migrations.ts` defines all 11 tables). **No encryption at rest** — this is `expo-sqlite`'s default and is a documented, currently-accepted risk (`SECURITY.md` Rule 10), specifically called out for health/medical fields.
- **WHETHER IT LEAVES DEVICE:** No, automatically — never. It leaves the device only if the user explicitly (a) exports a CSV of egg records, (b) exports a full-database JSON backup, or (c) shares either file via the OS share sheet — all user-initiated, none automatic.
- **DESTINATION, IF ANY:** None automatic. For user-initiated export/share: wherever the user's own OS share sheet sends the file (e.g., their own email, cloud drive, messaging app) — entirely the user's choice, not a Flockora-controlled destination.
- **PURPOSE:** Core app functionality — flock/bird record-keeping, care scheduling, production/health tracking, breeding management. No secondary purpose (no analytics, no ad targeting, no profiling).
- **THIRD PARTY / PROCESSOR, IF ANY:** None. This data is never sent to a Flockora backend or any third party as part of normal app use.
- **RETENTION BEHAVIOR PROVEN BY CODE:** Persists indefinitely in local SQLite until the user deletes the specific record, "archives"/soft-deletes a bird (`isActive` flag), or uninstalls the app (which removes the database file entirely, standard OS behavior for app data).
- **USER DELETION METHOD:** Per-record delete UI (all confirmed via native `Alert.alert` destructive confirmations) on every Add/Edit/Detail screen; full-app deletion via OS "uninstall app" / "clear app data." No cloud copy exists to separately delete.
- **GOOGLE PLAY DATA SAFETY RELEVANCE:** Collected (locally) but **not shared off-device** by the app. Health-adjacent fields (medicine/dosage/veterinarian) are about the *bird*, not a person, and are not "health data" about the app's human user in Play's schema sense — but see §12 for how this should still be framed conservatively.
- **APPLE APP PRIVACY RELEVANCE:** Not collected by Flockora (the developer) in Apple's sense — the data is stored locally on-device and never transmitted to Flockora or a third party. Apple's "Data Not Collected" applies to *this* data category specifically (distinct from the photo/AI category below, which is different).
- **EVIDENCE FILES / CODE PATHS:** `flockora-app/src/db/migrations.ts` (schema); `flockora-app/src/db/repositories/*.ts` (all reads/writes); zero `fetch`/`axios` calls in any repository file (verified by grep — the only `fetch` call site in the whole client is `birdAnalysisService.ts`, unrelated to these repositories).

---

## 2. Photos / images (bird photos, health-record document photos)

- **DATA TYPE:** Photos captured via camera or chosen from the photo library — a bird's profile photo, and (as of the Vet Document Attachment sprint) an optional photo/document attached to a health record.
- **SOURCE:** `expo-image-picker`, via `src/services/imagePickerService.ts` — the only place this package is called.
- **WHERE STORED:** The picker returns a URI to a file already on the device's own filesystem (in the OS-managed image-picker cache/media store); the app stores that URI string in SQLite (`birds.photoUri`, `health_records.documentUri`) — it does **not** copy image bytes into its own SQLite database or a Flockora-managed directory.
- **WHETHER IT LEAVES DEVICE:** Only the *first bird's* onboarding photo, and only that one photo, is uploaded — to Flockora's own backend, for the one-time AI-suggestion step (see §3). No other bird/health photo is ever transmitted anywhere by the app automatically. A photo can leave the device incidentally if the user's JSON backup export is shared — but the backup only stores the file-path *string*, not image bytes (see §6), so even that doesn't transmit the photo itself.
- **DESTINATION, IF ANY:** Onboarding photo only → Flockora's own backend (`POST /api/v1/analyze-bird`), not a third party.
- **PURPOSE:** Bird identification/record display (all photos); AI-assisted attribute suggestion (onboarding photo only).
- **THIRD PARTY / PROCESSOR, IF ANY:** None. Flockora's own backend only, and only for the onboarding photo.
- **RETENTION BEHAVIOR PROVEN BY CODE:** On-device: persists as long as the OS keeps the file and the SQLite row referencing it exists. On the backend: **not retained** — `multer.memoryStorage()` holds the uploaded photo's bytes in process memory only for the duration of that single request; there is no `fs.writeFile`/disk-storage/database-insert call anywhere in `flockora-backend/src` (grepped and confirmed — see `flockora-backend/src/validators/analyzeBirdUpload.ts`). The bytes are discarded when the request completes.
- **USER DELETION METHOD:** Deleting/replacing the bird's photo in the app; deleting the bird itself; uninstalling the app. Nothing to delete server-side, since nothing is retained server-side.
- **GOOGLE PLAY DATA SAFETY RELEVANCE:** Photos **are collected and transmitted** (onboarding photo only) to Flockora's own server — must be declared as "Photos" data collected and shared with "App developer" (not a third party), purpose "App functionality," not sold, ephemeral processing (ephemeral = ✅, since the backend never stores it — see §12 for exact Play Console mapping).
- **APPLE APP PRIVACY RELEVANCE:** "Photos or Videos" **is collected**, transmitted to the developer's own server, used for App Functionality, and — because Apple's ephemeral-processing exception is narrow and this project cannot independently verify Apple's current interpretation applies — should be declared as collected rather than assumed exempt (see §12).
- **EVIDENCE FILES / CODE PATHS:** `flockora-app/src/services/imagePickerService.ts`, `flockora-app/src/services/birdAnalysisService.ts`, `flockora-app/src/screens/AddFirstBirdScreen.tsx`, `flockora-backend/src/validators/analyzeBirdUpload.ts` (memory storage), `flockora-backend/src/routes/analyzeBird.ts` (no persistence, metadata-only logging).

---

## 3. AI photo analysis (onboarding)

See §3 of `PRIVACY_DATA_AUDIT.md`'s companion deep-dive — this section is intentionally brief; the full special audit is in **§3 of the sprint report** and in `PROJECT_CONTEXT.md`. Summary of the proven facts:

- A photo **is** transmitted off-device — to Flockora's own backend at a URL resolved by `getBackendBaseUrl()` (an explicit `EXPO_PUBLIC_BACKEND_URL` override, else a derived local dev-server LAN host, else `http://localhost:8787`).
- The backend is **not deployed anywhere today** — no hosting platform, no production URL exists in this repository. **EXTERNAL FACT REQUIRES VERIFICATION**: what URL scheme (http vs. https) and hosting platform will be used at production launch, since that determines the real answer to "is data encrypted in transit."
- The backend does **not** store the image (memory-only, discarded after the request — proven by code, see §2).
- The backend does **not** log request bodies, file bytes, or filenames — only `requestId`, `route`, `statusCode`, `provider`, `mimeType`, `sizeBytes`, `code` (`flockora-backend/src/utils/logger.ts`, a type-constrained module that cannot accept any other field).
- **No AI/model provider receives the image or any derived data.** The only "provider" that exists is `MockAIProvider` — a hardcoded, offline, per-species lookup table (`flockora-backend/src/providers/MockAIProvider.ts`) that never inspects the uploaded bytes' content, only the already-validated `mimeType`/`sizeBytes` metadata. There is no Gemini/OpenAI/Claude/other AI provider integration anywhere in this repository.
- No metadata beyond MIME type and byte size is sent to/derived by the provider layer — no EXIF, no geolocation extraction, no device metadata.
- **Just-in-time disclosure:** before this sprint, the onboarding photo-capture screen (`AddFirstBirdScreen.tsx`) did not disclose the upload before the user tapped "Continue" (which immediately triggers the upload on the next screen's mount) — the only existing disclosure was in Settings, a separate screen not part of the onboarding flow. This sprint added an in-context notice directly under the captured photo, before the "Continue" button that triggers transmission (see `flockora-app/src/screens/AddFirstBirdScreen.tsx`).
- Manual entry **is** available if the AI request fails (`AIPhotoAnalysisLoadingScreen.tsx`'s "Enter Details Manually" action), but a photo is required to proceed past `AddFirstBirdScreen` at all (`canContinue` requires `bird.photo !== null`) — there is no way to reach onboarding's Review & Confirm step without first capturing/choosing a photo. The new disclosure states the upload as a fact of continuing, not as an optional/skippable step, because it is not skippable pre-upload.

---

## 4. Onboarding data

- **DATA TYPE:** Species selection, purpose selection, first-bird draft (name, photo, AI-suggested attributes) — held only in React Context (`OnboardingContext.tsx`) in memory during the onboarding flow.
- **SOURCE:** User input during the Welcome → BirdTypeSelection → PurposeSelection → AddFirstBird → (AI analysis) → ReviewConfirm flow.
- **WHERE STORED:** In-memory only (`OnboardingContext`) until the flow completes, at which point the first bird + flock are written to SQLite exactly like any other bird/flock record (§1). If onboarding is abandoned mid-flow, nothing is persisted (no draft-saving to disk).
- **WHETHER IT LEAVES DEVICE:** Only the photo, once, per §2–3. Species/purpose selections never leave the device.
- **DESTINATION / PURPOSE / THIRD PARTY:** N/A beyond the photo already covered in §3.
- **RETENTION:** In-memory Context state; cleared on app restart or via Settings' "Reset Onboarding" (which replays the flow, does not touch existing saved birds/flocks/records).
- **USER DELETION METHOD:** N/A once onboarding completes and data becomes a normal bird/flock record (§1); nothing separate to delete before that.
- **GOOGLE PLAY / APPLE RELEVANCE:** No separate disclosure beyond §1 (final bird/flock record) and §3 (photo).
- **EVIDENCE:** `flockora-app/src/context/OnboardingContext.tsx`.

---

## 5. Notifications and notification payloads

- **DATA TYPE:** Locally scheduled reminders (task due dates, health/vaccination reminders, feed expiry/low-stock alerts, candling/hatch-due reminders) with a title, body, and a small `data` payload (`{ type, id }`) used only for in-app deep-linking when tapped.
- **SOURCE:** Derived entirely from the user's own saved records (due dates, thresholds) — `flockora-app/src/services/notificationService.ts`.
- **WHERE STORED:** Scheduled via `expo-notifications`' local OS notification scheduler; the resulting notification identifier is stored back in the relevant SQLite row (`notificationId`, `candlingNotificationId`, etc.) so it can be cancelled/rescheduled later.
- **WHETHER IT LEAVES DEVICE:** No. **Local notifications only** — no push infrastructure, no push token, no remote notification server exists anywhere in this codebase (confirmed: no `getExpoPushTokenAsync`/FCM/APNs push-token code found anywhere).
- **DESTINATION / THIRD PARTY:** None.
- **PURPOSE:** Reminder/scheduling functionality only.
- **RETENTION:** Lives as long as the underlying record exists and the reminder hasn't fired/been cancelled; cancelled and re-scheduled on every relevant edit (§ "Notification reconciliation" in `PROJECT_CONTEXT.md` §9).
- **USER DELETION METHOD:** Deleting the underlying task/record cancels its notification (per the Notification & Reminder System hardening sprint); OS-level notification-permission revocation also stops delivery.
- **GOOGLE PLAY / APPLE RELEVANCE:** Not a data-collection item for either store (purely local scheduling, no data transmitted) — only the notification *permission* itself needs declaring (see §7).
- **EVIDENCE:** `flockora-app/src/services/notificationService.ts`, `flockora-app/src/services/notificationNavigation.ts`.

---

## 6. Backups, exports, and restored backup data

- **DATA TYPE:** Full-database JSON backup (all 11 tables, including any bird/document photo *file paths*, not image bytes) and a CSV egg-production export.
- **SOURCE:** `flockora-app/src/db/repositories/backupRepository.ts` (reads every table) and `flockora-app/src/utils/eggExport.ts` (CSV).
- **WHERE STORED:** Written to the app's own cache directory (`expo-file-system`'s `Paths.cache`) as an intermediate step, then handed to the OS share sheet (`expo-sharing`) or left for the user to pick up.
- **WHETHER IT LEAVES DEVICE:** Only if the user explicitly taps "Share"/"Export" and picks a destination in the OS share sheet — never automatic, never sent to Flockora or any third party by the app itself.
- **DESTINATION, IF ANY:** Entirely the user's own choice via the OS share sheet (their email, cloud storage, messaging app, etc.) — not a Flockora-controlled or Flockora-visible destination.
- **PURPOSE:** User-controlled data portability/backup.
- **THIRD PARTY / PROCESSOR:** None controlled by Flockora; whatever destination app the user picks is outside Flockora's knowledge or control.
- **RETENTION BEHAVIOR PROVEN BY CODE:** Cache-directory copies persist until the user runs Settings → "Clear Cached Files" (`cacheService.ts`) or the OS reclaims cache space; not automatically deleted after sharing.
- **USER DELETION METHOD:** Settings → "Clear Cached Files"; deleting a manually-saved copy from wherever the user's share-sheet destination put it (outside Flockora's control).
- **RESTORED BACKUP DATA:** Restoring a picked backup file wipes and repopulates all 11 local tables inside one exclusive SQLite transaction (`backupRepository.restoreAllTables`, hardened in the Backup/Restore Integrity sprint — referential-integrity and row-shape validation run before any write; a corrupted file is rejected, not partially applied). Restored data is subject to all the same on-device, unencrypted-at-rest, no-auto-transmission behavior as §1. Notification IDs are nulled on restore (not carried over) rather than assumed still valid.
- **GOOGLE PLAY / APPLE RELEVANCE:** Not "collected" by Flockora — this is the user exporting/sharing their own data via the OS's own share mechanism, not Flockora transmitting it. Should still be mentioned in the privacy policy for transparency (drafted in `PRIVACY_POLICY_DRAFT.md`).
- **EVIDENCE:** `flockora-app/src/db/repositories/backupRepository.ts`, `flockora-app/src/services/backupFileService.ts`, `flockora-app/src/utils/backupValidation.ts`, `flockora-app/src/utils/eggExport.ts`.

---

## 7. Device permissions

| Permission | Platform | Source | Purpose (proven by code) |
|---|---|---|---|
| Camera | Android + iOS | `expo-image-picker` plugin (`app.json`) | Bird/health-document photo capture. Custom usage-description strings present for both platforms. |
| Photo library | Android + iOS | `expo-image-picker` plugin | Choosing an existing bird/health-document photo instead of taking a new one. |
| `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` (legacy, Android; scoped-storage superseded on modern Android versions) | Android | Transitively from `expo-image-picker` / `expo-file-system` | Reading a chosen gallery photo; writing CSV/backup export files to app-accessible storage. |
| `POST_NOTIFICATIONS` | Android 13+ | `expo-notifications` | Delivering local task/health/feed/hatch reminders. |
| `RECEIVE_BOOT_COMPLETED` | Android | `expo-notifications` (auto-added by its config plugin) | Re-registering already-scheduled local notifications after a device reboot. |
| `INTERNET` | Android | Implicit (any app making a network call) | The one `fetch()` call to Flockora's own backend for onboarding AI analysis. |
| Notification permission | iOS | `expo-notifications` (runtime prompt) | Same as Android `POST_NOTIFICATIONS`. |
| Microphone | — | **Explicitly suppressed** (`microphonePermission: false` in the `expo-image-picker` plugin config) | Not requested — Flockora never records audio/video. |
| Location, Contacts | — | **Not present anywhere** — confirmed by grep (`expo-location`, `expo-contacts`: zero matches) | N/A |

**No permission was added, removed, or changed this sprint.** This table matches the permission surface already documented in `PROJECT_CONTEXT.md` §5.23 item 2, re-verified fresh this sprint by re-reading `app.json`'s plugin config.

---

## 8. Backend / API calls

- **DATA TYPE / SOURCE:** Exactly one client-initiated HTTP request type exists: `POST {backendBaseUrl}/api/v1/analyze-bird`, multipart form data (`photo` file + optional `speciesHint` string).
- **WHERE PROCESSED:** `flockora-backend/` (Node/Express), currently run only locally during development — **not deployed to any hosting platform** (no Render/Railway/Fly/Cloud Run/etc. config exists in this repository).
- **WHETHER IT LEAVES DEVICE:** Yes, by definition (it's a network request) — see §2/§3 for what's actually transmitted and retained.
- **DESTINATION:** Flockora's own backend only. No other endpoint, domain, or API exists anywhere in the client.
- **PURPOSE:** AI-suggested bird attribute analysis (currently mocked — see §3).
- **THIRD PARTY / PROCESSOR:** None today (no real AI provider connected). If/when a real provider (e.g., Gemini, per `PRODUCT_CONSTITUTION.md`'s stated future intent) is connected, that provider becomes a data processor for the transmitted image and this document must be updated before shipping (`SECURITY.md` Rule 15 already mandates a fresh security audit at that point).
- **RETENTION:** None server-side (§2).
- **ENCRYPTION IN TRANSIT:** **EXTERNAL FACT REQUIRES VERIFICATION.** The client's URL-resolution fallback chain (`backendConfig.ts`) defaults to `http://` (dev-only). No production `https://` backend URL is configured anywhere in this repository, because no production backend deployment exists yet. This must be resolved (a real backend deployed behind `https://`, with `EXPO_PUBLIC_BACKEND_URL` set to that URL at production build time) before shipping — otherwise the app either fails over harmlessly to manual entry (if no backend is reachable at all) or, worse, would transmit unencrypted if a `http://` production URL were ever mistakenly configured. This is a release prerequisite, not a code bug — the code cannot fix a deployment that doesn't exist yet.
- **EVIDENCE:** `flockora-app/src/services/birdAnalysisService.ts`, `flockora-app/src/config/backendConfig.ts`, `flockora-backend/src/routes/analyzeBird.ts`, `flockora-backend/src/app.ts`.

---

## 9. Third-party SDKs / Expo modules

- **Third-party SDKs (analytics, ads, crash reporting, auth, backend-as-a-service):** **None.** Confirmed by reading both `package.json` files in full and by the grep sweep in §0.
- **Expo modules in use (all first-party Expo packages, not third-party data processors):** `expo-font`, `expo-sqlite`, `expo-notifications`, `expo-image-picker`, `expo-constants`, `expo-file-system`, `expo-sharing`, `expo-document-picker`, `expo-image-manipulator`, `expo-status-bar`. None of these transmit user data to Expo/EAS servers at runtime as part of normal app operation — they are on-device APIs (camera, filesystem, local notifications, etc.), not cloud services. (Expo's own *build/development tooling* — the `expo`/`eas` CLI — has its own, separate, well-documented anonymous CLI-usage telemetry; that is a developer-tooling concern, not something the *shipped app binary* does at runtime, and is out of scope for an end-user privacy policy. **EXTERNAL FACT, not verified further this sprint** since it does not affect the shipped app's behavior.)
- **EVIDENCE:** `flockora-app/package.json`, `flockora-backend/package.json`.

---

## 10. Analytics, telemetry, crash reporting, advertising

**None of these exist anywhere in this codebase.** Zero matches for `analytics`, `telemetry`, `sentry`, `firebase`, `admob`, `segment`, `mixpanel`, `posthog` across both projects (§0). No crash-reporting SDK, no ad SDK, no first-party analytics event logging of any kind. This matches `SECURITY.md`'s own documented baseline exactly.

---

## 11. Authentication / accounts / identifiers

- **Authentication:** None implemented anywhere — no login, no signup, no session, no token, no password. Confirmed by grep (§0) and by direct reading of the navigation structure (`RootNavigator`/`AppTabs`), which has no auth-gated route.
- **Accounts:** None exist. There is no concept of a Flockora user account, so "account deletion" as a store-review concept does not apply (see the compliance matrices for how this is declared without inventing a system that doesn't exist).
- **Identifiers:** No advertising ID, no device ID, no persistent user/install identifier of any kind is read, generated, or transmitted anywhere in this codebase. The backend's `requestId` (`flockora-backend/src/middleware/requestId.ts`) is a per-request, ephemeral, server-generated correlation ID used only for that single request/response pair and its own log line — it is not derived from any device or user identifier, not stored beyond that log line, and not returned in a way the client persists.
- **IP address processing:** The backend's rate limiter (`express-rate-limit`) necessarily keys on the caller's source IP address to enforce its per-window request cap — this is in-memory, process-local, and cleared on each rolling window; the IP address is never written to the structured log (`logger.ts`'s field set has no IP field) and never persisted to any store. **EXTERNAL FACT REQUIRES VERIFICATION:** whatever hosting platform eventually runs this backend in production may independently log source IPs at its own infrastructure layer (e.g., a load balancer or CDN's own access logs) — that is standard for any HTTP service and outside this application's own code, but should be accounted for in the eventual hosting platform's own data-processing terms.
- **EVIDENCE:** `flockora-backend/src/middleware/rateLimiter.ts`, `flockora-backend/src/middleware/requestId.ts`, `flockora-backend/src/utils/logger.ts`.

---

## 12. Local SQLite storage, temporary files, logs/console output

- **Local SQLite storage:** One file, `flockora.db`, holds every table in §1. Unencrypted at rest (`expo-sqlite` default) — documented, accepted MEDIUM risk (`SECURITY.md` Rule 10), unchanged this sprint.
- **Temporary files:** Cache-directory copies created during CSV/backup export and backup-file restore picking (`expo-file-system`, `expo-document-picker`) — see §6. Cleared via Settings → "Clear Cached Files," never used for anything beyond the export/restore operation that created them.
- **Logs and console output:** The client has **zero** `console.*` calls anywhere in `src/` (grepped and confirmed, matching `SECURITY.md`'s documented baseline). The backend logs only the fixed, non-sensitive field set described in §3/§11 to stdout; it does not write to a log file itself (log persistence, if any, would be whatever the eventual hosting platform captures from stdout — **EXTERNAL FACT REQUIRES VERIFICATION**, since no hosting platform is chosen yet).

---

## Summary table

| Category | Leaves device? | Destination | Retained off-device? |
|---|---|---|---|
| Bird/flock/task/health/egg/feed/breeding/clutch records | No (auto) | — | — |
| Bird & document photos (all except onboarding photo) | No | — | — |
| Onboarding first-bird photo | **Yes** | Flockora's own backend | **No** — memory-only, discarded per-request |
| Notifications | No | — | — |
| Backup/export files | Only if user shares | User's own chosen destination | Outside Flockora's knowledge |
| Analytics/telemetry/ads/crash data | N/A — none collected | — | — |
| Account/auth identifiers | N/A — none exist | — | — |
| Device IDs / advertising IDs | N/A — none collected | — | — |
