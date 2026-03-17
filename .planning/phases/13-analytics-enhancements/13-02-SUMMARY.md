---
phase: 13-analytics-enhancements
plan: 02
subsystem: ui, api
tags: [recharts, analytics, charts, pie-chart, bar-chart, kpi, png-export, recharts-to-png]

# Dependency graph
requires:
  - phase: 13-analytics-enhancements
    provides: fetch_hourly_metrics RPC, fetch_device_breakdown RPC, recharts-to-png library
  - phase: 10-analytics-reporting
    provides: analytics feature structure, KpiCards and MetricsChart component patterns
provides:
  - HourlyDataPoint, CreativePieSlice, DeviceBreakdownPoint types
  - aggregateByCreative utility for top-8 + Other creative grouping
  - fetchHourlyMetrics, fetchLifetimeMetrics, fetchDeviceBreakdown API functions
  - useHourlyMetrics, useLifetimeMetrics, useDeviceBreakdown React Query hooks
  - HourlyChart component (24-bar with hour labels)
  - CreativePieChart component (donut with top-8 + Other)
  - PlatformChart component (horizontal bar for device breakdown)
  - LifetimeKpiCards component (all-time impressions/clicks/CTR)
  - ChartDownloadButton component (PNG export with white background)
affects: [13-03, analytics-page]

# Tech tracking
tech-stack:
  added: []
  patterns: [chartRef prop pattern for PNG export, useGenerateImage ref-sync for external refs, formatHour utility for 12h labels]

key-files:
  created:
    - apps/web/src/features/analytics/components/hourly-chart.tsx
    - apps/web/src/features/analytics/components/creative-pie-chart.tsx
    - apps/web/src/features/analytics/components/platform-chart.tsx
    - apps/web/src/features/analytics/components/lifetime-kpi-cards.tsx
    - apps/web/src/features/analytics/components/chart-download-button.tsx
  modified:
    - apps/web/src/features/analytics/lib/analytics-types.ts
    - apps/web/src/features/analytics/api/analytics-api.ts
    - apps/web/src/features/analytics/hooks/use-analytics.ts

key-decisions:
  - "ChartDownloadButton syncs external chartRef to useGenerateImage internal ref for png export"
  - "fetchLifetimeMetrics uses 100k row safety cap with no date bounds for all-time aggregation"
  - "CreativePieChart uses fixed 9-color palette cycling through chart CSS variables"

patterns-established:
  - "chartRef prop pattern: chart components accept React.RefObject<HTMLDivElement> for PNG download support"
  - "formatHour utility: 0->12am, 1-11->Xam, 12->12pm, 13-23->Xpm for hourly chart labels"
  - "aggregateByCreative: top-8 slices + Other grouping for pie charts"

requirements-completed: [ANLYT-08, ANLYT-09, ANLYT-10, ANLYT-11, ANLYT-12]

# Metrics
duration: 4min
completed: 2026-02-25
---

# Phase 13 Plan 02: Analytics Charts & Data Layer Summary

**Five chart components (hourly bar, creative donut, platform bar, lifetime KPIs, PNG download) with extended types, API functions, and React Query hooks for hourly, lifetime, and device analytics**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-25T10:06:43Z
- **Completed:** 2026-02-25T10:10:50Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Extended analytics-types.ts with HourlyDataPoint, CreativePieSlice, DeviceBreakdownPoint interfaces and aggregateByCreative utility
- Added fetchHourlyMetrics, fetchLifetimeMetrics, fetchDeviceBreakdown API functions calling Supabase RPCs and direct queries
- Added useHourlyMetrics, useLifetimeMetrics, useDeviceBreakdown React Query hooks with appropriate staleTime caching
- Built HourlyChart component with 24-bar BarChart showing impressions and clicks by hour
- Built CreativePieChart donut chart capped at top-8 creatives plus Other group
- Built PlatformChart horizontal bar chart for device type breakdown (Desktop/Mobile/Tablet/Unknown)
- Built LifetimeKpiCards showing all-time Impressions, Clicks, and CTR in a 3-card grid
- Built ChartDownloadButton using recharts-to-png with white background to prevent black PNG issue

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend data layer -- types, API functions, and hooks** - `a947e45` (feat)
2. **Task 2: Build five new chart components** - `eef48b9` (feat)

**Plan metadata:** `dbe3886` (docs: complete plan)

## Files Created/Modified
- `apps/web/src/features/analytics/lib/analytics-types.ts` - Added HourlyDataPoint, CreativePieSlice, DeviceBreakdownPoint types and aggregateByCreative function
- `apps/web/src/features/analytics/api/analytics-api.ts` - Added fetchHourlyMetrics, fetchLifetimeMetrics, fetchDeviceBreakdown API functions
- `apps/web/src/features/analytics/hooks/use-analytics.ts` - Added useHourlyMetrics, useLifetimeMetrics, useDeviceBreakdown hooks
- `apps/web/src/features/analytics/components/hourly-chart.tsx` - 24-bar BarChart with hour labels and impressions/clicks bars
- `apps/web/src/features/analytics/components/creative-pie-chart.tsx` - Donut PieChart with top-8 creatives + Other grouping
- `apps/web/src/features/analytics/components/platform-chart.tsx` - Horizontal BarChart for device type breakdown
- `apps/web/src/features/analytics/components/lifetime-kpi-cards.tsx` - 3-card grid for all-time Impressions, Clicks, CTR
- `apps/web/src/features/analytics/components/chart-download-button.tsx` - PNG export button using recharts-to-png with white background fix

## Decisions Made
- ChartDownloadButton syncs external chartRef to useGenerateImage's internal ref rather than using html2canvas directly -- keeps recharts-to-png as the single dependency for chart-to-image conversion
- fetchLifetimeMetrics uses 100k row safety cap with no date bounds, suitable for v1 scale
- CreativePieChart uses fixed 9-color palette cycling through CSS custom properties (--chart-1 through --chart-5, repeated) for theme consistency

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all files compiled cleanly on first attempt, no dependency issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All five chart components are independently importable and ready for assembly
- Plan 13-03 can wire everything into analytics-page.tsx and add the XLS export layer
- Data layer complete: types, API, hooks, and components all TypeScript-verified

## Self-Check: PASSED

- [x] `apps/web/src/features/analytics/lib/analytics-types.ts` exists (HourlyDataPoint, CreativePieSlice, DeviceBreakdownPoint, aggregateByCreative)
- [x] `apps/web/src/features/analytics/api/analytics-api.ts` exists (fetchHourlyMetrics, fetchLifetimeMetrics, fetchDeviceBreakdown)
- [x] `apps/web/src/features/analytics/hooks/use-analytics.ts` exists (useHourlyMetrics, useLifetimeMetrics, useDeviceBreakdown)
- [x] `apps/web/src/features/analytics/components/hourly-chart.tsx` exists (HourlyChart)
- [x] `apps/web/src/features/analytics/components/creative-pie-chart.tsx` exists (CreativePieChart)
- [x] `apps/web/src/features/analytics/components/platform-chart.tsx` exists (PlatformChart)
- [x] `apps/web/src/features/analytics/components/lifetime-kpi-cards.tsx` exists (LifetimeKpiCards)
- [x] `apps/web/src/features/analytics/components/chart-download-button.tsx` exists (ChartDownloadButton)
- [x] Commit `a947e45` exists (Task 1)
- [x] Commit `eef48b9` exists (Task 2)
- [x] TypeScript compilation passes with no errors

---
*Phase: 13-analytics-enhancements*
*Completed: 2026-02-25*
