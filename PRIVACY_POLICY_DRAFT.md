# Flockora Privacy Policy — DRAFT

**Status: DRAFT — NOT FINAL LEGAL TEXT.** This draft is based only on Flockora's proven current data behavior, verified against the source code (`PRIVACY_DATA_AUDIT.md`, same sprint/commit). It contains explicit `[BUSINESS DECISION REQUIRED: ...]` markers wherever a legal entity name, address, contact email, jurisdiction, or similar business fact is needed but not documented anywhere in this repository. **Do not publish this text as-is at `https://flockora.com/privacy` until every marker below is resolved and the document has been reviewed by whoever is legally responsible for Flockora's compliance.**

Intended publication URL: **https://flockora.com/privacy**
Official website: **https://flockora.com**

---

## Flockora Privacy Policy

**Last updated:** [BUSINESS DECISION REQUIRED: insert the actual publication date]

### 1. Introduction

Flockora ("Flockora," "we," "us," or "our") is a mobile app for backyard poultry keepers and hobby breeders to track birds, flocks, daily care, eggs, feed, and breeding/hatching. This Privacy Policy explains what information Flockora processes, where it's stored, what (if anything) is sent off your device, and how you can control it. This policy is written to reflect exactly what the app currently does — not aspirational or generic claims.

Flockora is published by [BUSINESS DECISION REQUIRED: legal entity name] ("we/us" throughout this policy), based in [BUSINESS DECISION REQUIRED: jurisdiction/country].

### 2. Scope

This policy applies to the Flockora mobile app (iOS and Android) and to Flockora's own backend service that the app occasionally communicates with (described in §5). It does not apply to any third-party website or service you may reach by tapping a link out of Flockora, or to whatever destination you personally choose when sharing an exported file (§9).

### 3. Information processed by Flockora

Flockora is built around record-keeping you do yourself. The information you enter includes, as applicable:

- Bird records (name, species, breed, sex, date of birth, tag/band ID, notes, weight, photo)
- Flock/group records
- Daily care tasks and reminders
- Health and care records — including medicine, dosage, veterinarian name, and free-text notes **about your birds**, not about you
- Egg production logs
- Feed inventory and usage logs
- Breeding pair records, and clutch/candling/hatch records

All of the above is information **you choose to enter about your birds and flock management** — Flockora does not ask for your name, email address, phone number, or any other information that identifies you as a person, and has no account or sign-in system of any kind.

### 4. Data stored locally on your device

Everything listed in §3 is stored in a private database on your device only. It is not synced to any cloud service, not backed up automatically anywhere, and not visible to Flockora or anyone else unless you personally choose to export and share it (§9).

This local data is not encrypted at rest beyond your device's own operating-system-level protections. If you share your device or a backup file with someone else, they could potentially access this information — treat your device and any backup file you create with the same care you'd give any personal notebook.

### 5. Photos and AI-assisted analysis

When you add your first bird during setup, you take or choose a photo of that bird. This photo is used in two ways:

- It's saved locally so your bird's profile shows a real photo.
- It's uploaded, once, to **Flockora's own backend server** — not a third party — so the app can suggest that bird's likely breed, sex, color, and life stage for you to review and confirm or edit. Flockora's design principle is "AI prepares, you confirm" — a suggestion is never saved as fact without your review.

Our backend does not save, store, or log this photo. It is held only in the server's working memory for the moments it takes to process your request, then discarded. No copy of the photo is written to a database, a file, or a log anywhere on our backend.

