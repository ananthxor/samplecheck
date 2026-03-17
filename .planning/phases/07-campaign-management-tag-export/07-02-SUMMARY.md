---
phase: 07-campaign-management-tag-export
plan: 02
subsystem: database, api
tags: [supabase, postgresql, rls, react-query, zod, ad-tags, dfp, gam, trackers]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Database schema with campaigns, creatives tables, RLS helpers, handle_updated_at trigger"
  - phase: 07-campaign-management-tag-export plan 01
    provides: "Campaign feature module structure, campaigns-api pattern"
provides:
  - "tracker_configs and creative_trackers database tables with RLS policies"
  - "TypeScript types for tracker tables in shared package"
  - "DFP/GAM tag generator with standard GAM macros"
  - "Embed tag generator with async script and noscript fallback"
  - "Tracker CRUD API (7 functions) and React Query hooks (7 hooks)"
  - "Tracker type constants, fire condition labels, Zod validation schema"
affects: [07-03-campaign-ui-tag-export, 08-ad-serving]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure function tag generation (no side effects, serveBaseUrl as parameter)"
    - "Permissive URL validation for tracker URLs with macro placeholders"
    - "Junction table pattern for creative-tracker assignments with fire conditions"

key-files:
  created:
    - "supabase/migrations/20260223000001_tracker_tables.sql"
    - "apps/web/src/features/campaigns/lib/tag-generator.ts"
    - "apps/web/src/features/campaigns/lib/tracker-types.ts"
    - "apps/web/src/features/campaigns/api/trackers-api.ts"
    - "apps/web/src/features/campaigns/hooks/use-trackers.ts"
  modified:
    - "packages/shared/src/database.types.ts"

key-decisions:
  - "TEXT with CHECK constraint for tracker_type and fire_condition (not PostgreSQL enums) -- simpler migration, string type in TypeScript"
  - "Permissive URL validation in Zod schema allows macro placeholders like %%CACHEBUSTER%% in tracker URLs"
  - "CreativeTrackerWithConfig type alias for joined query results (creative_trackers + tracker_configs)"

patterns-established:
  - "Tag generator as pure functions with TagGeneratorInput interface"
  - "getServeBaseUrl() helper reads VITE_SERVE_BASE_URL with window.location.origin fallback"
  - "Tracker hooks use 'tracker-configs' and 'creative-trackers' query key namespaces"

# Metrics
duration: 2min
completed: 2026-02-23
---

# Phase 7 Plan 02: Tracker Schema & Tag Generation Summary

**Tracker database tables with RLS, DFP/GAM and embed tag generators with standard macros, and full tracker CRUD API with React Query hooks**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-23T02:55:50Z
- **Completed:** 2026-02-23T02:58:11Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created tracker_configs and creative_trackers database migration with RLS policies, indexes, and updated_at trigger
- Updated shared TypeScript types with both new tracker table definitions
- Built DFP/GAM tag generator with %%CACHEBUSTER%% and %%CLICK_URL_ESC%% macros using modern async script pattern
- Built embed tag generator with async script loading and noscript fallback
- Implemented complete tracker CRUD API (7 functions) and React Query hooks (7 hooks)
- Added tracker type constants, fire condition labels, and Zod validation schema with permissive URL validation

## Task Commits

Each task was committed atomically:

1. **Task 1: Tracker database migration and shared TypeScript types update** - `4a006e8` (feat)
2. **Task 2: Tag generator utilities, tracker types, tracker API, and React Query hooks** - `cbcb857` (feat)

## Files Created/Modified
- `supabase/migrations/20260223000001_tracker_tables.sql` - Tracker configs and creative trackers tables with RLS
- `packages/shared/src/database.types.ts` - Added tracker_configs and creative_trackers type definitions
- `apps/web/src/features/campaigns/lib/tag-generator.ts` - DFP/GAM and embed tag generation pure functions
- `apps/web/src/features/campaigns/lib/tracker-types.ts` - Tracker constants, fire conditions, Zod schema
- `apps/web/src/features/campaigns/api/trackers-api.ts` - Tracker CRUD operations (7 functions)
- `apps/web/src/features/campaigns/hooks/use-trackers.ts` - React Query hooks (7 hooks)

## Decisions Made
- Used TEXT with CHECK constraint for tracker_type and fire_condition instead of PostgreSQL enums -- simpler to add values later without enum ALTER migration, maps to string in TypeScript with union type comments
- Permissive URL validation in Zod schema (refine with startsWith check only) to allow macro placeholders like %%CACHEBUSTER%%, ${timestamp}, [random] in tracker URLs -- z.url() would reject these
- Created CreativeTrackerWithConfig type alias for the joined query pattern (creative_trackers with tracker_configs) to provide typed access to tracker config details when listing creative trackers

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Database migration can be deployed with `npx supabase db push --db-url "$DATABASE_URL"` when ready.

## Next Phase Readiness
- Tracker schema ready for deployment -- migration follows established pattern
- Tag generators ready for UI integration in Plan 03 (tag export dialog)
- Tracker CRUD API and hooks ready for tracker management UI in Plan 03
- All code compiles without type errors in both shared and web packages

## Self-Check: PASSED

- All 6 files verified present on disk
- Commit `4a006e8` (Task 1) verified in git log
- Commit `cbcb857` (Task 2) verified in git log
- TypeScript compilation passes in both packages/shared and apps/web

---
*Phase: 07-campaign-management-tag-export*
*Completed: 2026-02-23*
