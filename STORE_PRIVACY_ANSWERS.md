# Flockora — Store Privacy Question Drafts

**Prepared:** 2026-07-15, based on `PRIVACY_DATA_AUDIT.md`, `GOOGLE_PLAY_COMPLIANCE.md`, and `APPLE_APP_PRIVACY_COMPLIANCE.md` from this same sprint. Every answer states PROPOSED ANSWER / CODE EVIDENCE / CONFIDENCE. Nothing here is a final submission — it's the drafted answer set for whoever fills out the actual Play Console / App Store Connect forms.

---

## A. GOOGLE PLAY DATA SAFETY — DRAFT ANSWERS

### A1. Does your app collect or share any of the required user data types?

**PROPOSED ANSWER:** Yes.
**CODE EVIDENCE:** `flockora-app/src/services/birdAnalysisService.ts` — the app's only `fetch()` call, uploading a photo to Flockora's own backend during onboarding.
**CONFIDENCE:** VERIFIED

### A2. Data type: Photos

**PROPOSED ANSWER:** Collected: Yes. Shared with third parties: No. Purpose: App functionality. Is data processing ephemeral: Yes. Required or optional: **Required** — onboarding (which includes this photo) is the app's mandatory first-run flow; there is no way to reach the main app without completing it, so the photo cannot be declared "Optional." (Separately, and not to be confused with the Required/Optional field: if the AI *analysis* of that photo fails, "Enter Details Manually" lets onboarding proceed with no analysis — but that's a fallback for a failed request, not a way to skip providing the photo itself.)
**CODE EVIDENCE:** `flockora-app/src/screens/AddFirstBirdScreen.tsx` (`canContinue` requires `bird.photo !== null`; onboarding is the only path from `Welcome` to `Main`); `flockora-app/src/screens/AIPhotoAnalysisLoadingScreen.tsx` ("Enter Details Manually" fallback on analysis failure only); `flockora-backend/src/validators/analyzeBirdUpload.ts` (`multer.memoryStorage()`, no disk/DB persistence — supports the ephemeral-processing answer).
**CONFIDENCE:** VERIFIED

### A3. Data type: Personal info (name, email, user IDs, etc.)

**PROPOSED ANSWER:** Not collected.
**CODE EVIDENCE:** No auth/account code anywhere; grep sweep (`PRIVACY_DATA_AUDIT.md` §0/§11) found zero matches for `login`, `signup`, `account`, `userId`, `deviceId`.
**CONFIDENCE:** VERIFIED

### A4. Data type: Health and fitness

**PROPOSED ANSWER:** Not collected (the app's health-record data concerns the user's birds, not the human account holder, and there is no human-health data field anywhere in the schema).
**CODE EVIDENCE:** `flockora-app/src/db/migrations.ts` — `health_records` table columns (`type`, `medicine`, `dosage`, `veterinarian`, `notes`) are all scoped to `birdId`/`flockId`, never to a user identity (none exists).
**CONFIDENCE:** EXTERNAL VERIFICATION REQUIRED (this is a judgment call against Play's taxonomy wording, not a pure code fact — recommend confirming against Play's current published Health-and-fitness category definition before submission)

### A5. Data type: Location

**PROPOSED ANSWER:** Not collected.
**CODE EVIDENCE:** `PRIVACY_DATA_AUDIT.md` §0/§7 — zero matches for `expo-location`, zero location permission in `app.json`.
**CONFIDENCE:** VERIFIED

### A6. Data type: App activity / App info and performance / Device or other IDs

**PROPOSED ANSWER:** Not collected.
**CODE EVIDENCE:** No analytics/crash-reporting/advertising SDK in either `package.json`; zero matches for `analytics`, `telemetry`, `sentry`, `firebase`, `admob` (`PRIVACY_DATA_AUDIT.md` §0/§9/§10).
**CONFIDENCE:** VERIFIED

### A7. Is all user data encrypted in transit?

**PROPOSED ANSWER:** Do not answer "Yes" yet.
**CODE EVIDENCE:** `flockora-app/src/config/backendConfig.ts` resolves to `http://` in every fallback path today; no production HTTPS backend deployment exists in this repository (`PRIVACY_DATA_AUDIT.md` §8).
**CONFIDENCE:** EXTERNAL VERIFICATION REQUIRED — depends entirely on a backend deployment decision not yet made.

### A8. Can users request that data be deleted?

**PROPOSED ANSWER:** Yes, via in-app controls (per-record delete on every screen) and full local-data removal via app uninstall. No server-side deletion request mechanism is needed because no data is retained server-side.
**CODE EVIDENCE:** Repository delete methods across `flockora-app/src/db/repositories/*.ts`; `flockora-backend/src/validators/analyzeBirdUpload.ts` (no server-side retention to delete).
**CONFIDENCE:** VERIFIED

