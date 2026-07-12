# Flockora Product Constitution

## 1. Product Definition

Flockora is a smart, mobile-first flock care, hatching, breeding, and bird management application for backyard poultry keepers and hobby breeders. It is designed primarily for users in the United States, United Kingdom, Canada, Australia, and other Western markets.

- Brand name: Flockora
- Tagline: Care. Hatch. Breed. Protect.

## 2. Core Product Philosophy

Flockora must feel simple even when the product is technically powerful.

### Fundamental UX Principle

Less typing. More understanding.

The experience should not feel like farm ERP software, accounting software, a spreadsheet, or a paperwork system. The user should preferably show, speak, tap, or confirm.

- AI prepares.
- The human confirms.

The product must never silently save uncertain AI-generated information as verified fact.

## 3. Product Pillars

### 3.1 Today

Show the user what needs attention now.

Includes:
- Daily flock care
- Egg activity
- Health observations
- Hatch milestones
- Breeding activity
- Medication reminders
- Sunset-aware coop reminders
- Important flock patterns

### 3.2 Care

Support everyday flock stewardship.

Includes:
- Bird profiles
- Mixed flock management
- Egg tracking
- Feed and water care
- Weight history
- Health observations
- Medication tracking
- Common bird health guidance
- Family and caregiver coordination
- Sitter and Away Mode

### 3.3 Hatch

Support home incubation and hatch workflows.

Includes:
- Incubation batches
- Species-aware hatch workflows
- Egg source tracking
- Incubator tracking
- Candling records
- Developing, clear, and unknown egg states
- Hatch milestones
- Fertility calculations
- Hatch-rate calculations
- Batch comparison

### 3.4 Breed

Support breeding planning, lineage, and performance tracking.

Includes:
- Breeding pens
- Breeding groups
- Pairings
- Sire and dam relationships
- Offspring
- Lineage
- Pedigree
- Traits
- Generations
- Fertility trends
- Hatch performance by breeding source

### 3.5 Protect

Support health awareness, prevention, and timely follow-up.

Includes:
- Health observations
- Symptom navigation
- Common disease and health-topic library
- Urgency guidance
- Preventive care information
- Medication schedule tracking
- Location-aware flock information
- Care completion
- Sunset-aware coop confirmation

## 4. Initial Supported Species

Initial supported species:
- Chicken
- Coturnix quail
- Duck
- Turkey
- Goose
- Guinea fowl
- Pheasant
- Peafowl

The architecture must allow additional species to be added later.

The product must not assume every species behaves like a chicken with a different label. Species may differ in:
- Incubation workflows
- Hatch windows
- Production metrics
- Life stages
- Breeding structures
- Health topics
- Care templates
- Terminology

## 5. Camera-First Product

Camera is a primary input method.

The user should be able to photograph:
- A bird
- Multiple birds
- An egg
- Medicine packaging
- Feed packaging
- A health concern
- A vet document
- A hatch tray

Future AI systems may analyze these images.

For bird images, AI may propose:
- Species
- Likely breed or variety
- Likely sex when visually supportable
- Colour or markings
- Approximate life stage

AI must never claim to know exact age, exact weight, vaccination history, disease status, or medical history from a photograph.

### Confidence States

- HIGH CONFIDENCE
- LIKELY
- UNSURE

The user confirms or corrects proposed information.

## 6. Voice-First Logging

The architecture should support natural voice logging.

Examples:
- “collected eight eggs, two were cracked”
- “gave Daisy her medicine”
- “Jack fed the birds”
- “put twenty four quail eggs in incubator two”

The AI prepares a structured action. The user confirms before important data is saved.

## 7. Health Safety Principles

Flockora is not an AI veterinarian.

The product must not:
- Diagnose disease as fact
- Automatically prescribe medication
- Invent medication doses
- Invent egg or meat withdrawal periods

Health experiences should use language such as:
- Possible concern
- Observed signs
- Health topic
- Pattern detected
- Review guidance
- Seek veterinary attention

For V1, Flockora may include curated common health topics and symptom information for supported species.

Medication tracking may record treatments entered by the user or veterinarian.

AI prepares. Human confirms.

This principle applies especially to:
- Bird identification
- Breed identification
- Sex identification
- Voice logs
- Vet document extraction
- Medicine label extraction
- Health observations
- Breeding records

## 8. AI Confirmation & Data Governance

Flockora uses a clear data-origin model to ensure that AI-assisted information is never treated as verified flock truth without human confirmation.

### Data Origins

#### USER_CONFIRMED

Information explicitly entered, selected, corrected, or confirmed by the user.

Examples:
- Bird name
- Confirmed species
- Confirmed breed
- Recorded egg count
- Confirmed care task
- User-entered weight
- Confirmed medication log

This may be treated as recorded user data.

#### AI_PROPOSED

Information proposed by an AI system but not yet confirmed by the user.

Examples:
- Likely bird species
- Likely breed
- Likely sex
- Voice transcription interpreted as a care action
- Medicine label extraction
- Vet document extraction
- Possible image observation

AI_PROPOSED information must never silently become verified flock data.

