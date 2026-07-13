# Flockora — Project Context

**Purpose of this document:** Permanent project memory and handover document for any AI coding agent or developer working on Flockora in the future. This document reflects the codebase as it actually exists, verified by direct inspection, not by assumption or prior conversation history.

**Last verified:** 2026-07-13, against commit `18d25dd` on branch `main`, updated for Phase 3 Sprint 3.1 (secure AI backend foundation), Sprint 3.2 (real camera capture + mobile-to-backend integration), and a Core Flock Management sprint that extended the existing (already-real, SQLite-backed) Bird & Flock module rather than rebuilding it — see §5.2 and §4.

---

## 1. Project Overview

**Flockora** is a mobile-first flock care, hatching, breeding, and bird management app for backyard poultry keepers and hobby breeders. Tagline: *"Care. Hatch. Breed. Protect."*

- **Core purpose:** Replace notebooks/spreadsheets for people who keep and breed backyard birds (chickens, quail, ducks, turkeys, geese, guinea fowl, pheasants, peafowl) with a warm, simple, camera-and-voice-first mobile app.
- **Target users:** Western (US/UK/Canada/Australia) backyard poultry keepers with mixed flocks, hobby breeders, small breeders outgrowing spreadsheets, households sharing bird care, and people who hatch birds at home. Explicitly **not** targeted at large industrial poultry operations.
- **Main product concept:** Four pillars — **Today** (what needs attention now), **Care** (daily flock stewardship: birds, eggs, feed, health), **Hatch** (incubation, candling, hatch tracking), **Breed** (pairings, lineage, fertility/hatch performance) — plus a **Protect** pillar for health awareness. Full philosophy, rules, and design language are defined in [`PRODUCT_CONSTITUTION.md`](PRODUCT_CONSTITUTION.md) at the repo root — **read that file first**, it is the authoritative product spec this codebase implements phase by phase.
- **Guiding UX principle (constitution §2):** "Less typing. More understanding." AI prepares, the human confirms, the system calculates — data is never silently upgraded from AI-proposed to verified fact.

## 2. Current Tech Stack

