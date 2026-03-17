---
phase: 08-ad-serving-infrastructure
plan: 01
subsystem: database
tags: [supabase, postgresql, plpgsql, credit-balance, ad-serving, tracking, deno, edge-functions]

# Dependency graph
requires:
  - phase: 01-foundation-data-schema
    provides: "advertisers and creatives tables, SECURITY DEFINER pattern, migration deployment via db push --db-url"
provides:
  - "credit_balance BIGINT column on advertisers with DEFAULT 0"
  - "rendered_html TEXT column on creatives for pre-rendered ad HTML storage"
  - "deduct_impression_credit atomic PL/pgSQL function with row-level lock"
  - "Partial index idx_advertisers_credit_balance for fast credit lookup"
  - "TypeScript types updated with credit_balance, rendered_html, deduct_impression_credit"
  - "Shared tracking-utils.ts with parseCookie, extractUtmParams, normalizeDevice"
affects: [08-02-serve-ad, 08-03-track-event-click-redirect, 08-04-rendered-html-save, 09-billing, 10-analytics]

# Tech tracking
tech-stack:
  added: []
  patterns: [atomic-credit-deduction, pre-rendered-html-storage, shared-edge-function-utilities, partial-index-for-active-records]

key-files:
  created:
    - supabase/migrations/20260224000001_credit_balance_serving.sql
    - supabase/functions/_shared/tracking-utils.ts
  modified:
    - packages/shared/src/database.types.ts

key-decisions:
  - "BIGINT for credit_balance supports billions of impressions without overflow"
  - "Atomic UPDATE...WHERE credit_balance >= 1 pattern prevents concurrent over-deduction via implicit row-level lock"
  - "rendered_html stored at save time to avoid duplicating 14 format renderers in Deno Edge Function runtime"
  - "Simple regex-based device normalization (no ua-parser library) sufficient for v1 analytics grouping"

patterns-established:
  - "Atomic credit deduction: single UPDATE with WHERE clause for row-level locking, FOUND for success check"
  - "Pre-rendered HTML: store buildPreviewHtml() output in database column for ad serving consumption"
  - "Shared Edge Function utilities: tracking-utils.ts alongside supabase-admin.ts in _shared/ directory"
  - "Partial index pattern: index only active records (credit_balance > 0) for ad serving query performance"

# Metrics
duration: 4min
completed: 2026-02-24
---

# Phase 8 Plan 1: Ad Serving Database Foundation Summary

**Atomic credit deduction function, pre-rendered HTML column, and shared tracking utilities for Edge Function ad serving pipeline**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-02-24T05:27:46Z
- **Completed:** 2026-02-24T05:31:59Z
- **Tasks:** 2
- **Files created/modified:** 3

## Accomplishments

- Deployed SQL migration adding credit_balance (BIGINT, default 0) to advertisers and rendered_html (TEXT) to creatives, with atomic deduct_impression_credit PL/pgSQL function and partial index
- Updated TypeScript types in database.types.ts with all new columns and the deduct function signature
- Created tracking-utils.ts with parseCookie, extractUtmParams, and normalizeDevice utilities for Edge Functions

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migration for credit balance, rendered HTML, and deduct function** - `864bf56` (feat)
2. **Task 2: Update shared TypeScript types and create tracking utilities** - `06a29b6` (feat)

**Plan metadata:** [pending] (docs: complete plan)

## Files Created/Modified

- `supabase/migrations/20260224000001_credit_balance_serving.sql` - credit_balance column, rendered_html column, deduct_impression_credit function, partial index
- `packages/shared/src/database.types.ts` - Added credit_balance to advertisers, rendered_html to creatives, deduct_impression_credit to Functions
- `supabase/functions/_shared/tracking-utils.ts` - parseCookie, extractUtmParams, normalizeDevice utility functions for Edge Functions

## Decisions Made

1. **BIGINT for credit_balance** - Supports billions of impressions without overflow; matches BIGINT usage on daily_metrics counters from Phase 1.
2. **Atomic UPDATE...WHERE for deduction** - PostgreSQL implicit row-level lock prevents concurrent over-deduction without Redis or advisory locks. FOUND returns true only if a row was updated.
3. **SECURITY DEFINER + SET search_path** - Follows Phase 1 established pattern for PL/pgSQL functions to prevent search_path manipulation attacks.
4. **Simple regex device normalization** - No ua-parser library needed for v1; mobile/desktop/tablet + OS + browser categorization sufficient for analytics grouping.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **Pre-existing build errors** - `pnpm run build` fails due to pre-existing TypeScript errors in campaign-detail-page.tsx (unused imports) and editor-preview.tsx/preview-page.tsx (TemplateConfig type mismatches). These exist before Phase 8 changes. Verified via `tsc --noEmit` that our type additions compile without errors. Logged to deferred-items.md.
- **Tracker tables migration also applied** - The Phase 7 tracker_tables migration (20260223000001) had not been pushed to the database yet. It was applied alongside our migration during `db push`. No issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Database foundation ready for Plan 02 (serve-ad Edge Function): credit deduction function callable via RPC, rendered_html column queryable
- Tracking utilities ready for Plan 03 (track-event and click-redirect Edge Functions)
- TypeScript types compatible with existing web app build
- Plan 04 (rendered_html save flow) can use the new creatives.rendered_html column

**No blockers for Plan 02.**

## Self-Check: PASSED

All claimed artifacts verified:

| Artifact | Status |
|----------|--------|
| supabase/migrations/20260224000001_credit_balance_serving.sql | FOUND |
| packages/shared/src/database.types.ts | FOUND |
| supabase/functions/_shared/tracking-utils.ts | FOUND |
| 08-01-SUMMARY.md | FOUND |
| Commit 864bf56 | FOUND |
| Commit 06a29b6 | FOUND |
| deduct_impression_credit RPC (HTTP 200) | VERIFIED |
| credit_balance column via REST API (HTTP 206) | VERIFIED |
| rendered_html column via REST API (HTTP 206) | VERIFIED |

---
*Phase: 08-ad-serving-infrastructure*
*Completed: 2026-02-24*
