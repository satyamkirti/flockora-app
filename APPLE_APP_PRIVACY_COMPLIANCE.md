# Flockora — Apple App Store Privacy Compliance Matrix

**Audited:** 2026-07-15. Based entirely on `PRIVACY_DATA_AUDIT.md` (same commit/sprint). Every row cites the evidence file(s) behind its classification.

**Classifications used:** `COMPLIANT/READY`, `ACTION REQUIRED`, `NOT APPLICABLE`, `EXTERNAL VERIFICATION REQUIRED`.

---

## 1. Privacy policy URL requirement

| Item | Status |
|---|---|
| Privacy policy URL decided | **COMPLIANT/READY** — `flockora-app/src/config/privacyConfig.ts`'s `PRIVACY_POLICY_URL` constant is set to `https://flockora.com/privacy`, the confirmed final intended location. |
| Privacy policy actually live at that URL | **ACTION REQUIRED — confirmed NOT live as of 2026-07-15.** App Store Connect requires a working link at submission time; this repository cannot publish a webpage. `PRIVACY_POLICY_DRAFT.md` is the content to publish there. The app's in-app link (`PRIVACY_POLICY_URL_IS_PLACEHOLDER = true`, re-corrected this sprint) correctly shows a "not yet published" message rather than opening a dead link until the page is confirmed live. |
| App Store Connect "Privacy Policy URL" field | **ACTION REQUIRED** — set to `https://flockora.com/privacy` once published (App Store Connect action, not a code change). |

## 2. App Privacy disclosure categories (App Store Connect "App Privacy" questionnaire)