- **Frontend:** React Native 0.81.5 + Expo SDK 54 (`~54.0.34`), managed workflow, TypeScript 5.9 (`strict: true`), React 19.1.
- **Navigation:** React Navigation v7 — `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`.
- **Database:** `expo-sqlite ~16.0.10`, local on-device only (class-based `SQLiteProvider` / `useSQLiteContext` API). **No backend/cloud database exists yet.**
- **Backend:** A minimal Node.js/Express/TypeScript backend exists at [`flockora-backend/`](flockora-backend/) — see §14 for full detail. As of Sprint 3.2, it **is now called by the mobile client** (onboarding's bird-photo analysis step), but is still backed entirely by a mocked AI provider — **no real AI provider, no paid API key, exists anywhere in the repository.** Not deployed anywhere yet; the client currently reaches it only over the local dev LAN (see §14.7). The constitution (§15) names Supabase/Supabase Auth/Supabase Storage as the intended future primary backend; this Express service is specifically the AI-request gateway named in `SECURITY.md` Rule 4, not a replacement for that broader plan. None of `@supabase/*` appears anywhere in either `package.json`.
- **Authentication:** **None implemented anywhere in the system** — neither the mobile client nor the backend. No login/signup screens, no auth state, no user accounts, no session/token logic. Both the app and the backend are effectively single-tenant today; the backend's rate limiting is IP-based only as a direct consequence (see §14.3).
- **Hosting/deployment:** Not configured for either the client or the backend. No EAS config for the client; no deployment target (Render/Railway/Fly/Cloud Run/etc.) chosen yet for the backend. `expo-doctor` and `expo export` remain the client's local validation gates; `tsc --noEmit` / `npm run build` / a local start-and-curl smoke test are the backend's.
- **AI services:** **None integrated with a real provider anywhere.** As of Sprint 3.2, the onboarding "AI photo analysis" flow ([`AIPhotoAnalysisLoadingScreen.tsx`](flockora-app/src/screens/AIPhotoAnalysisLoadingScreen.tsx)) now captures a real photo and uploads it to the Flockora backend's `POST /api/v1/analyze-bird` — but that endpoint is still served entirely by `MockAIProvider` (see §14.2/§14.7). The client never calls Gemini/OpenAI/Claude or any AI provider directly, and holds no AI provider key of any kind — its only network call target is Flockora's own backend. The constitution names Gemini multimodal API as the intended future provider (§15); the backend's provider abstraction is what a future sprint will implement it behind.
- **Camera/media:** `expo-image-picker ~17.0.11` (added Sprint 3.2) — real camera capture and gallery selection for the onboarding bird-photo flow, the app's first use of device camera/photo-library permissions. `expo-constants ~18.0.13` (added Sprint 3.2) — used only to derive the local dev-server LAN host for reaching the backend from a physical device (see §14.7); not used for anything else.
- **Notifications:** `expo-notifications ~0.32.17`, fully implemented and real (local scheduled notifications only, no push infrastructure).
- **File export/sharing:** `expo-file-system ~19.0.23` (new `File`/`Paths` class API) + `expo-sharing ~14.0.8`, used for CSV export.
- **Fonts:** `@expo-google-fonts/nunito` (Nunito Sans family per constitution §11), loaded via `expo-font`.
- **Icons:** `@expo/vector-icons` (Ionicons).
- **Subscriptions:** Not integrated. Constitution (§15) names RevenueCat as the intended future provider; no trace of it in the codebase.

## 3. Project Architecture

Flockora follows a layered architecture, deliberately separating UI from data access and business logic (per constitution §15, "avoid giant components, avoid duplicated business logic inside UI screens").

The repository root now contains two independent projects: `flockora-app/` (the Expo mobile client, detailed below) and, as of Phase 3 Sprint 3.1, `flockora-backend/` (a minimal Node/Express service — see §14). They are not a monorepo with shared tooling, just two sibling directories in one git repository; the client has no dependency on the backend today (it doesn't call it yet).

```
flockora-app/
├── App.tsx                  — app entry: font loading, SQLiteProvider + migration hook, notification handler
├── index.ts                 — Expo entry point (registers App.tsx)
├── app.json                 — Expo config (plugins: expo-font, expo-sqlite, expo-notifications)
├── src/
│   ├── db/
│   │   ├── migrations.ts    — single versioned migration file (see §4)
│   │   └── repositories/    — one file per domain; plain objects of async functions taking `db` as first arg
│   ├── types/                — one file per domain: plain TypeScript types + `createEmptyXInput()` factories
│   ├── hooks/                 — one hook per data shape; useSQLiteContext + useState + useFocusEffect-based refresh
│   ├── screens/               — one file per screen, grouped conceptually by feature but flat in the filesystem
│   ├── components/            — shared, reusable UI primitives and feature-specific rows/modals
│   ├── navigation/             — one param-list `types.ts` file per stack + one `XStack.tsx` navigator per stack
│   ├── context/                — React Context providers (currently just onboarding)
│   ├── data/                   — static reference data/config tables (species options, task types, incubation periods, mock AI data)
│   ├── utils/                   — pure calculation/formatting helpers, no side effects
│   ├── services/                 — cross-cutting service modules (currently just notificationService.ts)
│   └── theme/                    — design tokens (colors, spacing, radii, shadows, typography)
```

### Navigation structure

- **`RootNavigator`** (native-stack, no header) — wraps everything in `OnboardingProvider`, and sequences: `Welcome → BirdTypeSelection → PurposeSelection → AddFirstBird → AIPhotoAnalysisLoading → ReviewConfirmBirdDetails → PersonalizedDashboard → Main`. `Main` renders `AppTabs`.
- **`AppTabs`** (bottom-tabs, 5 tabs per constitution §13 — "maximum five primary bottom navigation actions"):
  - **Today** → `TodayStack` → `TodayScreen`, `TaskDetailScreen`, `AddEditTaskScreen`
  - **Flock** → `FlockStack` (the largest stack; hosts Bird, Egg, Feed, and Breeding feature hubs — see §5)
  - **Camera/Add** → `CameraSheetScreen` directly (not a stack) — **UI-only placeholder**, see §6
  - **Pulse** → `PulseStack` → `PulseHomeScreen` (cross-flock health record search/filter)
  - **More** → inline `PlaceholderScreen` — **not implemented**, see §6
- Cross-tab navigation (e.g. jumping from a Pulse health record to that bird's profile in the Flock tab) uses `navigation.getParent()?.dispatch(CommonActions.navigate(...))` rather than duplicating detail screens across stacks (see [`PulseHomeScreen.tsx:80-87`](flockora-app/src/screens/PulseHomeScreen.tsx)).

### Key architectural files

| File | Purpose |
|---|---|
| [`App.tsx`](flockora-app/App.tsx) | Loads Nunito fonts, sets the global notification handler, wraps the app in `SQLiteProvider` (runs `migrateDbIfNeeded` on init via Suspense) |
| [`src/db/migrations.ts`](flockora-app/src/db/migrations.ts) | Single source of DB schema truth — see §4 |
| [`src/theme/index.ts`](flockora-app/src/theme/index.ts) | All design tokens: colors match constitution §10 exactly, spacing/radii/shadows/typography scales |
| [`src/navigation/*Types.ts`](flockora-app/src/navigation) | One `XStackParamList` per stack, consumed by both the navigator and every screen's `NativeStackScreenProps<X, 'ScreenName'>` |
| [`src/context/OnboardingContext.tsx`](flockora-app/src/context/OnboardingContext.tsx) | Holds in-memory onboarding draft state (species, purposes, bird draft) until the first bird + flock are persisted to SQLite at the end of onboarding |
| [`src/services/notificationService.ts`](flockora-app/src/services/notificationService.ts) | Every local-notification scheduling function in the app lives here (task reminders, health reminders, feed expiry/low-stock/out-of-stock, candling/hatch reminders) |

## 4. Database and Data Structure

Single local SQLite database, file name `flockora.db`, managed entirely through [`src/db/migrations.ts`](flockora-app/src/db/migrations.ts). **No cloud sync, no server-side database exists.**

- **Migration pattern:** one file, a module-level `DATABASE_VERSION` constant (currently **7**), and sequential `if (currentVersion === N) { ...; currentVersion = N+1; }` blocks run against `PRAGMA user_version`. Each block is idempotent (`CREATE TABLE IF NOT EXISTS` / additive `ALTER TABLE ... ADD COLUMN`). `PRAGMA foreign_keys = ON` is set unconditionally on every app start, and `PRAGMA journal_mode = WAL` was set during the v0→v1 migration.
- **To add a new table/column:** bump `DATABASE_VERSION`, append a new `if (currentVersion === 7) { ...; currentVersion = 8; }` block — never edit prior blocks (they may already have run against real user devices, even though this app has no production users yet).

### Tables (as of version 7)

| Table | Key columns | Notes |
|---|---|---|
| `flocks` | `id, name, species, breed, purpose, notes, createdAt, updatedAt` | Named groupings of birds. `species`/`breed`/`purpose`/`notes` added in v7 (Core Flock Management sprint) — all nullable, since a group can be mixed-species/unspecified. `purpose` is one of `pets\|eggs\|breeding\|meat\|mixed\|other` (see `types/flock.ts` `FlockPurpose`) |
| `birds` | `id, name, species, breed, sex, dateOfBirth, ageEstimate, acquisitionDate, color, weight, weightUnit, notes, photoUri, tagId, isActive, flockId, createdAt, updatedAt` | `flockId` → `flocks(id)` `ON DELETE SET NULL`. `isActive` used to soft-retire birds rather than delete (constitution §17: "Bird records should normally be archived rather than permanently deleted"). `tagId` (leg band / tag identifier) added in v7 |
| `tasks` | `id, birdId, flockId, type, title, description, dueDate, repeatType, completed, completedAt, notificationEnabled, notificationId, createdAt, updatedAt` | `birdId` → `birds(id)` `ON DELETE CASCADE`; `flockId` `ON DELETE SET NULL` |
| `health_records` | `id, birdId, type, title, notes, medicine, dosage, startDate, endDate, veterinarian, cost, reminderDate, status, notificationId, createdAt, updatedAt` | `birdId` `ON DELETE CASCADE` (health history is bird-specific, not preserved past bird deletion) |
| `egg_records` | `id, flockId, birdId, date, totalEggs, fertileEggs, crackedEggs, dirtyEggs, doubleYolkEggs, notes, createdAt, updatedAt` | Both FKs `ON DELETE SET NULL` — production history is preserved even if the flock/bird is later removed |
| `feed_items` | `id, name, feedType, brand, quantity, unit, lowStockThreshold, costPerUnit, purchaseDate, expiryDate, notes, notificationId, createdAt, updatedAt` | Inventory items |
| `feed_logs` | `id, feedItemId, flockId, birdId, quantityUsed, unit, date, notes, createdAt, updatedAt` | `feedItemId` `ON DELETE CASCADE`; `flockId`/`birdId` `ON DELETE SET NULL` |
| `breeding_pairs` | `id, maleBirdId, femaleBirdId, pairName, pairedDate, separatedDate, status, notes, createdAt, updatedAt` | Both bird FKs `ON DELETE CASCADE` — a pair record can't outlive either bird |
| `clutches` | `id, breedingPairId, flockId, clutchName, laidDate, totalEggs, incubationType, incubatorName, incubationStartDate, expectedHatchDate, actualHatchDate, status, notes, candlingNotificationId, hatchExpectedNotificationId, hatchDueNotificationId, createdAt, updatedAt` | `breedingPairId`/`flockId` `ON DELETE SET NULL` — hatch/candling history intentionally outlives the pair or flock |
| `candling_records` | `id, clutchId, date, fertileEggs, infertileEggs, uncertainEggs, deadEmbryos, notes, createdAt, updatedAt` | `clutchId` `ON DELETE CASCADE` |
| `hatch_records` | `id, clutchId, hatchedEggs, failedEggs, assistedHatches, hatchDate, notes, birdsCreated, createdAt, updatedAt` | `clutchId` `ON DELETE CASCADE`; `birdsCreated` is a 0/1 guard flag preventing double bird-creation from one hatch record |

Indexes exist on essentially every foreign key and every date/status column used for filtering (see migration file for the exhaustive list).

### Local storage usage beyond SQLite

- No `AsyncStorage`/`SecureStore` usage found anywhere in `src/`.
- CSV export ([`src/utils/eggExport.ts`](flockora-app/src/utils/eggExport.ts)) writes a temporary file to `Paths.cache` via the new `expo-file-system` `File` class, then hands it to `expo-sharing` — the file is not a persistent data store, just an export artifact.

## 5. Implemented Features

Everything below is wired to real SQLite persistence, has a working UI, and (where notifications are relevant) real `expo-notifications` scheduling — not mock data.

### 5.1 Onboarding flow
First-run sequence collecting the user's first bird and establishing initial state, ending in a bottom-tab `Main` app.
- Files: `WelcomeScreen`, `BirdTypeSelectionScreen`, `PurposeSelectionScreen`, `AddFirstBirdScreen`, `AIPhotoAnalysisLoadingScreen`, `ReviewConfirmBirdDetailsScreen`, `PersonalizedDashboardScreen`, `OnboardingContext`; plus (added Sprint 3.2) `services/imagePickerService.ts`, `services/birdAnalysisService.ts`, `config/backendConfig.ts`.
- Logic: species/purpose selection populate `OnboardingContext`. As of Sprint 3.2, `AddFirstBirdScreen` captures a **real photo** via device camera or gallery (`expo-image-picker`, permissions requested only on tap, with a preview + Retake/Choose Another Photo step), and `AIPhotoAnalysisLoadingScreen` uploads it to the Flockora backend's `/api/v1/analyze-bird` (still served by `MockAIProvider` — see §14.7) rather than reading a local mock table. The review step lets the user confirm/edit every AI-proposed field before it is persisted, and now also handles the case where analysis fails or is skipped (fields simply start blank/editable instead of AI-proposed) — this is the concrete implementation of the constitution's "AI proposes, human confirms" rule (§8) for the one place AI currently touches the app.

### 5.2 Bird & Flock management (`FlockStack` root)
- Files: `FlockHomeScreen`, `BirdProfileScreen`, `AddEditBirdScreen`, `AddEditFlockScreen` (added in the Core Flock Management sprint), `birdRepository.ts`, `flockRepository.ts`, `useBirds`/`useBird`/`useFlocks`/`useFlockDashboardStats` hooks, `utils/flockSummary.ts`, `data/flockPurposeTypes.ts`, `BirdListRow`, `FlockManagerModal`, `BirdPickerModal`.
- **Flock Dashboard** (`FlockHomeScreen`, rebuilt): a 4-card summary grid (Total Birds; Species/Groups; Males/Females with an Unknown subtitle; Care Alerts, sourced by reusing `healthRecordRepository.getDashboardStats`'s `healthAlerts` + `vaccinationsDue`) computed by `useFlockDashboardStats()` → `computeFlockSummary()` (a pure function in `utils/flockSummary.ts`). Below that: a search box (name or tag/band ID) plus Species and Sex filter-chip rows (client-side filtering over the already-fetched bird list, mirroring the existing `PulseHomeScreen` filter pattern), the existing per-flock chip row (now also showing each flock's purpose icon, plus a trailing dashed "+ New Group" chip), and the bird list.
- **Add/Edit Bird** (`AddEditBirdScreen`): now includes a **Leg Band / Tag ID** field, and photo capture was upgraded from a fake tap-to-toggle mock to **real camera/gallery capture** via `services/imagePickerService.ts` (the same service built for onboarding in Sprint 3.2) — preview, Retake, Choose Another Photo, and permission-denied handling, all matching `AddFirstBirdScreen`'s established pattern. This closes the gap that was explicitly tracked as a known follow-up after Sprint 3.2 (previously: §6/§10 flagged this screen as still using the string `'captured'` as a fake `photoUri`).
- **Bird Profile** (`BirdProfileScreen`): detail rows now include **Species** and **Tag / Band ID** (previously species was only implied via the subtitle, and tag/band ID didn't exist as a field at all).
- **Group/Flock support** (new `AddEditFlockScreen`, full `flockRepository.create`/`update`): a flock/group can now record species (optional — blank means mixed/unspecified), breed, purpose (`pets`/`eggs`/`breeding`/`meat`/`mixed`/`other`, via `data/flockPurposeTypes.ts`), and notes, in addition to its name. Bird count is never stored — always computed live via `flockRepository.listWithCounts`'s `LEFT JOIN`. `FlockManagerModal` keeps its original fast, name-only quick-create/rename/delete flow (now backed by `flockRepository.create(db, input)` taking a full `FlockInput` rather than a bare string) and gained an optional `onEditDetails` callback — when the caller supplies it (only `FlockHomeScreen` does; the flock-picker usage inside `AddEditBirdScreen` does not), an extra icon per row opens the full `AddEditFlockScreen` for that flock.
- Create/edit/soft-deactivate birds, assign to flocks. Flock chip filter on the home list (unchanged mechanism, now enriched as described above).

> **Architecture note on this sprint:** the sprint that added the above was framed as if the Flock tab were still a placeholder needing "mock/local persistence... prepared for real persistence later." It was not a placeholder — this module has used real SQLite persistence since Sprint 2.2. Rather than downgrade to an in-memory mock, the existing repository/SQLite architecture (which already satisfies "typed models," "clean local data/service layer," "no Firebase/Supabase," and "real local persistence" more completely than a mock ever could) was extended in place, per this document's own standing rule not to rebuild completed features. See the sprint's own final report (conversation history) for the full reconciliation reasoning.

### 5.3 Daily Care / Tasks (`TodayStack`)
- Files: `TodayScreen`, `TaskDetailScreen`, `AddEditTaskScreen`, `taskRepository.ts`, `useTodayTasks`/`useTask`/`useTaskStats`, `taskTypes.ts`, `taskSchedule.ts` utils, `TaskRow`.
- Recurring/one-off care tasks per bird or flock, with `repeatType` (`none`/`daily`/`weekly`/`monthly`) driving `expo-notifications` trigger construction (`buildTaskTrigger` in `notificationService.ts`). Today dashboard shows today's tasks with completion toggling (`completeTask`/`reopenTask`).

### 5.4 Bird Health (`PulseStack` + `FlockStack`)
- Files: `AddEditHealthRecordScreen`, `HealthRecordDetailScreen`, `PulseHomeScreen`, `healthRecordRepository.ts`, `healthRecordTypes.ts`, `useHealthRecord(s)`/`useHealthStats`/`useHealthDashboardStats`/`useBirdHealthHistory`, `HealthTimelineRow`.
- Per-bird health record timeline (medication, vet visits, observations) with optional reminder date → single scheduled notification. `PulseHomeScreen` is a cross-flock searchable/filterable health record view (search text, bird, type, status, date), independent of the per-bird timeline shown on `BirdProfileScreen`.

### 5.5 Egg Production (`FlockStack`)
- Files: `EggDashboardScreen`, `AddEditEggRecordScreen`, `EggHistoryScreen`, `eggRecordRepository.ts`, `useEggRecord`/`useEggHistory`/`useEggDashboard`/`useEggStatistics`/`useEggProductionSeries`, `BarChart`, `eggExport.ts`.
- Daily egg logging (total/fertile/cracked/dirty/double-yolk) per flock or bird, dashboard with today/week/month/average stats, a bar chart of production over time, and CSV export via `expo-sharing`.

### 5.6 Feed & Inventory Management (`FlockStack`)
- Files: `FeedInventoryScreen`, `AddEditFeedItemScreen`, `LogFeedUsageScreen`, `FeedHistoryScreen`, `feedRepository.ts`, `feedTypes.ts`, `feedStock.ts`, `useFeedItem(s)`/`useFeedLog`/`useFeedHistory`/`useFeedStatistics`/`useFeedDashboard`, `FeedItemRow`, `FeedItemPickerModal`.
- Feed inventory items with stock quantity, low-stock threshold, expiry date; usage logging decrements stock transactionally. Notifications: expiry warning (fixed days before, via `scheduleFeedExpiryReminder`), immediate low-stock/out-of-stock alerts (`notifyLowStock`/`notifyOutOfStock`, fired via a 1-second `TIME_INTERVAL` trigger rather than `DATE`, functioning as an immediate local alert).

### 5.7 Breeding & Hatching Management (`FlockStack`)
The most recently built and largest feature module.
- Files: `BreedingHubScreen`, `BreedingPairListScreen`, `AddEditBreedingPairScreen`, `ClutchHistoryScreen`, `AddEditClutchScreen`, `ClutchDetailScreen`, `AddEditCandlingRecordScreen`, `AddEditHatchRecordScreen`, `CreateBirdsFromHatchScreen`, `breedingRepository.ts`, `breeding.ts` types, `incubationPeriods.ts`, `birdSex.ts`, `breedingCalc.ts`, 9 hooks (see `src/hooks/index.ts`), `BreedingPairRow`, `ClutchRow`, `BreedingPairPickerModal`.
- **Breeding pairs:** male/female bird pairing with same-bird and confident-sex-mismatch validation (`SameBirdPairingError`, `InvalidSexPairingError` in `breedingRepository.ts`); sex compatibility checked via `classifyBirdSex()` (bounded term list, degrades to "unknown" non-blocking warning rather than hard-blocking on ambiguous data).
- **Clutches:** egg batches linked optionally to a breeding pair and/or flock, natural or incubator-based, with a derived (never stored) `IncubationPhase` — `incubating | due_soon | hatch_due | overdue | completed` — computed from dates via `getIncubationPhase()`. Expected hatch date can be suggested from `incubationPeriods.ts` (species → days table) but is always manually editable.
- **Candling:** per-session fertile/infertile/uncertain/dead-embryo counts, validated against the clutch's `totalEggs` both client-side and repository-side (`CandlingCountExceedsClutchError`). Reducing a clutch's `totalEggs` after candling/hatch records exist is blocked below the recorded sums (`ClutchTotalReductionError`).
- **Hatch records:** one hatch record per clutch (`saveHatchRecord` is create-or-update by `clutchId`), computing hatch rate, fertility rate, and hatchability-of-fertile-eggs, all guarded against divide-by-zero via `safePercent()`.
- **Hatch → bird creation:** `createBirdsFromHatch()` runs inside `db.withTransactionAsync`, reuses `birdRepository.create` for each new bird, and is guarded by the `hatch_records.birdsCreated` flag to prevent duplicate creation (`DuplicateBirdCreationError`).
- **Notifications:** candling reminder (midpoint of incubation), hatch-expected reminder (N days before), hatch-due reminder (on the day) — all in `notificationService.ts`, all reconciled (cancel-then-reschedule) on every clutch save via `setClutchNotificationIds`, and proactively cancelled when a hatch is actually recorded.
- **Dashboard integration:** compact 4-card section on `TodayScreen` (`useBreedingDashboard`) and an entry card on `FlockHomeScreen` linking to the full `BreedingHubScreen`.

### 5.8 Shared UI component library
`AppScreen`, `AppText` (variant-based typography), `PrimaryButton`, `IconButton`, `FormField`, `SegmentedControl`, `SelectableCard`, `StatusPill`, `StatCard`, `SectionHeader`, `EmptyState`, `FadeInUp` (entrance animation), `ProgressBar`/`BarChart` (percentage-height technique), `ConfidenceBadge` (renders the constitution's HIGH/LIKELY/UNSURE states), `EditableFieldModal`, `BirdPhotoBadge`, plus feature-specific rows/pickers (`BirdListRow`, `TaskRow`, `HealthTimelineRow`, `FeedItemRow`, `BreedingPairRow`, `ClutchRow`) and modal pickers (`BirdPickerModal`, `FlockManagerModal`, `FeedItemPickerModal`, `BreedingPairPickerModal`).

## 6. Partially Implemented Features

- **AI photo analysis (onboarding):** As of Sprint 3.2, this now involves **real camera/gallery capture and a real network call** to Flockora's own backend — no longer a pure client-side mock. However, the analysis result itself is still fully simulated: the backend's `/api/v1/analyze-bird` is served entirely by `MockAIProvider` (a hardcoded per-species lookup table), not a real AI model. See §14.7 for the precise real-vs-mocked breakdown.
- ~~`AddEditBirdScreen.tsx` still has its own separate, untouched mock photo-capture~~ — **fixed in the Core Flock Management sprint** (see §5.2): it now uses the same real `imagePickerService` capture as onboarding's `AddFirstBirdScreen`. Any bird saved through this screen *before* that fix may still have the literal string `'captured'` stored as `photoUri` in existing local databases — the screen now guards against rendering that as an image (falls back to the species-icon placeholder) but does not retroactively clean up old rows.
- **Camera / Add tab (`CameraSheetScreen`):** Still renders a title, subtitle, and a list of `PrimaryButton`s for 7 capture targets (Bird, Egg, Medicine, Feed, Health concern, Vet document, Hatch tray) named directly from constitution §5 — **none of the buttons have an `onPress` handler**. `expo-image-picker` now exists in the project (added Sprint 3.2 for onboarding) but this screen does not use it yet. Still a visual placeholder only.
- **"More" tab:** Renders the generic `PlaceholderScreen` with just a title. No settings, no account, no export/reports hub exists yet despite being named in constitution §14 ("Reports and exports", "Subscription system").
- **Voice-first logging (constitution §6):** No code exists for this anywhere — no speech-to-text dependency, no voice UI. Entirely unbuilt.

## 7. Pending Features / Development Roadmap

### Confirmed pending work
Per constitution §14 ("Core Product Areas") and §15 (intended stack), the following are named as intended scope but have zero implementation:
- Real AI analysis of bird photos (Gemini multimodal API) — as of Sprint 3.2, camera capture, gallery selection, and the full client→backend upload path all exist and work end-to-end (§14.7), but the backend still answers every request with `MockAIProvider`'s hardcoded lookup table, not a real model. Camera capture for egg/medicine/feed/health-concern/vet-document (beyond the bird-photo onboarding flow) also remains unbuilt — `CameraSheetScreen`'s 7 capture-target buttons are still non-functional (§6)
- Voice-assisted logging
- Health Guide / Symptom Navigator (curated health-topic content library)
- Family care / multi-user coordination
- Sitter / Away Mode
- Smart notifications beyond what's built (sunrise/sunset-aware coop reminders, weather context)
- Reports and exports beyond the one CSV export (egg production) that exists today
- Subscription system (RevenueCat)
- Supabase backend integration (auth, storage, sync) — the app is currently 100% local-only with no multi-device or cloud story at all
- Species rules engine as a dedicated layer (constitution §16) — currently species-specific logic (e.g. incubation periods) lives in small dedicated files (`incubationPeriods.ts`) rather than a unified rules engine, which is a reasonable incremental step but not the full vision described

### Possible future ideas (mentioned in constitution, not committed work)
- Bird Passport concept (referenced in §14, no dedicated screen/concept exists yet distinct from `BirdProfileScreen`)
- Batch comparison for hatches (§3.3)
- Lineage/pedigree/generations/traits tracking (§3.4) — breeding pairs and clutches exist, but no multi-generation lineage graph or pedigree view

## 8. Important Technical Decisions

- **Local-only SQLite, no backend, built phase-by-phase:** Directly follows constitution §19 ("The application should not be built all at once... developed phase by phase") and §15's explicit instruction not to integrate external services until told to. Each git commit corresponds to one "Sprint" of `PRODUCT_CONSTITUTION.md`-driven work (see `git log`).
- **Repository pattern with `db` as first parameter:** Every repository function takes `SQLiteDatabase` explicitly rather than importing a singleton — keeps data access testable and avoids hidden global state. Reason inferred from consistent pattern across all 7 repository files; not separately documented in-repo.
- **FK delete-behavior split (CASCADE vs SET NULL):** Consistently reasoned in migration comments-equivalent structure (see §4 table) — CASCADE for genuinely dependent child records, SET NULL for records that should survive their parent's deletion to preserve historical data, directly implementing constitution §17 ("Breeding and hatch lineage must preserve historical relationships").
- **Derived state never stored:** Incubation phase, task overdue/completed-today status, and similar UI states are computed on read from stored dates rather than persisted as columns — avoids state going stale. Pattern is consistent across `taskSchedule.ts` and `breedingCalc.ts`.
- **One shared `notificationService.ts` file, extended per module rather than duplicated:** All local notification scheduling logic lives in a single file, growing by one `scheduleXReminder`/`syncXReminder` pair per feature. Reason: keeps `expo-notifications` trigger-construction logic (a real source of subtle bugs across trigger types) in one auditable place.
- **`SQLiteProvider` with `useSuspense` + `Suspense` fallback in `App.tsx`:** Chosen (per expo-sqlite's current API) over manually managing a loading boolean; matches the new class-based expo-sqlite API for SDK 54.
- **Sex classification via bounded term list, not free-text NLP (`birdSex.ts`):** `classifyBirdSex()` matches against a small, code-verified list of terms actually produced elsewhere in the app (`Hen`, `Female`, `Gander`, `Male`, `Unknown`, etc.) rather than attempting general natural-language parsing, and degrades to a non-blocking "unknown" rather than erroring — reduces false-positive validation blocks on ambiguous data entry.
- **`expo-file-system`'s new `File`/`Directory`/`Paths` class API used for CSV export**, not the legacy path-string API — matches SDK 54's current API surface.

## 9. Important Product and UI Behaviour

- **Feature-hub navigation pattern:** Every major feature (Egg, Feed, Breeding) follows the same shape — an entry card on `FlockHomeScreen` → a dedicated hub screen with its own stats/quick-actions → Add/Edit forms and History/Detail screens, all registered as additional routes inside the existing `FlockStack` (never a new bottom tab, per constitution §13's 5-tab limit). `TodayScreen` gets a compact 4-card "preview" summary section per module — visually and functionally distinct from (shallower than) the module's own full hub screen.
- **Confidence states (constitution §4/§8):** `HIGH`/`LIKELY`/`UNSURE` are a first-class type (`ConfidenceLevel` in `src/types/onboarding.ts`) rendered via the `ConfidenceBadge` component, currently only exercised by the mocked onboarding AI-analysis flow.
- **Today dashboard (`TodayScreen`):** Single scrollable screen combining: today's task progress bar + task list, then stacked summary-card sections for Flock Health, Egg Production, Feed, and Breeding — each section pulls from its own `useXDashboard`/`useXDashboardStats` hook, all independent, all refreshing via `useFocusEffect`.
- **Filtered-list hooks pattern:** Hooks that take filter objects (e.g. `useHealthRecords(filters)`, `useClutches(filters)`) use a plain `useEffect` keyed on primitive filter fields (not the filters object reference) to avoid stale-closure/reference-equality refresh bugs, in addition to `useFocusEffect` for on-navigation-return refresh.
- **Error handling convention:** Business-rule violations are custom typed `Error` subclasses thrown from repositories (e.g. `InsufficientStockError`, `SameBirdPairingError`, `InvalidSexPairingError`, `CandlingCountExceedsClutchError`, `ClutchTotalReductionError`, `DuplicateBirdCreationError`), caught specifically in the calling screen and shown as a friendly `Alert`, rather than generic try/catch-and-log.
- **Notification reconciliation:** Every editable entity with a scheduled reminder uses a cancel-then-reschedule pattern (`syncXReminder(entity, previousNotificationId)`) on every save, so stale notifications never accumulate when due dates/settings change.

## 10. Known Issues and Technical Debt

- **Camera/Add tab and "More" tab are non-functional placeholders** — see §6. Any future agent should not assume these are "broken," they were never wired up.
- **Onboarding AI *analysis result* is still mocked, but the capture/upload pipeline around it is now real** (Sprint 3.2) — see §6/§14.7. If a future task involves "adding real AI," the camera, permissions, upload, error-handling, and review UI are already done; only the backend's `MockAIProvider` needs replacing with a real provider behind the existing `AIProvider` interface — no client changes should be needed.
- ~~`AddEditBirdScreen.tsx`'s photo capture is still the old mock~~ — **fixed in the Core Flock Management sprint**: it now uses real `imagePickerService` capture, same as onboarding.
- **No automated test suite exists** — no `__tests__` directories, no Jest/Detox config, nothing in `package.json`'s `devDependencies` beyond `@types/react` and `typescript`. Quality gates historically used for this project are `tsc --noEmit`, `expo-doctor`, `expo export`, and a manual unused-import sweep (`tsc --noEmit --noUnusedLocals --noUnusedParameters`) — not unit/integration tests.
- **5 pre-existing unused-import/variable lint findings**, none introduced by recent breeding work, never cleaned up (low priority, cosmetic): unused `radii` in `FloatingCameraButton.tsx`, unused `spacing` in `IconButton.tsx`, unused `colors` in `SectionHeader.tsx`, unused `radii` in `StatusPill.tsx`, unused `Platform` in `theme/index.ts`.
- **No `.env` or secrets files found in the repo** (client or backend) — nothing to leak, but also confirms no API keys are configured yet for any external service (consistent with §2/§14: the new backend exists but holds no real secrets or provider integration).
- **Backend has no automated test suite either** — validated this sprint via `tsc --noEmit`, a local build, and manual `curl` smoke tests (documented in §14.5), not unit/integration tests. Same gap as the client (see above).
- **`AGENTS.md` at the repo root instructs any agent to read Expo SDK 54's versioned docs before writing code** — a live instruction, not stale debt; worth honoring for any future work touching Expo APIs.

## 11. Environment and Configuration

### Client (`flockora-app/`)
- **Environment variables:** One optional variable as of Sprint 3.2: `EXPO_PUBLIC_BACKEND_URL` (see `src/config/backendConfig.ts`) — an optional override for the backend's base URL. **Not a secret** (see `SECURITY.md`'s Sprint 3.2 Implementation Log entry for why this is compliant with Rule 2); unset by default, in which case the URL is auto-derived from the Expo dev server's LAN host. No `.env` file exists or is required for local development.
- **Configuration files:**
  - `flockora-app/app.json` — Expo app config (name/slug/orientation/icons/splash/plugins: `expo-font`, `expo-sqlite`, `expo-notifications`, and as of Sprint 3.2, `expo-image-picker` with custom camera/photo-library permission strings and `microphonePermission: false`)
  - `flockora-app/tsconfig.json` — extends `expo/tsconfig.base`, `strict: true`
  - `flockora-app/package.json` — dependencies/scripts (see §2)
  - `flockora-app/CLAUDE.md` → references `@AGENTS.md`
  - `flockora-app/AGENTS.md` — instructs reading Expo SDK 54 versioned docs before coding
- **Platform permissions (added Sprint 3.2, justified per `SECURITY.md` Rule 12):** Camera and photo-library access, both requested lazily (only when the user taps "Take Photo" / "Choose from Gallery" in onboarding, never on screen mount), both with specific custom usage-description strings explaining the bird-photo use case, both with clear permission-denied handling (`Alert` offering the other capture method and, if permanently denied, a link to device Settings). `microphonePermission` explicitly set to `false` in the `expo-image-picker` plugin config to prevent the library's default `RECORD_AUDIO` Android permission from being added — Flockora only ever captures still photos.
- **Development commands** (run from `flockora-app/`):
  - `npm start` — `expo start`
  - `npm run android` / `npm run ios` / `npm run web` — platform-specific dev servers
  - `npm run typecheck` — `tsc --noEmit`
- **Validation commands historically used before every commit** (not in `package.json` scripts, run ad hoc):
  - `npx tsc --noEmit` — type check
  - `npx tsc --noEmit --noUnusedLocals --noUnusedParameters` — unused-import/variable sweep
  - `npx expo-doctor` — Expo project health check
  - `npx expo export` — production bundle export sanity check
- **Deployment:** Not configured — no EAS build profiles, no store listings.

### Backend (`flockora-backend/`) — added Phase 3 Sprint 3.1
- **Environment variables (names only — see `flockora-backend/.env.example`, no real values ever committed):** `PORT`, `NODE_ENV`, `AI_PROVIDER` (only `"mock"` valid today), `MAX_UPLOAD_MB`, `RATE_LIMIT_WINDOW_MINUTES`, `RATE_LIMIT_MAX_REQUESTS`, `REQUEST_TIMEOUT_MS`, `ALLOWED_ORIGINS`. Validated at startup via a `zod` schema in `src/config/env.ts`; the process exits with a names-only error if anything required is missing or invalid.
- **Configuration files:** `flockora-backend/package.json`, `flockora-backend/tsconfig.json`, `flockora-backend/.gitignore` (excludes `.env`, `.env.*`, `node_modules/`, `dist/`), `flockora-backend/.env.example` (template, no secrets).
- **Development commands** (run from `flockora-backend/`):
  - `npm run dev` — `tsx watch src/index.ts`
  - `npm run build` — `tsc` (outputs to `dist/`)
  - `npm start` — `node dist/index.js` (runs the built output)
  - `npm run typecheck` — `tsc --noEmit`
- **Deployment:** Not configured — no hosting platform chosen yet; runs locally only.

### Shared
- Root `PRODUCT_CONSTITUTION.md` — the authoritative product spec (applies to the whole product, not just the client)
- **Git remote:** `https://github.com/satyamkirti/flockora-app.git`, branch `main`. Git identity locally configured as `satyamkirti` / `satyam.kirti@gmail.com`. Both `flockora-app/` and `flockora-backend/` live in this single repository.

## 12. Safe Development Instructions for Future AI Agents

1. **Read [`PRODUCT_CONSTITUTION.md`](PRODUCT_CONSTITUTION.md) first**, then this file, before starting any new work.
2. **Review the relevant existing code** (repository, hooks, screens, navigation types for the feature area) before making changes — don't assume structure from memory or from this document alone; re-verify against the live codebase, since it will keep changing.
3. **Do not rebuild completed features unnecessarily.** Sections §5 of this document lists what's genuinely done — reuse it.
4. **Do not overwrite working functionality without understanding dependencies** — e.g. `notificationService.ts`, the shared component library, and the repository pattern are relied upon by every feature module; changing their shape has wide blast radius.
5. **Preserve existing architecture** (repository pattern, one-hook-per-data-shape, versioned single-file migrations, feature-hub navigation) **unless a change is specifically required and explained.**
6. **Make small, controlled changes** scoped to the requested phase/sprint — per constitution §19, "do not add major unrequested features."
7. **Test changes before marking work complete.** At minimum: `tsc --noEmit`, `expo-doctor`, `expo export`, and the unused-import sweep. For UI changes, actually run the app and exercise the feature — type-checking is not feature verification.
8. **Update this file (`PROJECT_CONTEXT.md`) after major features or architectural changes** — keep §5 (Implemented), §6 (Partial), §7 (Pending), and §10 (Known Issues) current.
9. **Never store secrets in this file.** If environment variables are introduced in the future, document them by name only in §11.
10. **When something in this document conflicts with the actual code, trust the code** — this file is a snapshot, verified as of the date at the top; it decays over time.

## 13. Current Project Status

- **Development stage:** Phase 2 (7 feature sprints, local-only client) is complete. Phase 3 is in progress: Sprint 3.1 (Secure AI Backend Foundation) and Sprint 3.2 (Real Camera Capture + Mobile-to-Backend Integration) are complete — see §14 for full detail. A Core Flock Management sprint (extending, not replacing, the Sprint 2.2 Bird & Flock module — see §5.2) is also complete.
- **What is completed (Phase 2, client):** See §5 in full. In one line — a fully local, notification-enabled poultry care app covering birds, flocks (now with species/breed/purpose/notes and a real dashboard with search/filter), daily tasks, health records, egg production (with CSV export), feed inventory, and breeding/hatching/incubation tracking, all built on a consistent repository/hook/screen architecture.
- **What is completed (Phase 3):** A standalone backend service (`flockora-backend/`) with a `/api/v1/analyze-bird` endpoint, full request validation/rate-limiting/timeout/error-handling architecture, and a provider abstraction ready for a real AI provider (Sprint 3.1) — and the mobile client now genuinely calls it: real camera/gallery capture, a centralized upload service with full error-state handling, and a review screen that gracefully degrades to manual entry (Sprint 3.2). The AI *result* itself is still entirely mocked (`MockAIProvider`) — **no real AI provider or secret exists anywhere in the repository.** See §14.
- **What is currently being worked on:** Nothing in-flight — the Core Flock Management sprint is complete, quality-gated, and committed. The repository is in a clean, stable state.
- **Recommended next development step:** Per `SECURITY.md`, real AI integration (wiring a real provider like Gemini behind the backend's existing `AIProvider` abstraction — no client changes should be required, since the client already speaks the real request/response contract as of Sprint 3.2 — plus per-user/global usage controls) is the natural next step. Per `SECURITY.md` Rule 11, adding authentication (a prerequisite for real per-user rate limiting per Rule 7) should be considered first or alongside it — the backend currently has no user identity to key quotas on. **This is a suggestion, not a decision — confirm direction with the product owner before starting a new phase**, per constitution §19's phase-by-phase development rule, and per `SECURITY.md` Rule 15, real AI integration or auth each require a fresh security audit before shipping.

## 14. Backend — Secure AI Gateway (Phase 3 Sprint 3.1)

### 14.1 Why this exists

`SECURITY.md` Rules 3–5 require that no paid AI provider (Gemini/OpenAI/Claude/etc.) is ever called directly from the mobile client with a secret key, and that all such requests are proxied through a backend holding the secret server-side. This backend is that gateway. It was built **before** any real provider integration specifically so the request/response architecture, validation, and abuse-protection scaffolding could be established and reviewed while the security stakes were still zero (no real key, no billing risk, no real user data in transit).

### 14.2 Architecture

```
Flockora App (Expo/RN)  ── HTTPS (not yet wired up) ──▶  Flockora Backend API  ──▶  AI Provider (not yet integrated)
```

- **Location:** [`flockora-backend/`](flockora-backend/) — a sibling directory to `flockora-app/` in the same repository, not a separate repo.
- **Stack:** Node.js + TypeScript (`strict: true`) + Express 4, `zod` for schema validation, `multer` (v2.x) for multipart file handling, `helmet` for security headers, `express-rate-limit` for rate limiting, `dotenv` for local env loading.
- **Entry point:** [`src/index.ts`](flockora-backend/src/index.ts) starts the server; [`src/app.ts`](flockora-backend/src/app.ts) assembles the Express app and defines middleware order (security headers → CORS → request ID → timeout guard → body size limits → routes → 404 handler → centralized error handler, in that order — the error handler must be last per Express convention).
- **Provider abstraction** ([`src/providers/`](flockora-backend/src/providers/)): `AIProvider` is the interface every provider implements (`analyzeBird(input): Promise<AnalyzeBirdResult>`). `MockAIProvider` is the only implementation that exists today — deterministic, offline, per-species canned responses, no network call, no file bytes retained. `providerFactory.ts` selects the active provider from the `AI_PROVIDER` env var (only `"mock"` is a valid value right now — the zod schema in `src/config/env.ts` will reject anything else at startup). **Adding a real provider (e.g. `GeminiProvider`) in a future sprint means adding one new file plus one new `case` in `providerFactory.ts` and one new enum value in `env.ts` — nothing in `src/routes/` or the mobile client's contract needs to change.**
- **Response shape** deliberately mirrors the client's existing `AIAnalysisResult` type (`flockora-app/src/types/onboarding.ts`: `breed`/`sex`/`color`/`lifeStage`, each `{ value, confidence: 'HIGH'|'LIKELY'|'UNSURE' }`) so that wiring the client to this backend later is a data-source swap, not a UI/type rework.

### 14.3 Endpoint structure

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness check, no auth, returns `{ status: 'ok' }` |
| `POST` | `/api/v1/analyze-bird` | The only AI-facing endpoint. `multipart/form-data`: `photo` (file, required, JPEG/PNG/WEBP only, size-capped via `MAX_UPLOAD_MB`), `speciesHint` (string, optional, validated against the 8-species enum). Returns `{ requestId, provider, result }` on success. |

Every response — success or error — includes an `X-Request-Id` header and a matching `requestId` field in the JSON body, generated per-request server-side (`src/middleware/requestId.ts`), for traceability without needing to log anything sensitive.

### 14.4 Security boundary

- The mobile client **cannot** call an AI provider directly today — it has no AI provider code of any kind, mocked or real, and makes zero network calls (unchanged from before this sprint).
- The backend **cannot** call a real AI provider today either — only `MockAIProvider` exists; no provider SDK, no API key, no network call to any external AI service exists anywhere in `flockora-backend/`.
- No secret of any kind exists in this codebase. `flockora-backend/.env.example` documents variable *names* only (`PORT`, `NODE_ENV`, `AI_PROVIDER`, `MAX_UPLOAD_MB`, rate-limit/timeout/CORS settings) — no values that could be mistaken for real secrets, and it explicitly documents that future provider keys must never be added to this file with real values (per `SECURITY.md` Rules 1, 2, 5).
- `flockora-backend/.gitignore` excludes `.env`, `.env.*` (with an explicit `!.env.example` exception), `node_modules/`, and `dist/` — verified via `git add --dry-run` that none of these are staged.
- **Rate limiting is IP-based only** (`express-rate-limit`, applied to `/api/v1/analyze-bird`), because no authentication exists anywhere in Flockora yet — there is no user identity to key a per-user quota on. This is explicitly documented as incomplete against `SECURITY.md` Rule 7 (see §14.5) — it is not a substitute for per-user/global usage controls, which are required before a real, billable provider is connected.
- Logging (`src/utils/logger.ts`) is type-constrained to a fixed, narrow field set (`requestId`, `route`, `statusCode`, `provider`, `mimeType`, `sizeBytes`, `code`) — there is no code path by which a request body, uploaded file, header value, or future auth token could be logged. Verified by manual review of every `logger.*` call site and by running the server locally and inspecting actual log output.

### 14.5 Mocked provider status — what's real vs. simulated

| Aspect | Status |
|---|---|
| HTTP server, routing, middleware chain | **Real** — genuinely running, tested locally (start, `/health`, valid upload, invalid MIME, invalid species hint, oversized file, 404, missing file) |
| Request validation (MIME allowlist, size limit, species enum) | **Real** — enforced by `multer` + `zod`, verified to reject bad input with correct 400/413-equivalent responses |
| Rate limiting | **Real mechanism, incomplete policy** — actual `express-rate-limit` middleware is active and returns `RateLimit-*` headers and 429s, but is IP-only (see §14.4) |
| Request timeout | **Real mechanism, untested under real latency** — the middleware is wired and would fire, but the mock provider resolves near-instantly, so this path has not been exercised end-to-end against genuine slow-provider latency |
| Centralized error handling | **Real** — verified for validation errors, multer errors, and the 404 path |
| AI analysis result | **Fully simulated** — `MockAIProvider` returns a hardcoded lookup table keyed by `speciesHint`, defaulting to `chicken`. No image is actually analyzed; the uploaded file's *bytes* are validated (type/size) but never inspected for content. |
| Environment variable validation | **Real** — `src/config/env.ts` uses a `zod` schema and calls `process.exit(1)` with a safe (names-only) error message if required vars are missing/invalid; verified by the app failing to start against a malformed `.env` during manual testing |

### 14.6 Remaining work before real AI integration

Explicitly not done in this sprint, required before `MockAIProvider` is replaced with a real provider:

1. **A real `AIProvider` implementation** (e.g. `GeminiProvider`) calling an actual AI API, with its secret key injected only via the deployment platform's environment/secrets store (`SECURITY.md` Rule 5) — never committed, never in `.env.example` with a real value.
2. **Per-user usage quotas** (`SECURITY.md` Rule 7) — requires an authentication system to exist first (nothing in Flockora has user identity today); the current IP-based rate limiter is not a substitute.
3. **A global usage ceiling / circuit breaker** (`SECURITY.md` Rule 7) to cap total spend/volume across all users.
4. **Deployment** — no hosting platform has been chosen or configured for this backend yet; it currently only runs locally.
5. ~~**Client integration**~~ — **done in Sprint 3.2** (see §14.7). The mobile app's onboarding flow now calls this backend for real; item retained here only for history.
6. **A fresh, dedicated security audit** (`SECURITY.md` Rule 15) — mandatory immediately after real AI integration, and separately if authentication is added first.
7. **Deeper abuse protections** appropriate to a live, billable endpoint — e.g. request signing/attestation from the mobile client, image-content sanity checks, and CAPTCHA-equivalent protections if abuse patterns emerge — none of which are meaningful to design until a real provider and real traffic exist.

### 14.7 Mobile client integration (Phase 3 Sprint 3.2)

The onboarding bird-photo flow now genuinely exercises the full client→backend path end-to-end, though the AI result remains mocked.

**What changed, by file:**
- [`src/services/imagePickerService.ts`](flockora-app/src/services/imagePickerService.ts) (new) — the only place `expo-image-picker` is called. `captureFromCamera()` and `pickFromGallery()` each request their specific permission lazily (only when invoked, never on screen mount) and return a discriminated `PickPhotoOutcome`: `success` (with a `{ uri, mimeType, fileName }` photo), `canceled`, or `permission_denied` (with `canAskAgain` so the UI can offer "Open Settings" only when the OS says re-prompting won't work).
- [`src/services/birdAnalysisService.ts`](flockora-app/src/services/birdAnalysisService.ts) (new) — the **only file in the entire mobile client that calls `fetch`**. `analyzeBirdPhoto()` builds a `multipart/form-data` request (the `photo` file plus an optional `speciesHint` derived from the onboarding species selection), posts it to `${getBackendBaseUrl()}/api/v1/analyze-bird` with a 20-second client-side `AbortController` timeout, and returns a discriminated `BirdAnalysisOutcome`: `success` (with the analysis result, typed identically to the client's existing `AIAnalysisResult`) or `error` (with a `kind` — `invalid_image | payload_too_large | rate_limited | timeout | network | server_error | unknown` — derived from the backend's own safe `code`/`message` response fields, or from a local `fetch` failure/`AbortError` when there's no response at all). Screens never build `FormData` or call `fetch` themselves.
- [`src/config/backendConfig.ts`](flockora-app/src/config/backendConfig.ts) (new) — the single centralized point that resolves the backend's base URL. Resolution order: (1) `EXPO_PUBLIC_BACKEND_URL` if set (an explicit non-secret override), (2) derived from `Constants.expoConfig.hostUri` (the Expo dev server's own LAN host — this is what makes it work from a physical device, where `localhost` would otherwise resolve to the phone itself, not the developer's machine), (3) `http://localhost:8787` as a last-resort fallback for simulators/web. No secret is read or stored here.
- [`src/screens/AddFirstBirdScreen.tsx`](flockora-app/src/screens/AddFirstBirdScreen.tsx) (rewritten) — "Take Photo" and "Choose from Gallery" buttons replace the old fake tap-to-toggle mock. On success, shows a real image preview with "Retake" and "Choose Another Photo" actions. On permission denial, shows a native `Alert` offering the other capture method and, if the OS reports the permission can't be re-prompted, an "Open Settings" action (`Linking.openSettings()`).
- [`src/screens/AIPhotoAnalysisLoadingScreen.tsx`](flockora-app/src/screens/AIPhotoAnalysisLoadingScreen.tsx) (rewritten) — calls `analyzeBirdPhoto()` on mount instead of reading a local mock table. Keeps the existing spinner/status-message UI while loading. On success, behavior is unchanged (stores the result, navigates to Review & Confirm). On failure, replaces the spinner with an error message (using the backend's own client-safe message) plus two actions: "Try Again" (re-runs the same request) and "Enter Details Manually" (proceeds to Review & Confirm with no AI analysis at all).
- [`src/screens/ReviewConfirmBirdDetailsScreen.tsx`](flockora-app/src/screens/ReviewConfirmBirdDetailsScreen.tsx) (updated) — no longer assumes `aiAnalysis` is always present. Each field row now renders and remains editable even when its AI-proposed value is null (showing a muted "Tap to add" placeholder and no confidence badge in that case), preserving "AI prepares, human confirms" even when AI didn't prepare anything. Also fixed a pre-existing bug: this screen previously saved the literal string `'captured'` as the bird's `photoUri` (never a real path); it now saves the real captured photo's URI.
- [`src/types/onboarding.ts`](flockora-app/src/types/onboarding.ts) — `BirdDraft.photoCaptured: boolean` replaced with `BirdDraft.photo: CapturedPhoto | null`, where `CapturedPhoto = { uri: string; mimeType: string; fileName: string }`.
- [`app.json`](flockora-app/app.json) — added the `expo-image-picker` config plugin with custom camera/photo-library permission description strings and `microphonePermission: false` (this app never records audio/video, so that Android permission is explicitly suppressed rather than left in by the plugin's default).

**Confidence model preserved exactly:** the backend's response is typed identically to the client's pre-existing `AIAnalysisResult`/`ConfidenceLevel` (`HIGH | LIKELY | UNSURE`) — no mapping/transformation layer was needed beyond a direct type match, by design (see §14.2 "Response shape").

**What's still mocked vs. real, after this sprint:**

| Aspect | Status |
|---|---|
| Camera capture, gallery selection, permission handling | **Real** |
| Client → backend upload (multipart, real HTTP request over the LAN) | **Real** |
| Client-side error handling (timeout, network, invalid image, payload-too-large, rate-limited, server error) | **Real** — all paths implemented and individually reachable; not exercised against a real physical device or emulator in this sprint (no device/emulator available in the environment this sprint was built in — see validation notes) |
| Review & Confirm screen tolerating missing/failed analysis | **Real** |
| The analysis *result itself* | **Still fully mocked** — `MockAIProvider`, unchanged from Sprint 3.1 |
| Backend reachability outside a local dev LAN (production) | **Not solved** — `EXPO_PUBLIC_BACKEND_URL` exists as an override point for when a deployed backend URL exists, but no such deployment exists yet (§14.6 item 4) |

**Validation performed this sprint:** `tsc --noEmit` (clean), the unused-import/variable sweep (only the same 5 pre-existing, unrelated findings), `expo-doctor` (18/18), `expo export --platform android` (succeeded), and `npm audit` before/after adding `expo-image-picker`/`expo-constants` (identical 12 moderate findings, all pre-existing, zero new). **Not performed:** running the app on a physical device or emulator — no such device/emulator was available in the environment this sprint was implemented in. This is a real gap: the permission-denial UI, the physical-device LAN host derivation, and the camera/gallery pickers themselves are implemented against the documented Expo SDK 54 API exactly, and reviewed by hand, but have not been exercised on an actual device. Recommended before shipping: run through the flow on both a physical Android and iOS device (camera, gallery, permission-deny-then-retry, and a killed-backend scenario for the error states).
