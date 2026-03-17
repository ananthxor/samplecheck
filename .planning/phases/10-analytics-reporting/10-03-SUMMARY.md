---
phase: 10-analytics-reporting
plan: 03
subsystem: tracking
tags: [analytics, edge-functions, ad-sdk, tracking-fidelity]

# Dependency graph
requires:
  - phase: 10-analytics-reporting
    provides: "Analytics dashboard & V1 rollups (Plan 01, 02)"
provides:
  - "Universal window.stTrack(type, extra) helper in renderer-shell"
  - "5-second engagement heartbeat for dwell_time_ms tracking"
  - "Carousel engagement tracking (swipe/slide_index)"
  - "Flipcard engagement tracking (flip)"
  - "Scratch engagement tracking (scratch)"
  - "Quiz engagement tracking (choice/correct)"
  - "Accordion engagement tracking (section_index)"
  - "Cube engagement tracking (face_index)"
  - "Video tracking: play, pause, quartiles (25/50/75), and complete"
  - "Edge Function support for arbitrary interaction metadata in extra_data"

affects: [creatives, analytics]

# Tech tracking
tech-stack:
  added: []
  patterns: [Heartbeat tracking for dwell time, Metadata extraction in Edge Functions]

key-files:
  modified:
    - apps/web/src/features/templates/formats/_shared/renderer-shell.ts
    - apps/web/src/features/templates/formats/carousel/renderer.ts
    - apps/web/src/features/templates/formats/quiz/renderer.ts
    - apps/web/src/features/templates/formats/scratch/renderer.ts
    - apps/web/src/features/templates/formats/video-endcard/renderer.ts
    - apps/web/src/features/templates/formats/accordion/renderer.ts
    - apps/web/src/features/templates/formats/cube/renderer.ts
    - apps/web/public/creatives/flipcard-runtime.js
    - supabase/functions/track-event/index.ts

key-decisions:
  - "Used Image pixel for stTrack instead of fetch/beacon for maximum compatibility across older browsers and sandboxed iframes"
  - "Implemented dwell time via 5s heartbeat dispatching 'engagement' events with dwell_time_ms metadata"
  - "Updated Edge Function to dynamically capture all non-reserved query params into extra_data, future-proofing for custom creative events"

requirements-completed: [ANLYT-03, ADVT-04, ANLYT-02]

# Metrics
duration: 15min
completed: 2026-03-03
---

# Phase 10 Plan 03: Analytics V2 — Interaction & Video Tracking Summary

**Upgraded tracking pipeline from impressions-only to full interaction fidelity. Added universal stTrack helper, dwell time heartbeats, and specific engagement/video event dispatchers across all major ad formats.**

## Accomplishments
- **Universal Tracking Layer:** Added `window.stTrack` and `startDwellHeartbeat` to `renderer-shell.ts`. All creatives now automatically track presence time and have a standardized way to report interactions.
- **Interactive Formats:** 
  - Carousel now tracks slide changes.
  - Flipcard (runtime) tracks flips.
  - Scratch tracks when scratching begins.
  - Quiz tracks choice selection and correctness.
  - Accordion tracks section expansion.
  - Cube tracks face rotation.
- **Video Fidelity:** Video formats now track `video_play`, `video_pause`, `video_complete`, and 25/50/75% quartiles.
- **Edge Function Upgrade:** `track-event` now captures all metadata sent by the renderers and stores it in the `extra_data` JSONB column, making it available for the `daily_metrics` rollup functions.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
- `flipcard-runtime.js` required a different update pattern because it's an external script, but `stTrack` was correctly exposed via the shell.
- Edge Function `replace` required smaller chunks due to context matching issues, but was successfully updated.

## Self-Check: PASSED
- FOUND: apps/web/src/features/templates/formats/_shared/renderer-shell.ts (with stTrack)
- FOUND: apps/web/src/features/templates/formats/carousel/renderer.ts (with stTrack calls)
- FOUND: supabase/functions/track-event/index.ts (with video_quartile and metadata loop)

---
*Phase: 10-analytics-reporting*
*Completed: 2026-03-03*
