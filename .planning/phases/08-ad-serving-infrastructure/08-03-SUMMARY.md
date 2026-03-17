---
phase: 08-ad-serving-infrastructure
plan: 03
subsystem: ad-serving
tags: [supabase, edge-functions, deno, ad-serving, iframe-srcdoc, tracking-pixel, viewability, intersection-observer, click-redirect, credit-gate, third-party-trackers, cookies]

# Dependency graph
requires:
  - phase: 08-ad-serving-infrastructure
    provides: "credit_balance column, rendered_html column, deduct_impression_credit function, tracking-utils.ts, supabase-admin.ts, track-event endpoint, click-redirect endpoint"
  - phase: 04-template-library
    provides: "buildPreviewHtml renderer-shell producing self-contained HTML with #creative-root"
  - phase: 07-campaign-management-tag-export
    provides: "tracker_configs and creative_trackers tables with fire conditions"
provides:
  - "serve-ad Edge Function returning application/javascript with iframe srcdoc"
  - "Impression tracking pixel injection with track-event endpoint integration"
  - "IAB/MRC viewability measurement via IntersectionObserver at 0.5 threshold with 1s timer"
  - "CTA click URL rewriting through click-redirect endpoint with GAM click chain"
  - "Third-party tracker injection by fire condition (on_load, on_viewable, on_click, on_engagement)"
  - "Atomic credit gate via deduct_impression_credit RPC (204 on zero balance)"
  - "Anonymous user cookie (st_uid) with SameSite=None;Secure for cross-site tracking"
  - "uid query parameter fallback in tracking pixel URLs"
affects: [08-04-tag-deployment, 09-billing, 10-analytics]

# Tech tracking
tech-stack:
  added: []
  patterns: [application-javascript-response, iframe-srcdoc-ad-delivery, iab-mrc-viewability, credit-gate-pattern, cross-site-cookie-identity, tracker-fire-condition-mapping]

key-files:
  created:
    - supabase/functions/serve-ad/index.ts
  modified: []

key-decisions:
  - "application/javascript response (not text/html) to avoid Supabase content-type rewriting on non-custom domains"
  - "iframe srcdoc with JSON.stringify escaping to safely embed full HTML including script tags"
  - "Sandbox without allow-same-origin for publisher page security; allow-scripts, allow-popups, allow-top-navigation-by-user-activation for ad functionality"
  - "SameSite=None;Secure for cross-site st_uid cookie, with uid query param fallback for Safari ITP/Firefox ETP"
  - "Third-party trackers mapped to injection points: on_load=pixel in body, on_viewable=callback in IO observer, on_click=click handler on root, on_engagement=st:engagement event listener"

patterns-established:
  - "Ad serving response: Return application/javascript creating iframe with srcdoc (not text/html)"
  - "Credit gate: Check deduct_impression_credit before serving; 204 empty response on zero balance"
  - "Tracking injection: Build tracking code server-side, inject before </body> in rendered HTML"
  - "Viewability script: IntersectionObserver IIFE with threshold/timer/fired-flag/visibilitychange pattern"
  - "Cross-site cookie: Set-Cookie with SameSite=None;Secure, parseCookie to read existing, crypto.randomUUID for new"

requirements-completed: [SERV-01, SERV-04, SERV-07]

# Metrics
duration: 12min
completed: 2026-02-24
---

# Phase 8 Plan 3: Serve-Ad Edge Function Summary

**Core ad serving endpoint returning application/javascript with iframe srcdoc, atomic credit gate, IAB/MRC viewability via IntersectionObserver, impression/click tracking injection, and anonymous user cookie identity layer**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-02-24T05:47:01Z
- **Completed:** 2026-02-24T05:59:02Z
- **Tasks:** 2
- **Files created/modified:** 1

## Accomplishments

- Built the complete serve-ad Edge Function (433 lines) that fetches creative rendered_html, deducts credit atomically, injects tracking code, and returns application/javascript creating a sandboxed iframe with srcdoc
- Implemented IAB/MRC viewability measurement using IntersectionObserver at 0.5 threshold with 1-second timer, visibilitychange pause on tab switch, and fire-once disconnect pattern
- Integrated third-party tracker injection mapped by fire condition (on_load, on_viewable, on_click, on_engagement) with %%CACHEBUSTER%% macro replacement
- Completed DATA-04 identity layer with st_uid cross-site cookie (SameSite=None;Secure) and uid query parameter fallback in tracking pixel URLs

## Task Commits

Each task was committed atomically:

1. **Task 1: Build serve-ad Edge Function with tracking injection and credit gate** - `73e7ead` (feat)
2. **Task 2: Add anonymous user cookie and UTM/device context to serve-ad** - `c53e556` (feat)

**Plan metadata:** [pending] (docs: complete plan)

## Files Created/Modified

- `supabase/functions/serve-ad/index.ts` - Complete ad serving endpoint: creative fetch, credit deduction, tracking injection (impression pixel, viewability observer, click redirect, third-party trackers), iframe srcdoc JavaScript builder, anonymous user cookie

## Decisions Made

1. **application/javascript content-type** - Supabase rewrites text/html to text/plain on non-custom domains. The standard ad tech pattern is returning JavaScript that creates an iframe, which avoids this restriction entirely.
2. **JSON.stringify for srcdoc escaping** - Handles all special characters (quotes, newlines, backslashes, script close tags) safely when embedding HTML inside a JavaScript string assignment.
3. **Sandbox without allow-same-origin** - Prevents the ad iframe from accessing the publisher page's DOM. Includes allow-scripts, allow-popups, allow-popups-to-escape-sandbox, and allow-top-navigation-by-user-activation for ad functionality.
4. **SameSite=None;Secure with uid fallback** - Cross-site cookie for persistent identity tracking. uid query parameter in pixel URLs provides a fallback for browsers that block third-party cookies (Safari ITP, Firefox ETP).
5. **Fire condition mapping to injection points** - on_load trackers injected as img/script tags in body, on_viewable inside the IntersectionObserver callback after fired=true, on_click via addEventListener on creative root, on_engagement via st:engagement custom event listener.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - the implementation followed the research patterns and existing Edge Function conventions directly.

## User Setup Required

None - no external service configuration required. Edge Function will be deployed with `--no-verify-jwt` during deployment phase.

## Next Phase Readiness

- serve-ad endpoint complete and ready for deployment alongside track-event and click-redirect
- Ad tags from tag-generator.ts (Phase 7) point to the correct serve-ad URL pattern
- rendered_html populated by editor save flow (Phase 8 Plan 2) ready for serve-ad consumption
- All three ad serving Edge Functions (serve-ad, track-event, click-redirect) now exist
- Plan 04 (tag deployment and deployment verification) is the remaining plan in Phase 8

**No blockers for Plan 04.**

## Self-Check: PASSED

All claimed artifacts verified:

| Artifact | Status |
|----------|--------|
| supabase/functions/serve-ad/index.ts | FOUND |
| 08-03-SUMMARY.md | FOUND |
| Commit 73e7ead | FOUND |
| Commit c53e556 | FOUND |
| application/javascript content-type | VERIFIED |
| deduct_impression_credit RPC call | VERIFIED |
| IntersectionObserver viewability | VERIFIED |
| srcdoc iframe pattern | VERIFIED |
| Set-Cookie st_uid with SameSite=None | VERIFIED |
| parseCookie import | VERIFIED |
| creative_trackers query | VERIFIED |

---
*Phase: 08-ad-serving-infrastructure*
*Completed: 2026-02-24*