### A9. Does your app provide a way to delete your account?

**PROPOSED ANSWER:** Not applicable — Flockora has no user accounts.
**CODE EVIDENCE:** `PRIVACY_DATA_AUDIT.md` §11 — no auth/account code anywhere in the repository.
**CONFIDENCE:** VERIFIED

---

## B. APPLE APP PRIVACY — DRAFT ANSWERS

### B1. Overall: "Data Not Collected"?

**PROPOSED ANSWER:** No — do not select "Data Not Collected." Proceed through the full questionnaire and declare the Photos or Videos category (B2).
**CODE EVIDENCE:** `flockora-app/src/services/birdAnalysisService.ts` (the one network call, transmitting a photo).
**CONFIDENCE:** VERIFIED

### B2. Data type: Photos or Videos

**PROPOSED ANSWER:** Collected: Yes. Linked to the user: No (Data Not Linked to You). Used for tracking: No. Purpose: App Functionality.
**CODE EVIDENCE:** `flockora-app/src/services/birdAnalysisService.ts`, `flockora-backend/src/routes/analyzeBird.ts` (no user/device identifier accompanies the request beyond the photo itself and an optional species-hint string); `PRIVACY_DATA_AUDIT.md` §11 (no persistent identifier of any kind exists in this codebase).
**CONFIDENCE:** VERIFIED

### B3. Data type: Contact Info, Health & Fitness (human), Financial Info, Location, Contacts, Identifiers, Purchases, Usage Data, Diagnostics, Other Data

**PROPOSED ANSWER:** Not collected for every one of these categories.
**CODE EVIDENCE:** `PRIVACY_DATA_AUDIT.md` §0, §9, §10, §11 — grep sweep and full dependency review found none of these data types processed anywhere in the client or backend.
**CONFIDENCE:** VERIFIED (Health & Fitness carries the same taxonomy caveat as Google Play A4 — bird health data, not human health data)

### B4. Does the app use tracking (per Apple's ATT definition)?

**PROPOSED ANSWER:** No.
**CODE EVIDENCE:** No advertising SDK, no IDFA usage, no cross-app/cross-site identifier, no data-broker relationship anywhere in the codebase (`PRIVACY_DATA_AUDIT.md` §9–§11).
**CONFIDENCE:** VERIFIED

### B5. Does the app require account deletion support (Guideline 5.1.1(v))?

**PROPOSED ANSWER:** Not applicable — no account creation exists in the app.
**CODE EVIDENCE:** `PRIVACY_DATA_AUDIT.md` §11.
**CONFIDENCE:** VERIFIED

### B6. Privacy Policy URL (App Store Connect field)

**PROPOSED ANSWER:** `https://flockora.com/privacy` — but **do not enter this in App Store Connect until it is confirmed live**; submitting a dead privacy-policy link is an independent App Review rejection risk.
**CODE EVIDENCE:** `flockora-app/src/config/privacyConfig.ts` — `PRIVACY_POLICY_URL` is set to this address, but `PRIVACY_POLICY_URL_IS_PLACEHOLDER = true` (confirmed/re-corrected this sprint) because the business has confirmed the page is not yet published.
**CONFIDENCE:** EXTERNAL VERIFICATION REQUIRED — confirmed NOT live as of 2026-07-15; must be re-verified live immediately before submission.

### B7. Are third-party SDKs' own data practices accounted for in this declaration?

**PROPOSED ANSWER:** Not applicable — no third-party SDK exists in the app that independently collects data.
**CODE EVIDENCE:** Full `package.json` review, `PRIVACY_DATA_AUDIT.md` §9.
**CONFIDENCE:** VERIFIED

---

## Notes for whoever submits these forms

- Re-run the grep sweep in `PRIVACY_DATA_AUDIT.md` §0 against the exact commit being submitted before copying these answers verbatim — this document reflects `main` at the commit recorded in `PROJECT_CONTEXT.md`'s new dated sprint section, and any code change after that point (especially a real AI provider integration, which `SECURITY.md` Rule 15 already flags as mandatory-re-audit-triggering) invalidates these answers.
- Do not submit A7/B6 as fully resolved — both depend on infrastructure decisions (backend HTTPS deployment; live privacy-policy webpage) that this repository cannot make or verify on its own.
- **A7/B6 re-confirmed as of the 2026-07-15 re-audit sprint:** the privacy policy is confirmed NOT live yet, and no production backend deployment exists. Both must be resolved and re-verified — not just re-copied from this document — immediately before whichever store submission happens first.
