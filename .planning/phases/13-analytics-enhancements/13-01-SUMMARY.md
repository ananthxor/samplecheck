---
phase: 13-analytics-enhancements
plan: 01
subsystem: database, infra
tags: [supabase, plpgsql, rpc, recharts-to-png, sheetjs, xlsx, analytics]

# Dependency graph
requires:
  - phase: 10-analytics-reporting
    provides: ad_events table, daily_metrics table, analytics feature structure
  - phase: 08-ad-serving-infrastructure
    provides: track-event Edge Function storing device_type in extra_data
provides:
  - fetch_hourly_metrics RPC (24-row zero-filled hourly breakdown)
  - fetch_device_breakdown RPC (device type impression counts)
  - recharts-to-png library for chart PNG export
  - SheetJS 0.20.3 for XLS workbook generation
affects: [13-02, 13-03, analytics-page, campaign-detail-page]

# Tech tracking
tech-stack:
  added: [recharts-to-png@3.0.1, xlsx@0.20.3]
  patterns: [generate_series zero-fill for time-series gaps, CDN tarball install for unmaintained npm packages]

key-files:
  created:
    - supabase/migrations/20260225000010_hourly_device_analytics.sql
  modified:
    - apps/web/package.json
    - pnpm-lock.yaml

key-decisions:
  - "Device breakdown RPC scoped to impression_served events only for KPI consistency"
  - "SheetJS installed from CDN tarball (0.20.3) not npm registry (stale 0.18.5)"
  - "generate_series(0,23) LEFT JOIN for guaranteed 24-row hourly output"

patterns-established:
  - "Zero-fill pattern: generate_series + LEFT JOIN + COALESCE for time-series RPCs"
  - "CDN tarball install: pnpm add <tarball-url> for packages not maintained on npm"

requirements-completed: [ANLYT-08, ANLYT-11, ANLYT-13]

# Metrics
duration: 2min
completed: 2026-02-25
---

# Phase 13 Plan 01: Analytics Backend & Library Foundation Summary

**Two Supabase RPCs (hourly metrics + device breakdown) deployed with recharts-to-png and SheetJS 0.20.3 installed for chart export and XLS generation**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-25T10:01:37Z
- **Completed:** 2026-02-25T10:04:03Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Deployed fetch_hourly_metrics RPC returning exactly 24 zero-filled rows (hours 0-23) for any advertiser+date
- Deployed fetch_device_breakdown RPC grouping impression_served events by device_type from ad_events.extra_data
- Installed recharts-to-png@3.0.1 with Recharts 3.x peer dep satisfied by existing recharts@3.7.0
- Installed SheetJS 0.20.3 from official CDN tarball (not stale npm registry version)
- Build verified with zero new TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Supabase migration -- fetch_hourly_metrics and fetch_device_breakdown RPCs** - `67e1d91` (feat)
2. **Task 2: Install recharts-to-png and SheetJS 0.20.3** - `da15ce6` (chore)

**Plan metadata:** `1afa04c` (docs: complete plan)

## Files Created/Modified
- `supabase/migrations/20260225000010_hourly_device_analytics.sql` - Two SECURITY DEFINER PL/pgSQL functions for hourly and device analytics
- `apps/web/package.json` - Added recharts-to-png@^3.0.1 and xlsx from CDN tarball
- `pnpm-lock.yaml` - Lock file updated with new dependencies

## Decisions Made
- Device breakdown RPC scoped to `impression_served` events only -- matches KPI impressions metric for consistency (not all event types)
- SheetJS installed from CDN tarball URL (`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`) per maintainer recommendation -- npm registry version is 0.18.5 (stale/unmaintained)
- `generate_series(0, 23)` with LEFT JOIN ensures all 24 hours returned even with zero events -- prevents gaps in hourly chart

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - migration pushed successfully, both packages installed on first attempt, build passed cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Backend foundation complete: both RPCs deployed and verified via REST API
- Library foundation complete: recharts-to-png and SheetJS importable
- Plans 13-02 (new chart components, hourly/creative/device) and 13-03 (chart PNG download, XLS export) can proceed

## Self-Check: PASSED

- [x] `supabase/migrations/20260225000010_hourly_device_analytics.sql` exists
- [x] `apps/web/package.json` contains recharts-to-png and xlsx
- [x] Commit `67e1d91` exists (Task 1)
- [x] Commit `da15ce6` exists (Task 2)
- [x] fetch_hourly_metrics RPC returns 24 rows (verified via REST API)
- [x] fetch_device_breakdown RPC callable (verified via REST API)
- [x] Build passes with no new errors

---
*Phase: 13-analytics-enhancements*
*Completed: 2026-02-25*