It must require confirmation before becoming USER_CONFIRMED when it affects permanent flock records, health records, breeding records, medication records, or important care actions.

#### SYSTEM_DERIVED

Information calculated from recorded data or trusted deterministic logic.

Examples:
- Hatch rate
- Fertility percentage
- Days since hatch batch started
- Sunset time
- Egg production trend
- Care completion percentage

SYSTEM_DERIVED data must preserve enough source context to explain how the result was produced.

### Core Rule

AI prepares.
Human confirms.
The system calculates.

### Confidence States

The product uses three AI confidence states:
- HIGH
- LIKELY
- UNSURE

#### HIGH

The UI may present a simple one-tap confirmation.

#### LIKELY

The UI should clearly label the result as likely and invite review.

#### UNSURE

The application should ask one simple clarifying question or offer manual selection.

Confidence wording must never imply medical certainty.

### Health Guidance

For health-related experiences, the application must never display statements such as:
- “You have identified disease X.”

Preferred language includes:
- “These recorded signs may overlap with several health concerns.”

Important medical, medication, breeding lineage, or permanent flock data must not be silently committed from AI output.

## 9. Target User

### Primary Users

- Western backyard poultry keeper with a mixed flock
- Hobby breeder
- Small breeder growing beyond notebooks and spreadsheets
- Households where two or more people share bird care
- Users who hatch birds at home

The product is not initially designed for large industrial poultry farms.

## 9. Design Philosophy

Flockora must feel:
- Warm
- Alive
- Colourful
- Friendly
- Modern
- Natural
- Premium
- Easy

It must not feel:
- Corporate
- Dark
- Technical
- Industrial
- ERP-like
- Spreadsheet-heavy
- Medical
- Cluttered

## 10. Primary Design Colours

- Leaf Green: #2F7D4A
- Sunflower Yellow: #F6C445
- Soft Green: #EAF5E7
- Warm Cream: #FFF9EC
- Hatch Orange: #F29F3D
- Alert Coral: #E85D4A

Water and weather blue may be used sparingly.

Red or coral should be reserved primarily for genuine attention or urgent states.

## 11. Typography

Primary font direction: Nunito Sans.

Typography should be friendly, highly readable, and suitable for frequent mobile use.

## 12. UI Principles

- Use rounded cards
- Use generous spacing
- Use large tap targets
- Prefer icons plus short labels
- Avoid long forms
- Avoid asking the user for information the application can reasonably propose or infer
- Use progressive disclosure
- Advanced breeding features should not overwhelm a casual keeper
- A casual chicken keeper should experience a simple care application
- A breeder should be able to enable deeper hatch and breeding functionality
- The same product should support different depths of use

## 13. Primary Navigation Direction

Maximum five primary bottom navigation actions.

Proposed direction:
- Today
- Flock
- Camera / Add
- Pulse
- More

The centre Camera / Add action should be visually prominent.

## 14. Core Product Areas

The full product will eventually include:
- Today dashboard
- Mixed flock management
- Bird Passport
- Egg tracking
- Care logging
- Camera-assisted bird onboarding
- Voice-assisted logging
- Hatchery
- Breeding and lineage
- Health Guide
- Symptom Navigator
- Medication tracking
- Family care
- Sitter / Away Mode
- Smart notifications
- Sunrise and sunset context
- Weather context
- Flock Pulse
- Reports and exports
- Subscription system

## 15. Architecture Direction

The intended application stack is:
- React Native
- Expo
- TypeScript
- Supabase
- Supabase Auth
- Supabase Storage
- Gemini multimodal API for selected AI-assisted experiences
- Expo Notifications
- RevenueCat for subscriptions

These external services should not be integrated until explicitly instructed.

The architecture should be modular and maintainable.

It should avoid:
- Giant components
- Duplicated business logic inside UI screens

The architecture should separate:
- UI
- Domain models
- Business logic
- Services
- Data access
- AI integrations
- Notification logic
- Species rules

## 16. Species Rules Engine

The architecture should allow species-specific logic to live in a dedicated rules layer.

It should not scatter incubation durations or species logic throughout UI components.

Species configuration should eventually support:
- Species identity
- Terminology
- Life stages
- Incubation defaults
- Hatch milestones
- Production context
- Breeding context
- Health-topic relationships
- Care templates

## 17. Data Ownership

Users should eventually be able to export important flock data.

Bird records should normally be archived rather than permanently deleted from historical records.

Breeding and hatch lineage must preserve historical relationships.

## 18. Product Positioning

Flockora is the smart flock app for backyard keepers and breeders.

Brand tagline: Care. Hatch. Breed. Protect.

The product should ultimately answer:
- What needs my attention today?
- Has my flock been cared for?
- What changed?
- How is my hatch progressing?
- Which breeding groups are performing well?
- What observations have I recorded about this bird?
- What should I review next?

## 19. Development Rule

The application should not be built all at once.

It will be developed phase by phase.

Before implementing a major phase:
1. Read PRODUCT_CONSTITUTION.md.
2. Preserve existing architecture.
3. Explain the implementation plan.
4. Implement only the requested phase.
5. Run appropriate checks.
6. Report exactly what changed.
7. Do not add major unrequested features.
