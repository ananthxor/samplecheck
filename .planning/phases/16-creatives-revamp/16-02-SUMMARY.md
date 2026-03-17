---
phase: 16-creatives-revamp
plan: "02"
subsystem: ui
tags: [react-router, useSearchParams, useEffect, creatives, category-preselection]

# Dependency graph
requires:
  - phase: 16-creatives-revamp
    provides: "/creatives/new route serving the 498-format browser via creatives-new-page.tsx"
provides:
  - "initialCategoryKey prop on Creatives component for programmatic category selection"
  - "SLUG_TO_CATEGORY_KEY mapping in creatives-new-page for URL-driven category pre-selection"
  - "Deep-link support: /creatives/new?type=interactive pre-selects category and skips to step 1"
affects: [16-creatives-revamp]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Mount-only useEffect with eslint-disable for one-time initialization from props"
    - "Two-step lookup pattern: find by key then pass id to action function"
    - "Static slug-to-key mapping table for URL param normalization"

key-files:
  created: []
  modified:
    - apps/web/src/features/templates/pages/creatives-selector.tsx
    - apps/web/src/features/templates/pages/creatives-new-page.tsx

key-decisions:
  - "pickCategory expects cat.id not cat.key -- two-step lookup required (find by key, pass id)"
  - "Mount-only useEffect with [] deps and eslint-disable comment to fire once on initial render"
  - "Video slug has no matching fmtData category -- undefined fallback opens step 0 (correct behavior)"

patterns-established:
  - "initialCategoryKey prop pattern for programmatic category pre-selection in Creatives browser"

requirements-completed: [CRV-01, CRV-05]

# Metrics
duration: 3min
completed: 2026-03-07
---

# Phase 16 Plan 02: Category Pre-Selection via URL Parameter Summary

**initialCategoryKey prop + mount-only useEffect on Creatives component, with SLUG_TO_CATEGORY_KEY mapping in creatives-new-page for deep-link category pre-selection**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-07
- **Completed:** 2026-03-07
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 2

## Accomplishments
- Added `initialCategoryKey?: string` prop to the Creatives component with a mount-only `useEffect` that performs two-step lookup (find category by key, pass its id to `pickCategory`)
- Created `SLUG_TO_CATEGORY_KEY` mapping in `creatives-new-page.tsx` to translate URL slugs to fmtData category keys
- All 7 verification flows approved by human: deep-links, fallback behavior, modal rendering, format count (498), and search dialog navigation

## Task Commits

No commits created -- user manages all git commits manually.

## Files Created/Modified
- `apps/web/src/features/templates/pages/creatives-selector.tsx` - Added CreativesProps interface with `initialCategoryKey?: string`, mount-only useEffect for programmatic category selection
- `apps/web/src/features/templates/pages/creatives-new-page.tsx` - Added useSearchParams import, SLUG_TO_CATEGORY_KEY mapping table, passes resolved key as initialCategoryKey prop to Creatives

## Decisions Made
- `pickCategory(id)` expects `cat.id` (e.g. "cat-1"), not `cat.key` (e.g. "interactive") -- the useEffect must do a two-step lookup: find the category by key in adCategories, then pass its id to pickCategory
- Mount-only useEffect with empty `[]` dependency array and eslint-disable comment -- intentionally runs once to avoid re-triggering on state changes
- Video slug (`video`) has no matching fmtData category, so `SLUG_TO_CATEGORY_KEY[typeParam]` returns undefined and the browser correctly opens at step 0 (Choose Ad Type)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Full deep-link routing is operational: dashboard cards, search dialog, and direct URLs all correctly pre-select categories
- Ready for subsequent plans in Phase 16 (if any)

---
*Phase: 16-creatives-revamp*
*Completed: 2026-03-07*

## Self-Check: PASSED

Both modified files verified present. All 7 human verification flows approved. No deviations from plan.
