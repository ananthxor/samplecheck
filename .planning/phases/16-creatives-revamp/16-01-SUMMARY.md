---
phase: 16-creatives-revamp
plan: "01"
subsystem: ui
tags: [react-router, routing, creatives, navigation]

# Dependency graph
requires: []
provides:
  - "/creatives/new route serving the 498-format browser via creatives-new-page.tsx"
  - "/creatives route unconditionally rendering CreativeList (no query-param branching)"
  - "All navigation links updated to /creatives/new pattern"
affects: [16-creatives-revamp]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Thin page wrapper pattern for composing feature components into routes"
    - "Clean URL semantics: list page vs creation page as separate routes"

key-files:
  created:
    - apps/web/src/features/templates/pages/creatives-new-page.tsx
  modified:
    - apps/web/src/router.tsx
    - apps/web/src/features/creatives/pages/creatives-page.tsx
    - apps/web/src/features/creatives/components/creative-list.tsx
    - apps/web/src/features/dashboard/components/ad-type-card.tsx
    - apps/web/src/components/layout/search-dialog.tsx

key-decisions:
  - "mt-0 wrapper on CreativesNewPage to override cr-root margin-top:84px (no fixed top-nav in app shell)"
  - "Dropped &format= query param from search dialog links (old branching logic removed)"

patterns-established:
  - "Route separation: /creatives = list, /creatives/new = creation browser"

requirements-completed: [CRV-01, CRV-02, CRV-03, CRV-04]

# Metrics
duration: 1min
completed: 2026-03-07
---

# Phase 16 Plan 01: Route Restructuring Summary

**Split /creatives into list-only route and /creatives/new format-browser route, fixing all navigation links across dashboard, search dialog, and creative list**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-07T10:25:21Z
- **Completed:** 2026-03-07T10:26:04Z
- **Tasks:** 3
- **Files modified:** 6 (1 created, 5 modified)

## Accomplishments
- Created `creatives-new-page.tsx` as thin wrapper rendering the 498-format Creatives browser
- Simplified `creatives-page.tsx` to unconditionally render `<CreativeList />` (removed useSearchParams branching)
- Updated all navigation targets: dashboard ad-type cards, "Create New" button, "Browse Templates" button, and search dialog format links

## Task Commits

No commits created -- user manages all git commits manually.

## Files Created/Modified
- `apps/web/src/features/templates/pages/creatives-new-page.tsx` - New thin page wrapper rendering `<Creatives />` with mt-0 override
- `apps/web/src/router.tsx` - Changed `/creatives/new` lazy import from editor-page to creatives-new-page
- `apps/web/src/features/creatives/pages/creatives-page.tsx` - Removed useSearchParams/TemplatesPage branching, always renders `<CreativeList />`
- `apps/web/src/features/creatives/components/creative-list.tsx` - Changed 2x `navigate('/creatives?type=all')` to `navigate('/creatives/new')`
- `apps/web/src/features/dashboard/components/ad-type-card.tsx` - Changed Link to `/creatives/new?type=${adType.slug}`
- `apps/web/src/components/layout/search-dialog.tsx` - Changed format link to `/creatives/new?type=${type.slug}` (removed `&format=` param)

## Decisions Made
- Used `mt-0` className on CreativesNewPage wrapper to override the `margin-top: 84px` rule in creatives.css (designed for a fixed top-nav not present in this app shell)
- Dropped the `&format=${format.slug}` segment from search dialog links since the old branching logic that consumed it no longer exists

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Route structure is clean: `/creatives` = list, `/creatives/new` = format browser
- Ready for Plan 16-02 to wire category pre-selection via `?type=` query param in creatives-new-page

---
*Phase: 16-creatives-revamp*
*Completed: 2026-03-07*

## Self-Check: PASSED

All 7 files verified present. TypeScript build passes with zero errors. No old `/creatives?type=` URLs remain.
