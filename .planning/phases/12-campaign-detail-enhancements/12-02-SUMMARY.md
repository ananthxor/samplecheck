---
phase: 12-campaign-detail-enhancements
plan: 02
subsystem: ui
tags: [react, supabase, tanstack-query, mutation, duplication]

# Dependency graph
requires:
  - phase: 12-campaign-detail-enhancements
    plan: 01
    provides: "Campaign detail page with creative cards in Creatives tab"
provides:
  - "duplicateCreative API function for one-click creative copying"
  - "useDuplicateCreative TanStack Query mutation hook with 3-key cache invalidation"
  - "Duplicate button on every creative card in campaign detail Creatives tab"
affects: [12-campaign-detail-enhancements]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Spread-and-omit pattern for duplicating DB rows (destructure out auto-generated fields)"
    - "Triple cache invalidation on creative mutation (campaign-creatives, campaigns, creatives)"

key-files:
  created: []
  modified:
    - apps/web/src/features/campaigns/api/campaigns-api.ts
    - apps/web/src/features/campaigns/hooks/use-campaigns.ts
    - apps/web/src/features/campaigns/pages/campaign-detail-page.tsx

key-decisions:
  - "Spread-and-omit to copy all creative fields, excluding id/created_at/updated_at/preview_token for DB auto-generation"
  - "Triple cache invalidation (campaign-creatives + campaigns + creatives) to keep all lists in sync"
  - "Duplicate button available for ALL creative statuses (no restrictions)"

patterns-established:
  - "Creative duplication: spread source row, omit auto-generated fields, suffix name, reset status to draft"

requirements-completed: [CAMP-10]

# Metrics
duration: 2min
completed: 2026-02-25
---

# Phase 12 Plan 02: Creative Duplication Summary

**One-click creative duplication with spread-and-omit API, TanStack mutation hook, and Duplicate button on every creative card**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-25T09:22:45Z
- **Completed:** 2026-02-25T09:24:58Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- duplicateCreative API function copies all fields from source creative, omitting auto-generated columns (id, created_at, updated_at, preview_token)
- useDuplicateCreative hook invalidates 3 query caches (campaign-creatives, campaigns, creatives) for instant UI updates
- Duplicate button on every creative card with Files icon, disabled-while-pending, and success/error toasts

## Task Commits

Each task was committed atomically:

1. **Task 1: Add duplicateCreative API function and useDuplicateCreative hook** - `fbfbd50` (feat)
2. **Task 2: Add duplicate button to creative cards in campaign detail page** - `19a3a14` (feat)

## Files Created/Modified
- `apps/web/src/features/campaigns/api/campaigns-api.ts` - Added duplicateCreative function (fetch source, spread-and-omit, insert copy)
- `apps/web/src/features/campaigns/hooks/use-campaigns.ts` - Added useDuplicateCreative hook with triple cache invalidation
- `apps/web/src/features/campaigns/pages/campaign-detail-page.tsx` - Added Duplicate button with Files icon to each creative card footer

## Decisions Made
- Used spread-and-omit pattern: destructure out id/created_at/updated_at/preview_token, spread remaining fields to copy everything including rendered_html and template_data (prevents blank previews in duplicated creatives)
- Invalidate all three query keys (campaign-creatives, campaigns, creatives) so the new creative appears in the current campaign list, updates campaign creative counts, and shows in the global My Creatives list
- Duplicate button available for all creative statuses -- users may want to duplicate archived or paused creatives for new variations

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 12 complete -- all campaign detail enhancements delivered (tabs, analytics, placements, duplication)
- Ready for Phase 13 (advanced analytics and reporting) or Phase 14 (data import/export)

## Self-Check: PASSED

All 3 files verified present. Both commit hashes (fbfbd50, 19a3a14) verified in git log.

---
*Phase: 12-campaign-detail-enhancements*
*Completed: 2026-02-25*
