---
phase: 08-ad-serving-infrastructure
plan: 05
subsystem: ad-serving
tags: [serve-ad, edge-function, tag-export, gam]

# Dependency graph
requires:
  - phase: 05-interactive-ad-formats
    provides: "Self-contained Ad Tag Bundler"
provides:
  - "Updated serve-ad edge function compatible with standalone payloads"
  - "Dynamic runtime config injection via window.__ST_SERVE_CONFIG__"

affects: [supabase/functions/serve-ad]

# Tech tracking
tech-stack:
  added: []
  patterns: [Config Prepending, Macro Resolution]

key-files:
  modified:
    - supabase/functions/serve-ad/index.ts

key-decisions:
  - "Refactored serve-ad to stop injecting its own impression pixels and viewability scripts. It now defers 1st-party tracking entirely to the bundle's internal Telemetry Engine."
  - "Passed tracking context (request ID, URLs) into the bundled payload by cleanly prepending a `window.__ST_SERVE_CONFIG__` script block instead of running fragile regex replacements across the whole HTML."
  - "Retained 3rd-party tracker injection capabilities in serve-ad to ensure backward compatibility for advertiser-uploaded tracking pixels."

requirements-completed: [BDL-03, BDL-04]

# Metrics
duration: 10min
completed: 2026-03-03
---

# Phase 08 Plan 05: Ad Serving Updates Summary

**Successfully aligned the production ad serving infrastructure with the new self-contained creative bundles.**

## Accomplishments
- **Clean Configuration Injection:** The `serve-ad` edge function now dynamically injects a `window.__ST_SERVE_CONFIG__` block at the top of the creative's HTML. This feeds the `request_id`, `trackUrl`, and `advertiserId` directly into the bundled SDK.
- **Removed Tracking Duplication:** Stripped out the legacy 1st-party viewability and impression pixel injections from `serve-ad` since the standalone Telemetry engine handles this natively inside the creative bundle.
- **Seamless Tag Compatibility:** The GAM/DFP macros (like `%%CLICK_URL_ESC%%`) continue to be parsed securely by the edge function and passed down into the payload without altering the `TagExportDialog` format.

## Deviations from Plan
- Did not need to modify `tag-generator.ts` as the existing macro structure (`click=%%CLICK_URL_ESC%%`) was perfectly compatible with the new config injection method.

## Self-Check: PASSED
- FOUND: window.__ST_SERVE_CONFIG__ injection in serve-ad/index.ts
- FOUND: click redirect logic preserved for GAM tracker support