[EXTERNAL FACT REQUIRES VERIFICATION: as of this policy's drafting, this AI-suggestion feature is served by an internal test/mock system, not a live third-party AI model — no photo is currently analyzed by, or sent to, any outside AI provider such as Google, OpenAI, or Anthropic. If and when Flockora connects a real AI provider to power this feature, this policy will be updated first to name that provider and describe its own data handling before the change ships.]

A photo of your bird is required to complete the first-bird setup step in the app today. The **AI suggestion** based on that photo is not required — if our server can't be reached or the request fails, you can enter your bird's details manually instead, with no AI involved.

Any other photo you add later (additional birds, health-record documents) stays on your device only and is never uploaded anywhere by Flockora.

### 6. Information transmitted off-device

Beyond the one bird photo described in §5, Flockora does not automatically transmit any of your data anywhere. There is exactly one network destination the app can reach: Flockora's own backend, and only for the photo-analysis request above.

### 7. Purpose of processing

The bird photo is processed for exactly one purpose: to suggest breed, sex, color, and life-stage details for the bird you're adding, for you to review. We do not use it for advertising, profiling, analytics, or any purpose beyond that suggestion.

### 8. Third-party services / processors

Flockora does not use any third-party analytics, advertising, crash-reporting, or tracking service of any kind. [EXTERNAL FACT REQUIRES VERIFICATION: if a real AI provider is connected to the photo-analysis feature described in §5 in the future, that provider will be named here as a data processor for that specific photo before the change ships, consistent with our own internal security policy requiring a fresh review before any such change goes live.]

### 9. Notifications

Flockora can send you local reminders (for tasks, health/vaccination dates, feed expiry or low stock, and hatch/candling dates) based on the dates and thresholds you enter. These reminders are scheduled entirely on your device by your device's own operating system — Flockora has no push-notification server, and no reminder content is ever transmitted anywhere.

### 10. Backups and exports

You can export your data — as a CSV file (egg records) or a full backup file (everything in the app) — at any time. These files are created on your device and are only ever sent anywhere if you personally choose to share them (for example, via email, cloud storage, or messaging) using your device's own share feature. Flockora does not see, receive, or have any visibility into where you send an exported file. A backup file contains file-path references to your photos, not the photo images themselves.

Restoring a backup file replaces your on-device data with what's in that file; this happens entirely on your device.

### 11. Data sharing

We do not sell your data. We do not share your data with third parties for advertising or marketing purposes. The only data that ever leaves your device automatically is the single bird photo described in §5, sent to our own backend for the sole purpose described there — never to a third party (unless and until §5's AI-provider marker above is resolved and this policy is updated to say so).

### 12. Data retention

- **On your device:** your data is retained for as long as you keep it in the app, until you delete a specific record, or until you uninstall the app (which removes Flockora's local database along with everything in it).
- **On our backend:** the bird photo described in §5 is not retained at all — it exists only for the moments needed to process one request and is then discarded. We keep no log of the photo's contents, only basic, non-identifying technical metadata (like the image's file type and size) used to keep the service running reliably.

### 13. User deletion controls

You can delete any individual bird, flock, task, health record, egg log, feed item, or breeding/hatch record directly in the app at any time. Uninstalling the app removes all of your locally stored data. Because we don't retain your photo on our backend (§5/§12), there is nothing further to request deletion of there.

### 14. Account deletion applicability

Flockora does not have user accounts, sign-in, or sign-up of any kind. There is no Flockora account to delete, because none is ever created.

### 15. Children / age considerations

[BUSINESS DECISION REQUIRED: Flockora has no age gate, no age-verification step, and no code that restricts or checks the age of its users. This section requires an explicit business decision on Flockora's intended minimum age / target audience (e.g., for Google Play's "target audience" declaration and Apple's age rating) before this policy or either store listing can make a specific age claim. Do not state a specific age policy here until that decision is made and documented.]

### 16. Security

We take reasonable, industry-standard measures to protect the information Flockora processes. Your on-device data benefits from your device's own operating-system-level protections. The one piece of data we do process off-device (§5) is handled by a server we control, validated before processing, and never written to persistent storage. No system is perfectly secure, and we encourage you to keep your device's own lock screen and software up to date.

[EXTERNAL FACT REQUIRES VERIFICATION: this policy should be updated to confirm the production backend serving §5's feature is reachable only over an encrypted (HTTPS) connection before this policy is published, since that depends on a backend deployment that does not exist yet at the time of this draft.]

### 17. International processing

[BUSINESS DECISION REQUIRED: this repository does not document where Flockora's backend will ultimately be hosted, so no claim about international data transfer, a specific country of processing, or a legal transfer mechanism (e.g., Standard Contractual Clauses) can be made yet. Add this section, naming the actual hosting region/country and any applicable transfer mechanism, once the backend deployment location is decided.]

### 18. Your privacy rights / requests

[BUSINESS DECISION REQUIRED: this repository does not document a designated contact channel, legal jurisdiction, or applicable privacy law (e.g., GDPR, CCPA) for handling a formal data-subject request. Because Flockora retains no data about you off-device beyond a photo that is discarded immediately after processing (§5/§12), most such requests would be satisfied by the in-app deletion/uninstall controls in §13 — but the specific rights language and request channel required by your target markets' law must be added here as a business/legal decision, not invented.]

### 19. Changes to this policy

We may update this policy as Flockora's features change — in particular, before any change to how the bird-photo feature in §5 works (for example, connecting a real AI provider). [BUSINESS DECISION REQUIRED: describe how updates will be communicated — e.g., an updated "Last updated" date, an in-app notice, or both.]

### 20. Contact

[BUSINESS DECISION REQUIRED: no support/contact email or address is documented anywhere in this repository. `SettingsScreen.tsx`'s existing "Contact & Feedback" row currently and correctly tells the user no dedicated channel exists yet — this policy must not invent one. Add a real contact method here once one exists.]

### 21. Official website

https://flockora.com

---

*(End of draft. Every `[BUSINESS DECISION REQUIRED: ...]` and `[EXTERNAL FACT REQUIRES VERIFICATION: ...]` marker above must be resolved before this text is published as Flockora's live privacy policy.)*