| Apple category | Collected? | Status |
|---|---|---|
| Contact Info | No | **NOT APPLICABLE** — no name/email/phone collected anywhere. |
| Health & Fitness | No (bird data, not the human user's health — see the same note as the Google matrix) | **COMPLIANT/READY**, judgment call flagged **EXTERNAL VERIFICATION REQUIRED** against Apple's current published guidance at submission time. |
| Financial Info | No | **NOT APPLICABLE**. |
| Location | No | **NOT APPLICABLE** — no location code or permission anywhere. |
| Sensitive Info | No | **NOT APPLICABLE**. |
| Contacts | No | **NOT APPLICABLE** — no contacts permission or code. |
| User Content — **Photos or Videos** | **Yes** | **ACTION REQUIRED**: declare "Photos or Videos" collected, linked to the user's device session only insofar as it's a single request/response (not linked to any persistent identity — there is none), used for App Functionality, **not used for tracking**. See §5 below on the ephemeral-processing question. |
| Identifiers (User ID, Device ID) | No | **NOT APPLICABLE** — none collected anywhere (`PRIVACY_DATA_AUDIT.md` §11). |
| Purchases | No | **NOT APPLICABLE** — no IAP/subscription integration exists yet. |
| Usage Data | No | **NOT APPLICABLE** — no analytics. |
| Diagnostics (crash data, performance data) | No | **NOT APPLICABLE** — no crash reporting SDK anywhere. |
| Other Data | No | **NOT APPLICABLE**. |

## 3. Data linked to the user

| Item | Status |
|---|---|
| Is the transmitted photo linked to an identifiable user? | **COMPLIANT/READY — Not Linked to the User** | No account, no persistent device/user identifier accompanies the upload (`PRIVACY_DATA_AUDIT.md` §11) — the request carries only the photo, an optional species hint, and a server-generated per-request `requestId` that is not returned to or stored by the client beyond that one response. Declare as "Data Not Linked to You" for this category. |

## 4. Tracking (Apple's ATT-defined "Tracking")

| Item | Status |
|---|---|
| Does Flockora track users across apps/websites owned by other companies, or share data with data brokers, per Apple's definition? | **NOT APPLICABLE — No Tracking** | No advertising SDK, no cross-app/cross-site identifier, no IDFA usage, no data broker relationship exists anywhere in this codebase (`PRIVACY_DATA_AUDIT.md` §9–§11). |
| App Tracking Transparency (ATT) prompt required? | **NOT APPLICABLE** | No tracking occurs, so no ATT prompt is needed or present. |

## 5. Third-party SDK data practices

| Item | Status |
|---|---|
| Any third-party SDK bundled that itself collects data | **NOT APPLICABLE** | Confirmed via full `package.json` review + grep sweep: zero third-party analytics/ad/crash/auth SDKs in either project (`PRIVACY_DATA_AUDIT.md` §9). All dependencies are first-party Expo/React Native/React Navigation modules or, on the backend, general-purpose server infrastructure (Express, multer, helmet, zod, cors, express-rate-limit) — none of which phone home to their own vendor with app data. |

## 6. Account deletion applicability

| Item | Status |
|---|---|
| Does Flockora require account deletion support (Apple Guideline 5.1.1(v))? | **NOT APPLICABLE** | That guideline applies to apps with account creation. Flockora has no accounts anywhere (`PRIVACY_DATA_AUDIT.md` §11). **Do not build an account-deletion flow to satisfy this — it does not apply until/unless Flockora adds real accounts (`SECURITY.md` Rule 11 already gates that with a mandatory dedicated review first).** |

## 7. Permission purpose strings (`Info.plist` usage descriptions)

| Permission | Status |
|---|---|
| `NSCameraUsageDescription` | **COMPLIANT/READY** — populated from the `expo-image-picker` plugin's `cameraPermission` string in `app.json`, which Expo's prebuild generates into `Info.plist` for both platforms from the same config. Specific, non-generic wording ("Flockora uses your camera to take a photo of your bird so it can suggest breed, sex, color, and life stage details for you to confirm."). |
| `NSPhotoLibraryUsageDescription` | **COMPLIANT/READY** — same mechanism, `photosPermission` string. |
| `NSUserNotificationsUsageDescription` (implicit via `expo-notifications`' runtime API, no static string required by iOS for local notifications) | **COMPLIANT/READY** — iOS local notification permission is requested at runtime, not via a static Info.plist string; already justified and working per `PROJECT_CONTEXT.md` §5.17. |
| `NSMicrophoneUsageDescription` | **NOT APPLICABLE** — explicitly suppressed (`microphonePermission: false`); Flockora never requests microphone access. |
| Any other purpose string present without a corresponding feature | **NOT APPLICABLE** — none found. |

## 8. Photo/image access

| Item | Status |
|---|---|
| Purpose disclosed at the OS permission-prompt level | **COMPLIANT/READY** — see §7. |
| Just-in-time disclosure before the photo is actually transmitted (distinct from the OS permission prompt, which only covers *access*, not *transmission*) | **COMPLIANT/READY (fixed this sprint)** — `AddFirstBirdScreen.tsx` now shows a specific notice, before the "Continue" action that triggers upload, stating the photo will be uploaded to Flockora's own server and is not shared with a third party. This directly addresses Apple's general expectation (App Review Guideline 5.1.1) that data collection be clearly disclosed to the user at the point it happens, not only buried in a settings screen. |

## 9. Notification behavior

| Item | Status |
|---|---|
| Local-only, no push infrastructure | **COMPLIANT/READY** — confirmed no push-token code exists anywhere (`PRIVACY_DATA_AUDIT.md` §5); nothing to disclose beyond the permission itself, already covered in §7. |

## 10. User consent / disclosure points

| Item | Status |
|---|---|
| Just-in-time disclosure before the one off-device transmission | **COMPLIANT/READY (fixed this sprint)** — see §8. |
| Dark patterns (pre-checked consent boxes, misleading framing) | **COMPLIANT/READY — none present.** The new disclosure is a plain informational notice, not a consent checkbox; the app never claims AI analysis is optional at the point where a photo is required to proceed (§3 of `PRIVACY_DATA_AUDIT.md` explains why: a photo is required for onboarding, but AI *analysis* of it is not — the "Enter Details Manually" fallback exists only after a request failure, and the new notice does not overstate an alternative that isn't actually available pre-upload). |

## 11. Retention and deletion explanation

| Item | Status |
|---|---|
| Can the app/policy accurately state retention behavior? | **COMPLIANT/READY** — proven by code: on-device data persists until user-deleted or the app is uninstalled; the transmitted photo is not retained server-side at all (memory-only, discarded per-request — `PRIVACY_DATA_AUDIT.md` §2). `PRIVACY_POLICY_DRAFT.md` states this precisely. |

## 12. Privacy choices

| Item | Status |
|---|---|
| Can the user avoid the one data transmission entirely? | **ACTION REQUIRED (disclosure accuracy only, not a missing feature)** — a photo is required to complete onboarding's first-bird step at all; there is currently no "skip photo entirely" path. This is stated as fact, not glossed over, in both this matrix and `PRIVACY_POLICY_DRAFT.md`. It does not block compliance (Apple does not require every data collection to be optional), but the disclosure must not claim otherwise. |

## 13. Misleading privacy claim risk

| Item | Status |
|---|---|
| Absolute claims ("Data Not Collected" for the whole app) | **ACTION REQUIRED — must not be used.** Because the onboarding photo is genuinely collected and transmitted, Flockora **cannot** select "Data Not Collected" as its overall App Privacy answer — it must go through the full questionnaire and declare "Photos or Videos" per §2. Every other category can honestly be "Data Not Collected." |

---

## Overall Apple App Store readiness summary

| Area | Status |
|---|---|
| App Privacy questionnaire — can be filled out accurately today | **COMPLIANT/READY** for every category except Photos or Videos (declare as collected, not linked, not used for tracking, App Functionality purpose) |
| Privacy policy | **ACTION REQUIRED — confirmed not live.** URL decided (`https://flockora.com/privacy`); page content drafted (`PRIVACY_POLICY_DRAFT.md`, still has unresolved `[BUSINESS DECISION REQUIRED]` markers) — outside this repository's control to publish. |
| Tracking / ATT | **NOT APPLICABLE** — no tracking occurs |
| Account deletion | **NOT APPLICABLE** — no accounts exist; do not build one |
| Permission purpose strings | **COMPLIANT/READY** |
| Just-in-time disclosure | **COMPLIANT/READY (fixed this sprint)** |
| Misleading-claim risk | **ACTION REQUIRED** — never select "Data Not Collected" as the overall answer; always disclose the photo category |
