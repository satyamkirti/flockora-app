# Flockora — Google Play Compliance Matrix

**Audited:** 2026-07-15. Based entirely on `PRIVACY_DATA_AUDIT.md` (same commit/sprint). Every row below cites the evidence file(s) behind its classification — no claim is asserted without a corresponding code path.

**Classifications used:** `COMPLIANT/READY`, `ACTION REQUIRED`, `NOT APPLICABLE`, `EXTERNAL VERIFICATION REQUIRED`.

---

## 1. Privacy Policy requirement

| Item | Status | Evidence / Note |
|---|---|---|
| Privacy policy URL configured in-app | **COMPLIANT/READY** (as of this sprint) | `flockora-app/src/config/privacyConfig.ts` now points to `https://flockora.com/privacy`, `PRIVACY_POLICY_URL_IS_PLACEHOLDER = false`, reachable from Settings. |
| Privacy policy actually published and reachable at that URL | **EXTERNAL VERIFICATION REQUIRED** | This repository cannot prove a webpage exists at `https://flockora.com/privacy` — that is outside the codebase. `PRIVACY_POLICY_DRAFT.md` (this sprint) is a draft for that page; it must be published at the real URL before Play Console submission, since Play validates the link resolves. |
| Play Console "Privacy Policy" field | **ACTION REQUIRED** | Must be filled in with `https://flockora.com/privacy` once published — a Play Console action, not a code change. |

## 2. Data Safety declaration — data collected

| Data type (Play's taxonomy) | Collected? | Shared? | Status |
|---|---|---|---|
| Photos or videos | **Yes** — the onboarding bird photo, uploaded to Flockora's own backend | No (not shared with a third party — Flockora's own server only, and not retained there) | **ACTION REQUIRED**: declare "Photos" collected, purpose "App functionality," data **not shared**, ephemeral processing since the backend never stores it (`PRIVACY_DATA_AUDIT.md` §2). Play's "ephemeral processing" checkbox exists specifically for this shape of flow — use it, don't claim "not collected." |
| Personal info (name, email, etc.) | No | No | **COMPLIANT/READY** — no account, no name/email field tied to a user identity anywhere in the app (bird *names* are pet-record data, not personal info about the human user). |
| Health and fitness | Technically no — `health_records` is about the *bird*, not the app's human user | No | **COMPLIANT/READY**, but see the note below — declare conservatively if Play's reviewers interpret veterinary/medicine fields broadly. |
| Financial info | No | No | **COMPLIANT/READY** — `cost` fields on health/feed records are the user's own free-text bird-care expense notes, never processed as payment data, never transmitted. |
| Location | No | No | **COMPLIANT/READY** — no location permission, no location code anywhere (`PRIVACY_DATA_AUDIT.md` §7). |
| App activity / App info and performance / Device or other IDs | No | No | **COMPLIANT/READY** — no analytics, no crash reporting, no advertising/device identifiers anywhere (`PRIVACY_DATA_AUDIT.md` §9–§11). |
| Messages / Contacts | No | No | **COMPLIANT/READY** — no contacts permission, no messaging feature. |

**Note on Health and fitness:** Play's Data Safety form defines "Health info" around the *user's own* physical/mental health. Flockora's `health_records` table stores information about a **bird** (an animal, the app's core subject matter), not the human account holder — there is no human-health data collected. This is stated plainly rather than left ambiguous, since misclassifying it either way (over- or under-declaring) is itself a compliance risk. **This is a judgment call on Play's taxonomy, not a code fact — flagged EXTERNAL VERIFICATION REQUIRED** for whoever fills out the Play Console form to confirm against Play's current published guidance at submission time.

## 3. Data processing purpose

| Purpose | Status |
|---|---|
| App functionality (photo → AI suggestion) | **COMPLIANT/READY** — the only purpose for the only data type transmitted. |
| Analytics | **NOT APPLICABLE** — none collected. |
| Advertising or marketing | **NOT APPLICABLE** — no ads, no ad SDK. |
| Fraud prevention/security | **NOT APPLICABLE** — no such processing exists. |
| Personalization | **NOT APPLICABLE** — no user profiling. |

## 4. Required vs. optional data

| Item | Status |
|---|---|
| Is the onboarding photo required to use the app? | **ACTION REQUIRED (disclosure accuracy)** — a photo is required to complete onboarding's first-bird step (`AddFirstBirdScreen`'s `canContinue` requires `bird.photo !== null`), but the AI *analysis* of that photo is not required — if the AI request fails, "Enter Details Manually" proceeds with no analysis. Declare the photo collection as **required for the AI-suggestion feature** but note in Data Safety free-text that failure gracefully degrades to manual entry (`PRIVACY_DATA_AUDIT.md` §3). |
| Any other data type required? | **COMPLIANT/READY** — no other Play-taxonomy data type is collected/transmitted at all, so "required vs optional" doesn't apply beyond the photo. |

## 5. Ephemeral processing

| Item | Status |
|---|---|
| Onboarding photo — backend retention | **COMPLIANT/READY**, use Play's ephemeral-processing declaration | Proven by code: `multer.memoryStorage()`, no disk write, no DB insert, discarded after the request (`flockora-backend/src/validators/analyzeBirdUpload.ts`, `flockora-backend/src/routes/analyzeBird.ts`). |

## 6. Encryption in transit

| Item | Status |
|---|---|
| Is data encrypted in transit? | **EXTERNAL VERIFICATION REQUIRED** | The only transmitted data type (the onboarding photo) travels over whatever scheme `getBackendBaseUrl()` resolves to. No production `https://` backend exists yet (`PRIVACY_DATA_AUDIT.md` §8) — this cannot be truthfully answered "Yes" in Play Console until a real, HTTPS-only production backend is deployed and `EXPO_PUBLIC_BACKEND_URL` is set to it at build time. **Do not answer "Yes" on this question until that deployment exists and is verified.** |

