---
phase: 08-ad-serving-infrastructure
plan: 02
subsystem: ad-serving
tags: [supabase, edge-functions, deno, tracking-pixel, click-redirect, rendered-html, gam, fire-and-forget]

# Dependency graph
requires:
  - phase: 08-ad-serving-infrastructure
    provides: "credit_balance column, rendered_html column, deduct_impression_credit function, tracking-utils.ts, supabase-admin.ts"
  - phase: 04-template-library
    provides: "generatePreviewHtml in renderer.ts, editor save flow in editor-page.tsx"
provides:
  - "Editor save flow stores rendered_html alongside template_data in creatives table"
  - "track-event Edge Function: 1x1 pixel tracking for impression, viewability, engagement, and click events"
  - "click-redirect Edge Function: click logging with 302 redirect and GAM click URL chaining"
  - "Fire-and-forget insert pattern for non-blocking ad event logging"
affects: [08-03-serve-ad, 08-04-tag-generation, 09-billing, 10-analytics]

# Tech tracking
tech-stack:
  added: []
  patterns: [fire-and-forget-insert, pixel-tracking-endpoint, click-redirect-with-gam-chain, pre-rendered-html-save]

key-files:
  created:
    - supabase/functions/track-event/index.ts
    - supabase/functions/click-redirect/index.ts
  modified:
    - apps/web/src/features/editor/pages/editor-page.tsx

key-decisions:
  - "Fire-and-forget DB inserts: never block pixel/redirect response for database operations"
  - "Always return pixel on invalid params: never break ad rendering even with bad tracking data"
  - "GAM click chain: prepend GAM click URL to destination with encodeURIComponent for proper nesting"
  - "CORS preflight handlers on both functions for cross-origin ad tag requests"

patterns-established:
  - "Fire-and-forget insert: Supabase .insert().then().catch() without await for non-blocking event logging"
  - "Pixel tracking: return 1x1 transparent GIF immediately, insert asynchronously"
  - "Click redirect: log event, build final URL with optional GAM chain, return 302"
  - "Pre-rendered HTML save: generatePreviewHtml(config) called at save time, stored in creatives.rendered_html"

requirements-completed: [SERV-02, SERV-03]

# Metrics
duration: 2min
completed: 2026-02-24
---

# Phase 8 Plan 2: Editor Save Flow and Tracking Edge Functions Summary

**Pre-rendered HTML storage in editor save flow, track-event pixel endpoint returning 1x1 GIF with fire-and-forget event logging, and click-redirect with GAM click chain support**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-24T05:41:39Z
- **Completed:** 2026-02-24T05:44:01Z
- **Tasks:** 2
- **Files created/modified:** 3

## Accomplishments

- Modified editor save flow to generate pre-rendered HTML via generatePreviewHtml(config) and store it in both create and update Supabase payloads
- Created track-event Edge Function that returns a 1x1 transparent GIF pixel while asynchronously logging 10 event types with device/UTM/cookie context to ad_events
- Created click-redirect Edge Function that logs click events and 302 redirects with GAM click URL chaining support

## Task Commits

Each task was committed atomically:

1. **Task 1: Add rendered_html to editor save flow** - `0afc0dd` (feat)
2. **Task 2: Create track-event and click-redirect Edge Functions** - `6b99479` (feat)

**Plan metadata:** [pending] (docs: complete plan)

## Files Created/Modified

- `apps/web/src/features/editor/pages/editor-page.tsx` - Added generatePreviewHtml import, rendered_html in both create and update payloads
- `supabase/functions/track-event/index.ts` - Pixel tracking endpoint with 1x1 GIF response, 10 valid event types, fire-and-forget ad_events insert
- `supabase/functions/click-redirect/index.ts` - Click logging with 302 redirect, GAM click URL chaining, fire-and-forget ad_events insert

## Decisions Made

1. **Fire-and-forget DB inserts** - Pixel response and redirect are returned immediately without awaiting the database insert. Ad event logging should never slow down ad rendering or click navigation.
2. **Always return pixel on invalid params** - Even with missing/invalid event types, track-event returns the 1x1 GIF to avoid breaking ad rendering in the publisher page.
3. **GAM click chain via encodeURIComponent** - When a GAM click URL is provided, the destination URL is appended via `gamClickUrl + encodeURIComponent(dest)` so GAM records the click before redirecting to the actual landing page.
4. **CORS preflight on both functions** - Both endpoints handle OPTIONS requests since they receive cross-origin requests from ad tags embedded on publisher pages.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **Pre-existing build errors** - `pnpm run build` fails due to pre-existing TypeScript errors in campaign-detail-page.tsx (unused imports). These exist before Phase 8 changes and are unrelated. Verified our changes introduce no new errors.

## User Setup Required

None - no external service configuration required. Edge Functions will be deployed with `--no-verify-jwt` during deployment phase.

## Next Phase Readiness

- Editor save flow now populates rendered_html for serve-ad consumption
- track-event ready for integration in serve-ad HTML tracking pixels
- click-redirect ready for integration in serve-ad CTA click URLs
- Both functions follow the same Deno.serve pattern as existing admin functions

**No blockers for Plan 03 (serve-ad Edge Function).**

## Self-Check: PASSED

All claimed artifacts verified:

| Artifact | Status |
|----------|--------|
| apps/web/src/features/editor/pages/editor-page.tsx | FOUND |
| supabase/functions/track-event/index.ts | FOUND |
| supabase/functions/click-redirect/index.ts | FOUND |
| 08-02-SUMMARY.md | FOUND |
| Commit 0afc0dd | FOUND |
| Commit 6b99479 | FOUND |
| rendered_html in editor-page.tsx | VERIFIED |
| PIXEL constant in track-event | VERIFIED |
| 302 redirect in click-redirect | VERIFIED |

---
*Phase: 08-ad-serving-infrastructure*
*Completed: 2026-02-24*
