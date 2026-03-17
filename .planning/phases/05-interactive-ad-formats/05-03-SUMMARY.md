---
phase: 05-interactive-ad-formats
plan: 03
subsystem: ad-sdk
tags: [telemetry, bundler, ad-sdk, format-refactor]

# Dependency graph
requires:
  - phase: 05-interactive-ad-formats
    provides: "Interactive creative templates"
provides:
  - "Standalone Telemetry Engine (@scrolltoday/ad-sdk)"
  - "Ad Tag Bundler generating self-contained payloads"
  - "Granular tracking events via window.ScrollTodaySDK.track()"

affects: [apps/web/src/features/editor, apps/web/src/features/templates, packages/ad-sdk]

# Tech tracking
tech-stack:
  added: [Vanilla JS Telemetry Class]
  patterns: [Isomorphic Bundler, Script Injection]

key-files:
  added:
    - packages/ad-sdk/src/telemetry.ts
    - packages/ad-sdk/src/bundler.ts
  modified:
    - packages/ad-sdk/src/index.ts
    - apps/web/src/features/editor/lib/renderer.ts
    - apps/web/src/features/templates/formats/quiz/renderer.ts
    - apps/web/src/features/templates/formats/video-endcard/renderer.ts
    - apps/web/src/features/templates/formats/cube/renderer.ts
    - apps/web/src/features/templates/formats/scratch/renderer.ts
    - apps/web/src/features/templates/formats/carousel/renderer.ts
    - apps/web/src/features/templates/formats/accordion/renderer.ts
    - apps/web/public/creatives/flipcard-runtime.js

key-decisions:
  - "Built an isomorphic bundler that injects the Telemetry engine as a plain JS string into the final HTML payload, ensuring zero external dependencies for the base ad tag."
  - "Updated all formats to report granular events (e.g., 'flip', 'swipe', 'cube_rotate', 'quiz_answer') rather than generic 'engagement' objects, perfectly aligning with the Phase 10 engagement breakdown feature."

requirements-completed: [BDL-01, BDL-02]

# Metrics
duration: 15min
completed: 2026-03-03
---

# Phase 05 Plan 03: Creative Format Bundler Summary

**Successfully transitioned the interactive creative pipeline to a self-contained Ad Tag Bundler architecture.**

## Accomplishments
- **Standalone Telemetry:** Created a vanilla JS `Telemetry` class in `packages/ad-sdk` that handles context caching, pixels, viewability monitoring, and heartbeats.
- **Payload Bundler:** Created `buildAdPayload` that stringifies config and injects the Telemetry script alongside the specific format's JS/CSS.
- **Granular Tracking:** Refactored every single interactive format to utilize the newly injected `window.ScrollTodaySDK.track()`. The generic 'engagement' calls were rewritten to specific events like `flip`, `swipe`, and `cube_rotate`.
- **Editor Parity:** Connected the web app's `EditorPreview` to use the SDK's `buildAdPayload`, ensuring the preview exactly matches the production payload.

## Deviations from Plan
- None.

## Self-Check: PASSED
- FOUND: packages/ad-sdk/src/telemetry.ts
- FOUND: packages/ad-sdk/src/bundler.ts
- FOUND: window.ScrollTodaySDK in format renderers
- VERIFIED: tsc passed with no errors