## 7. User data deletion

| Item | Status |
|---|---|
| In-app data deletion | **COMPLIANT/READY** — every record type has a per-record delete flow; the app itself can be fully removed via OS uninstall, which deletes the local `flockora.db` entirely (`PRIVACY_DATA_AUDIT.md` §1). |
| Server-side data deletion | **NOT APPLICABLE** — nothing is retained server-side to delete (§5 above). |
| Play Console "Data deletion" request-handling requirement | **COMPLIANT/READY, no account-deletion flow needed** — Play requires an account-deletion mechanism (in-app and/or web) only for apps that let users create an account. Flockora has no account system anywhere (`PRIVACY_DATA_AUDIT.md` §11). **Do not build an account-deletion flow to satisfy this requirement — it does not apply.** |

## 8. Account deletion applicability

| Item | Status |
|---|---|
| Does Flockora have accounts? | **NOT APPLICABLE** — confirmed no auth/account code exists anywhere (`PRIVACY_DATA_AUDIT.md` §11). |
| Is an account-deletion web link required? | **NOT APPLICABLE** for the same reason. If Flockora ever adds Supabase Auth (named as a future intent in `PRODUCT_CONSTITUTION.md`), this section must be re-audited at that time — `SECURITY.md` Rule 11 already mandates a dedicated data-access review before that happens. |

## 9. Permissions

| Permission | Status |
|---|---|
| Camera | **COMPLIANT/READY** — justified, used, custom description string present (`PRIVACY_DATA_AUDIT.md` §7). |
| Photo library / storage (legacy) | **COMPLIANT/READY** — same. |
| `POST_NOTIFICATIONS` | **COMPLIANT/READY** — justified, local reminders only. |
| `RECEIVE_BOOT_COMPLETED` | **COMPLIANT/READY** — auto-added by `expo-notifications`, needed for reminder survival across reboot. |
| `INTERNET` | **COMPLIANT/READY** — needed for the one backend call. |
| Any permission not traceable to a real feature | **NOT APPLICABLE** — none found; every permission traces to a shipped feature (`PRIVACY_DATA_AUDIT.md` §7). |

## 10. Notification permission

| Item | Status |
|---|---|
| Runtime request justified and disclosed | **COMPLIANT/READY** — requested only when scheduling the first reminder, not on app launch; permission-status UI exists (`NotificationPreviewCard`) explaining what denial means. |

## 11. Photo/image access

| Item | Status |
|---|---|
| Purpose disclosed at permission-request time | **COMPLIANT/READY** — custom `cameraPermission`/`photosPermission` strings in `app.json`'s `expo-image-picker` plugin config explain the AI-suggestion purpose. |
| Purpose disclosed before the *upload* itself (distinct from the OS permission prompt) | **COMPLIANT/READY (fixed this sprint)** — see `PRIVACY_DATA_AUDIT.md` §3; a just-in-time notice was added to `AddFirstBirdScreen.tsx` before the "Continue" action that triggers the upload. |

## 12. Sensitive data considerations

| Item | Status |
|---|---|
| Health/medical fields (bird-related) unencrypted at rest | **ACTION REQUIRED (pre-launch, not a Play submission blocker)** — documented, accepted MEDIUM risk (`SECURITY.md` Rule 10). Not a Play Data Safety issue (data never leaves the device), but should be resolved before any wide production launch per Flockora's own security policy. |
| Any data type requiring a "Sensitive info" declaration | **NOT APPLICABLE** — no government ID, no precise financial account data, no biometric data, no human health data collected (see §2's Health note). |

## 13. Misleading privacy claim risk

| Item | Status |
|---|---|
| Absolute claims ("no data collected", "100% private", "offline only") anywhere in the app or store listing draft | **ACTION REQUIRED — must be avoided.** Flockora is **not** "no data collected" or "offline only" — a photo is transmitted during onboarding. Any store listing copy must say "your flock data stays on your device; only your first bird's photo is sent to our own server for a one-time AI suggestion" (or similar, evidence-based) — never a blanket "100% offline" or "no data leaves your device" claim. `SettingsScreen.tsx`'s existing Privacy Information card already avoids this (states the photo upload explicitly) — this sprint strengthened its accuracy further (§2 of `PRIVACY_DATA_AUDIT.md`). |

## 14. Store listing claim consistency

| Item | Status |
|---|---|
| In-app privacy claims vs. Data Safety form vs. store listing copy | **ACTION REQUIRED — verify at submission time** that whatever marketing copy is written for the Play Store listing matches this matrix exactly (photo upload disclosed, no analytics/ads claimed, no absolute "offline" claim). This document and `PRIVACY_POLICY_DRAFT.md` are the source of truth to check store-listing copy against before submission. |

---

## Overall Google Play readiness summary

| Area | Status |
|---|---|
| Data Safety form — can be filled out accurately today | **COMPLIANT/READY**, with one **EXTERNAL VERIFICATION REQUIRED** item (encryption in transit — depends on a not-yet-existing production backend deployment) |
| Privacy policy | **ACTION REQUIRED** — publish the actual page at `https://flockora.com/privacy` (page content drafted in `PRIVACY_POLICY_DRAFT.md`, not yet a live webpage — outside this repository's control) |
| Account deletion | **NOT APPLICABLE** — no accounts exist; do not build one |
| Permissions | **COMPLIANT/READY** |
| Misleading-claim risk | **ACTION REQUIRED** — enforce evidence-based copy only, no absolute privacy claims, when writing the actual Play Store listing |
