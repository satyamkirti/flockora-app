# Flockora — Real-Device QA Checklist

**Purpose:** A concrete, Flockora-specific test pass to run on a physical Android device (and, where practical, iOS) before any Play Store submission. This complements, and does not replace, the automated gates already used before every commit (`tsc --noEmit`, `expo-doctor`, `expo export`, `npm audit`) — those catch build/type/config regressions; this catches real-device behavior that cannot be verified by static tooling (permission dialogs, notification delivery, deep-links, cold-start behavior, timezone math, gesture handling).

**How to build a test device install:** see the release-readiness sprint entry in [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) for the exact `eas build --profile preview` command. Install the resulting `.apk` directly on a physical Android device (Android 13+ recommended, to exercise the `POST_NOTIFICATIONS` runtime-permission prompt — this is a no-op on Android 12 and below).

**Format:** every row is `ACTION` → `EXPECTED RESULT` → `FAILURE SIGNAL` (what you'd observe if it's broken, so a tester doesn't need to already know the intended behavior to notice a bug).

---

## 1. Fresh install

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 1.1 | Install the `.apk` on a device that has never had Flockora installed, and launch it | App launches to the onboarding `Welcome` screen within a few seconds, no crash, no white/blank screen | Crash on launch, indefinite splash/blank screen, red-box error |
| 1.2 | Force-close and relaunch immediately after first install, before completing onboarding | Returns to the same onboarding step (or `Welcome` if nothing was saved yet) | Crash, or app opens into a broken/partially-initialized `Main` tab state |
| 1.3 | Check device Settings → Apps → Flockora → Permissions right after fresh install (before granting anything) | No permission shows as granted yet — camera/photos/notifications are all requested lazily, only when a relevant action is first taken | Any permission appears pre-granted, or the app requests a permission on launch before the user does anything that needs it |

## 2. Onboarding

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 2.1 | Walk through `Welcome → Bird Type → Purpose → Add First Bird` with realistic values | Each step advances correctly, back navigation preserves prior answers | Lost input on back-navigation, stuck on a step, crash |
| 2.2 | On "Add First Bird", tap "Take Photo" | Camera permission prompt appears (first time only); after granting, camera opens and a captured photo shows a real preview | Permission prompt never appears, camera fails to open, blank/black preview |
| 2.3 | Deny camera permission when prompted, then tap "Take Photo" again | An alert offers "Choose from Gallery" instead; if permission is permanently denied, an "Open Settings" action appears | App crashes, silently does nothing, or offers no alternative path |
| 2.4 | Complete onboarding through "AI Photo Analysis Loading" with no backend reachable (the expected real-device state, since no backend is deployed — see release-readiness notes in `PROJECT_CONTEXT.md`) | Loading screen shows briefly, then a graceful error state with "Try Again" and "Enter Details Manually" — tapping the latter proceeds to Review & Confirm with editable, empty AI fields | App hangs indefinitely on the loading spinner, crashes, or blocks progress with no manual fallback |
| 2.5 | On "Review & Confirm Bird Details", edit every field manually and confirm | Bird + first flock are created; app navigates to `PersonalizedDashboard` then into the main app (`Today` tab) | Save fails silently, wrong/blank values persisted, navigation doesn't advance |
| 2.6 | Force-close the app mid-onboarding (after Add First Bird, before Review & Confirm), then relaunch | Behavior should not corrupt the database — either resumes onboarding cleanly or restarts it; no partial/duplicate bird row should appear once onboarding is eventually completed | A duplicate or half-populated bird/flock row appears after eventually finishing onboarding |

## 3. Flock creation

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 3.1 | Create a new flock with name + species + breed + purpose + notes | Flock appears immediately in the flock list/chip row | Flock missing, wrong field values, crash |
| 3.2 | Create a flock with only a name (all optional fields blank) | Saves successfully — species/breed/purpose/notes are nullable | Validation blocks save, or a null field renders as literal "null"/"undefined" text anywhere |
| 3.3 | Edit an existing flock's name | Change reflected everywhere the flock name is shown (bird lists, chips, dashboards) | Stale name shown in one place after edit elsewhere |
| 3.4 | Delete a flock that has birds assigned to it | Flock is removed; its birds are **not** deleted, and each bird's `flockId` becomes unassigned (per `ON DELETE SET NULL`) | Birds disappear along with the flock, or app crashes on delete |

## 4. Bird creation / edit / delete

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 4.1 | Add a bird with a captured photo, full details, assigned to a flock | Bird appears in the flock's bird list with its real photo (not a species-icon placeholder) | Photo doesn't render, bird missing from list |
| 4.2 | Add a bird via "Choose from Gallery" instead of camera | Same result as 4.1 via the gallery path | Gallery picker fails, wrong image saved |
| 4.3 | Edit a bird's name, species, weight, and tag ID | All changes persist and display correctly on `BirdProfileScreen` | A field silently reverts or fails to save |
| 4.4 | Rapidly double-tap "Save" on the Add/Edit Bird form | Exactly one bird is created/updated — the button becomes disabled on first tap | Two identical bird rows created from one save action |
| 4.5 | Delete a bird that has tasks and health records attached (use the destructive-confirm alert) | Confirm dialog appears; after confirming, the bird and its tasks/health records are gone (`ON DELETE CASCADE`), and any notifications scheduled for those tasks/records are cancelled (no orphan notification fires later) | Bird deleted but a task/health reminder notification still fires afterward |
| 4.6 | Delete a bird that has egg records or feed logs referencing it | Bird is deleted; egg/feed history rows survive with the bird reference cleared (`ON DELETE SET NULL`), not deleted | Egg/feed history disappears along with the bird |

## 5. Task create / edit / complete / reopen / delete

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 5.1 | Create a task due today, assigned to a bird, with a reminder enabled | Task appears in `Today`'s "Due Today" section; a notification is scheduled (check via the task form's notification preview card) | Task missing from Today, no scheduled-notification confirmation |
| 5.2 | Create a task with a due date in the past | Task appears under "Overdue" on `Today`, not "Due Today" or silently missing | Overdue task invisible anywhere except a count badge |
| 5.3 | Create a task with a due date in the future | Task appears under "Upcoming" | Task missing or miscategorized |
| 5.4 | Mark a task complete from `TodayScreen`, then reopen it from `TaskDetailScreen` | Completing cancels its pending notification; reopening reschedules it (verify via the notification preview card's "next scheduled" value) | A completed task still triggers its old reminder; a reopened task has no reminder at all |
| 5.5 | Delete a task | Task disappears from all lists; its notification is cancelled (no reminder fires later for the deleted task) | Task's notification still fires after deletion |
| 5.6 | Rapidly double-tap the checkbox on a task row | No duplicate completion side-effects (idempotent) | Any visible glitch/duplicate state |

## 6. Health record create / edit / delete

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 6.1 | Create a health record for a bird with medicine, dosage, vet, cost, and an attached photo/document | Record saves and displays all fields plus the attached image on `HealthRecordDetailScreen` | Attachment missing, fields blank |
| 6.2 | Create a health record assigned to a flock instead of a specific bird (no bird selected) | Saves successfully — a record needs at least one of bird/flock, not both | Validation incorrectly blocks a flock-only record |
| 6.3 | Set a reminder date on a health record, then edit the date | Old notification is cancelled and a new one scheduled for the new date (cancel-then-reschedule pattern) | Two overlapping reminders fire, or none fire after the edit |
| 6.4 | Delete a health record with a reminder set | Notification is cancelled; no orphan reminder fires later | Reminder still fires post-deletion |

## 7. Egg history

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 7.1 | Log an egg count for today via the quick +/- stepper | Total updates immediately, appears in `EggHistoryScreen` and the dashboard's 30-day chart | Count doesn't update, chart doesn't reflect new entry |
| 7.2 | Log fertile/cracked/dirty/double-yolk sub-counts alongside a total | All sub-counts persist and display correctly in history | Sub-counts lost or mismatched against the total |
| 7.3 | Export egg history to CSV and open the exported file | Share sheet appears; CSV contains correct rows/columns for the current filter | Export fails, empty file, wrong data |
| 7.4 | Scroll through a long egg history list (50+ entries, or as many as exist) | Smooth scroll via `FlatList` virtualization, no lag or dropped frames | Janky scroll, memory spike, frozen UI |

## 8. Feed inventory and usage

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 8.1 | Add a feed item with a quantity, low-stock threshold, and expiry date | Item appears in inventory; an expiry-reminder notification is scheduled for the correct **local** date (not shifted by a day) | Reminder fires a day early/late — a known historical UTC-parsing bug class, now fixed; verify it stays fixed |
| 8.2 | Log feed usage that brings stock at/below the low-stock threshold | A low-stock alert/notification fires once (edge-triggered on the state transition) | Alert fires repeatedly on every subsequent log, or never fires |
| 8.3 | Log feed usage that exhausts stock to zero/negative | An "out of stock" alert fires; further usage logging is blocked or clearly flagged (`InsufficientStockError` path) | Silent negative stock with no warning |
| 8.4 | Delete a feed item with a pending expiry notification | Notification is cancelled first, then the item is deleted — no orphan reminder later | Expiry reminder still fires after the item is gone |

## 9. Breeding pair

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 9.1 | Create a breeding pair from a male and a female bird | Pair appears in the breeding list with both bird names | Pair missing, wrong sex validation |
| 9.2 | Attempt to pair a bird with itself, or two birds of the same sex | Blocked with a friendly error (`SameBirdPairingError` / `InvalidSexPairingError`), not a crash | Crash, or an invalid pair silently saved |
| 9.3 | Delete an existing breeding pair via "Delete Pair" | Pair is removed; its clutches survive (flockId/pairId nulled per §4 FK rules) | Clutch history disappears along with the pair |
| 9.4 | Delete one of the two birds in an active pair | Pair is deleted too (`ON DELETE CASCADE` on both bird FKs) | Pair survives referencing a deleted bird |

## 10. Clutch

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 10.1 | Create a clutch under a breeding pair with laid date, incubation start, and species-appropriate expected hatch date | Expected hatch date auto-suggests correctly based on species incubation period; candling/hatch-expected/hatch-due reminders schedule | Wrong hatch-date suggestion, no reminders scheduled |
| 10.2 | Edit a clutch's incubation start date after reminders are already scheduled | Old reminders cancelled, new ones scheduled against the new date | Duplicate or stale reminders |
| 10.3 | Mark a clutch as hatched, failed, or cancelled, then edit its dates | No candling/hatch reminders are re-scheduled once resolved (all three are cancelled and nulled) | A resolved clutch still gets a new reminder scheduled after editing |

## 11. Hatch record

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 11.1 | Record a hatch with hatched/failed/assisted counts for a clutch | Clutch status updates; counts display on history | Wrong totals, crash |
| 11.2 | Use "Create Birds from Hatch" to generate bird records from a hatch | New bird rows are created, one per hatched egg (or as configured), each linked appropriately | Duplicate birds created from one hatch (guarded by the `birdsCreated` flag — verify it actually prevents a second run) |
| 11.3 | Attempt to run "Create Birds from Hatch" a second time on the same hatch record | Blocked — `birdsCreated` guard prevents double bird-creation | A second identical batch of birds is created |

## 12. Notification permission — granted

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 12.1 | On first reminder-scheduling action (e.g. creating a task with a reminder), grant the OS notification permission prompt | Reminder schedules normally; the notification preview card on the form shows "granted" status | Permission prompt never appears, or reminder silently fails to schedule despite granted permission |

## 13. Notification permission — denied

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 13.1 | Deny the OS notification permission prompt, then create a task/health/feed/clutch record with a reminder | Record still saves successfully; the preview card clearly states the reminder won't produce a phone alert (plain-language copy, not a raw error) | Save is blocked entirely, or the app crashes because it assumes permission is granted |
| 13.2 | With permission denied, tap "Enable Notifications" on the preview card | Deep-links to the OS notification settings for Flockora, or re-prompts if the OS allows it | Dead button, crash |

## 14. Test notification

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 14.1 | Tap "Send test" on the notification preview card (any of the four reminder-configuring screens) | A real OS notification arrives within a few seconds, with the correct title/category for that record type | No notification arrives, wrong title/type, crash |

## 15. Reminder deep-link — app in foreground

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 15.1 | With the app open and in the foreground, trigger a test notification and tap it (or wait for a real one to fire) | Navigates directly to the correct detail screen (`TaskDetail` / `HealthRecordDetail` / `FeedInventory` / `ClutchDetail`) for that exact record | Nothing happens on tap, wrong screen opens, crash |

## 16. Reminder deep-link — app backgrounded

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 16.1 | Send the app to background (home button, don't force-close), let a reminder fire, tap the notification from the notification shade | App resumes and navigates to the correct detail screen | App resumes to whatever screen it was last on, ignoring the tap target |

## 17. Reminder deep-link — cold start from killed state

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 17.1 | Force-close the app entirely (swipe away from recents), let a reminder fire, tap the notification | App cold-starts and, after normal startup, navigates to the correct detail screen (via `getLastNotificationResponseAsync`) | App opens to `Today`/onboarding instead of the intended detail screen |

## 18. Timezone / date correctness

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 18.1 | Set the device to a negative-UTC-offset timezone (e.g. US Pacific/Eastern) and create a feed item with an expiry date, or a clutch with incubation dates | Reminders fire on the correct **local** calendar date, not shifted a day earlier | Reminder arrives a day early — the specific historical bug class this app was hardened against |
| 18.2 | Change the device timezone after a one-off reminder is already scheduled | Reminder fires at the originally-scheduled absolute instant (standard OS local-notification semantics — not expected to re-adjust) | Unexpected behavior beyond standard OS semantics (e.g. reminder silently disappears) |

## 19. Recurring reminder behavior

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 19.1 | Create a task with `DAILY` repeat and a reminder | Reminder fires every day at the configured time (OS calendar-based trigger) | Fires once and never again, or fires at the wrong time after a day change |
| 19.2 | Create a task with `WEEKLY` repeat | Fires on the correct weekly cadence | Wrong day, or stops after one occurrence |
| 19.3 | Create a task with `MONTHLY` repeat, and verify behavior across a DST transition if the test window allows | Fires correctly across the DST boundary (OS wall-clock/calendar trigger handles this automatically) | Reminder shifts by an hour around DST |

## 20. Bird deletion with related data

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 20.1 | Create a bird with at least one task, one health record, one egg record, one feed log, and (if applicable) a breeding pair, then delete the bird | Tasks/health records are cascade-deleted with notifications cancelled first; egg/feed rows survive with the bird reference nulled; breeding pairs involving this bird are cascade-deleted | Any orphaned notification, any unexpected data loss/survival vs. the rules above |

## 21. Backup export

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 21.1 | From Settings/Reports header, run "Backup & Restore" → export | Share sheet appears with a JSON file containing all 11 tables and a `schemaVersion` | Export fails, missing tables, malformed JSON |
| 21.2 | Inspect the exported file's size/content with a realistic amount of data | All expected records present, no truncation | Missing rows for tables with many records |

## 22. Corrupted backup rejection

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 22.1 | Hand-edit a valid exported backup file to remove a table key, then attempt to restore it | A "Corrupted backup" alert appears; **no data is written** (declines before any write) | Partial/silent restore, or a generic crash instead of the specific corrupted-backup message |
| 22.2 | Hand-edit a backup file to introduce a dangling foreign key (e.g. a task referencing a non-existent `birdId`) | Restore is rejected before any write (`hasReferentialIntegrity()` check) | Restore succeeds with an orphaned reference now in the live database |
| 22.3 | Attempt to restore a backup with a `schemaVersion` newer than the installed app's `DATABASE_VERSION` | Restore is rejected outright | Restore proceeds against an incompatible schema |

## 23. Valid backup restore

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 23.1 | Export a backup, add/change some data, then restore the original backup | All 11 tables are wiped and replaced with the backup's contents exactly; a confirmation alert gates the destructive action before it runs | Data not fully replaced, confirmation skipped, crash mid-restore |
| 23.2 | Restore a backup, then check any previously-scheduled notifications | Notification IDs are nulled on restore (OS schedule isn't part of the backup) — no stale/duplicate notifications from the pre-restore state | Old device's notification IDs carried over and misfire |

## 24. App restart after restore

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 24.1 | Immediately after a successful restore, force-close and relaunch the app | All restored data is present and correct; app starts normally | Data reverts, app fails to start, migration error |

## 25. Rapid double taps on Save/Confirm

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 25.1 | On each of the 13 Save/Confirm form screens (bird, flock, task, health record, egg record, feed item, breeding pair, clutch, candling record, hatch record, and others), rapidly double-tap Save | Button becomes disabled after the first tap (`accessibilityState`/`disabled` wired to the real `Pressable`); exactly one record is created/updated | A second identical database row is created from one user action |
| 25.2 | Rapidly tap "+" on the inline flock-creation modal (`FlockManagerModal`) | Exactly one flock is created; button disables while the create call is in flight | Two flocks created with the same name |

## 26. Rapid filter/search changes

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 26.1 | On `PulseHomeScreen` (health record search) or the Egg/Feed/Clutch history screens, type quickly into the search box and change filters rapidly | The list always ends up showing results for the **last** filter state, even if an earlier query resolves out of order (request-sequence guard) | List briefly (or persistently) shows results for a stale, previously-typed filter |
| 26.2 | On `FlockHomeScreen`, rapidly tap between different flock chips | Bird list always reflects the most recently tapped flock | Bird list shows the wrong flock's birds after rapid tapping |

## 27. Empty states

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 27.1 | View each list/dashboard screen (Today, Flock, Pulse, Reports, Egg/Feed/Breeding history) with zero data in that category | A clear, on-brand empty state message — never a blank white area or a crash | Blank screen, crash, or a raw "0" with no context |
| 27.2 | View `ReportsScreen` with no birds/flocks/records at all (e.g. right after onboarding) | Dashboard sections render sensible zero/empty states, no NaN or divide-by-zero artifacts in any computed stat | "NaN", "Infinity", or a crash in any stat card |

## 28. Long text / realistic data

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 28.1 | Enter a very long bird name, flock name, and notes field (200+ characters) | Text wraps/truncates gracefully in list rows and detail screens, no layout overflow off-screen | Text overflows the screen edge, breaks layout, cuts off critical info like a Save button |
| 28.2 | Enter emoji, non-Latin characters (e.g. accented names), and special characters in text fields | Saves and displays correctly everywhere (list rows, CSV export, backup export/restore round-trip) | Mojibake, crash, or data loss on save/export/restore |
| 28.3 | Create 50+ birds in one flock, or 100+ egg/feed history entries | Lists remain scrollable and responsive (`FlatList` virtualization where implemented) | Severe lag, frozen UI, OOM crash |

## 29. Android back navigation

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 29.1 | From any deep detail screen (e.g. Bird Profile → Health Record Detail), press the Android hardware/gesture back button repeatedly | Navigates back one screen at a time through the stack, eventually reaching a tab root, then a confirm-exit or standard exit — never crashes or skips levels unexpectedly | Back button does nothing, crashes, or exits the app unexpectedly from a mid-stack screen |
| 29.2 | Press back while a modal (e.g. `FlockManagerModal`, a picker modal) is open | Closes the modal only, does not navigate the underlying screen stack | Back closes the modal and also pops a screen, or does nothing |
| 29.3 | Press back on an Add/Edit form with unsaved changes | Confirm expected behavior matches the rest of the app (either discards immediately or matches whatever pattern other forms use) — verify it's not inconsistent screen-to-screen | Silent data loss the user didn't expect, or inconsistent behavior between similar forms |

## 30. App restart and data persistence

| # | ACTION | EXPECTED RESULT | FAILURE SIGNAL |
|---|---|---|---|
| 30.1 | Create a meaningful spread of data (bird, flock, task, health record, egg log, feed item, breeding pair, clutch), force-close the app, then relaunch | All data is present exactly as left — SQLite is the only persistence layer, no in-memory state should be required | Any data loss or corruption after restart |
| 30.2 | Kill the app mid-write (e.g. force-close immediately after tapping Save on a form, before the next screen renders) | On relaunch, the database is in a consistent state — either the write completed or it didn't (SQLite autocommit/WAL), never a half-written row | Corrupted row, app fails to start due to a bad DB state |
| 30.3 | Reinstall the app (uninstall, then install fresh) | All prior data is gone — Flockora has no cloud backup, this is expected local-only behavior — confirm this matches user expectations and isn't mistaken for a bug during testing | N/A — documenting expected behavior, not a failure mode by itself |

---

## Notes for testers

- **No backend is deployed.** Onboarding's AI photo analysis (§2.4) is expected to always fall through to the manual-entry path on a real device outside a developer's local network — this is a known, documented state (see `PROJECT_CONTEXT.md`), not a bug to file.
- **This app is 100% local-only.** There is no login, no cloud sync, and no way to recover data after an uninstall or lost device (§30.3) — confirm this matches the product's current, intentional scope before flagging it.
- File any genuine failure against the exact `ACTION`/screen name above, with device model + Android version, so it can be reproduced.
