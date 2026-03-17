---
phase: 13-analytics-enhancements
verified: 2026-02-25T10:40:00Z
status: human_needed
score: 5/5 must-haves verified
human_verification:
  - test: "Navigate to Analytics page and confirm Lifetime Totals KPI cards appear above date-range controls"
    expected: "Three cards — Impressions, Clicks, CTR — with all-time values; separate from and above the date-range KPI cards"
    why_human: "Requires live Supabase data and visual confirmation of section ordering"
  - test: "Select a single date in the Hourly Breakdown section and observe the chart"
    expected: "24-bar BarChart appears (hours 0-23); hour labels show '12am', '1am'...'12pm' etc; chart reflects the chosen date"
    why_human: "Requires runtime rendering of the chart and date picker interaction"
  - test: "Click the PNG download button on any chart (e.g., the Performance Over Time chart header)"
    expected: "A .png file downloads; opening it shows white background (not black)"
    why_human: "PNG background color can only be verified by opening the downloaded file; recharts-to-png backgroundColor fix cannot be confirmed statically"
  - test: "Click the Export XLS button on the analytics page"
    expected: "A .xlsx file downloads (not .csv); opening in Excel/Sheets shows a 'Daily Metrics' sheet with correct columns"
    why_human: "Actual file format and sheet structure require opening the generated file"
  - test: "Verify Platform Breakdown chart handles empty state gracefully"
    expected: "Either shows horizontal bars by device type (if device_type events exist) or shows 'No device data available for the selected period' message"
    why_human: "Conditional on device_type being populated in ad_events.extra_data — actual data state is unknown"
---

# Phase 13: Analytics Enhancements — Verification Report

**Phase Goal:** Users get deeper analytics insight with hourly drill-downs, lifetime totals, visual breakdowns by creative and platform, and can export charts as images or the full report as Excel
**Verified:** 2026-02-25T10:40:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can select any single date and see an hourly breakdown chart (24-hour X-axis) showing impressions and clicks per hour | VERIFIED (automated) | `HourlyChart` component exists (86 lines), renders 24-bar `BarChart` with `formatHour` labels, wired to `useHourlyMetrics(hourlyDate)` in `analytics-page.tsx` line 50; `fetch_hourly_metrics` RPC uses `generate_series(0,23)` LEFT JOIN with COALESCE zero-fill |
| 2 | User can see a lifetime totals section (all-time impressions, clicks, CTR) displayed separately above the date-range-filtered metrics | VERIFIED (automated) | `LifetimeKpiCards` component exists (65 lines), renders 3 KPI cards; mounted at line 96 of `analytics-page.tsx` — above the controls row (line 103) and date-range `KpiCards` (line 137); `useLifetimeMetrics()` queries `daily_metrics` with no date bounds and 100k safety cap |
| 3 | User can see a pie/donut chart showing each creative's share of total impressions for the selected date range | VERIFIED (automated) | `CreativePieChart` component exists (81 lines), uses Recharts `PieChart` with `innerRadius="45%"` (donut), `aggregateByCreative` computes top-8 + Other grouping in `analytics-page.tsx` line 78–81; `creativePieData` passed to chart at line 164 |
| 4 | User can see a platform breakdown chart (Desktop / Mobile / Tablet) if device data is available | VERIFIED (automated) | `PlatformChart` component exists (72 lines), horizontal `BarChart` with `layout="vertical"`, `capitalize()` tick formatter; wired to `useDeviceBreakdown(start, end)` in `analytics-page.tsx` line 52; `fetch_device_breakdown` RPC groups by `extra_data->>'device_type'` scoped to `impression_served`; proper empty state displayed when no data |
| 5 | User can click a download button on any chart to save it as PNG, and can export the full analytics report as XLS (with CSV fallback for large datasets) | VERIFIED (automated) | `ChartDownloadButton` exists (58 lines), uses `useGenerateImage` from `recharts-to-png` with `options: { backgroundColor: '#ffffff' }`; mounted in `MetricsChart` header (line 89), and for `CreativePieChart`, `PlatformChart`, `HourlyChart` in `analytics-page.tsx`; `xls-export.ts` (71 lines) exports `exportToXls` with `XLSX_ROW_LIMIT = 1_000_000` guard and CSV fallback; `ExportButton` wires `exportToXls` on click |

**Score:** 5/5 truths verified (automated code evidence)
**All truths require human smoke-testing for end-to-end confirmation.**

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/20260225000010_hourly_device_analytics.sql` | `fetch_hourly_metrics` + `fetch_device_breakdown` RPCs | VERIFIED | 77 lines; `generate_series(0,23)` zero-fill pattern confirmed; both functions are `SECURITY DEFINER SET search_path = public` |
| `apps/web/package.json` | `recharts-to-png` + `xlsx` dependencies | VERIFIED | `"recharts-to-png": "^3.0.1"` and `"xlsx": "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz"` both present |
| `apps/web/src/features/analytics/lib/analytics-types.ts` | `HourlyDataPoint`, `CreativePieSlice`, `DeviceBreakdownPoint`, `aggregateByCreative` | VERIFIED | All four exports present (lines 203–257); appended below existing types without modifying them |
| `apps/web/src/features/analytics/api/analytics-api.ts` | `fetchHourlyMetrics`, `fetchLifetimeMetrics`, `fetchDeviceBreakdown` | VERIFIED | All three functions present (lines 102–149); call correct RPC names; import `HourlyDataPoint` and `DeviceBreakdownPoint` types |
| `apps/web/src/features/analytics/hooks/use-analytics.ts` | `useHourlyMetrics`, `useLifetimeMetrics`, `useDeviceBreakdown` | VERIFIED | All three hooks present (lines 84–118); import API functions from `analytics-api.ts`; proper `enabled` guards and `staleTime` caching |
| `apps/web/src/features/analytics/components/hourly-chart.tsx` | `HourlyChart` component, min 50 lines | VERIFIED | 86 lines; 24-bar `BarChart`; `formatHour` utility; loading skeleton + empty state |
| `apps/web/src/features/analytics/components/creative-pie-chart.tsx` | `CreativePieChart` donut with top-8 + Other, min 60 lines | VERIFIED | 81 lines; `PieChart` with `innerRadius="45%"` `outerRadius="75%"`; 9-color `COLORS` palette; `label={false}`; Legend + Tooltip |
| `apps/web/src/features/analytics/components/platform-chart.tsx` | `PlatformChart` for device breakdown, min 50 lines | VERIFIED | 72 lines; horizontal `BarChart` (`layout="vertical"`); `capitalize()` tick formatter; empty state text matches spec |
| `apps/web/src/features/analytics/components/lifetime-kpi-cards.tsx` | `LifetimeKpiCards` with all-time totals, min 40 lines | VERIFIED | 65 lines; 3 KPI cards grid (Impressions/Clicks/CTR); correct icons (Eye, MousePointerClick, TrendingUp); section header "Lifetime Totals" with subtitle |
| `apps/web/src/features/analytics/components/chart-download-button.tsx` | `ChartDownloadButton` with white background fix, min 30 lines | VERIFIED | 58 lines; `useGenerateImage` with `options: { backgroundColor: '#ffffff' }`; anchor-click download pattern (no file-saver dep); "Generating..." label during load |
| `apps/web/src/features/analytics/lib/xls-export.ts` | `exportToXls` with `XLSX_ROW_LIMIT` and CSV fallback | VERIFIED | 71 lines; `XLSX_ROW_LIMIT = 1_000_000`; CSV fallback via `exportToCsv`; SheetJS `utils.json_to_sheet` + `utils.book_append_sheet(wb, ws, 'Daily Metrics')` |
| `apps/web/src/features/analytics/components/export-button.tsx` | `ExportButton` with XLS primary + CSV fallback, min 40 lines | VERIFIED | 36 lines; imports `exportToXls` from `../lib/xls-export`; disabled when `data.length === 0`; backward-compat note present |
| `apps/web/src/features/analytics/pages/analytics-page.tsx` | Full assembly with `LifetimeKpiCards` | VERIFIED | 228 lines; imports and renders all Phase 13 components; correct top-to-bottom layout order: LifetimeKpiCards → Controls+ExportButton → KpiCards → MetricsChart → CreativePieChart+PlatformChart → HourlyChart → MetricsTable |
| `apps/web/src/features/analytics/components/metrics-chart.tsx` | `MetricsChart` updated with `ChartDownloadButton` | VERIFIED | 153 lines; `ChartDownloadButton` in `CardHeader` (line 89); `localRef` fallback when `chartRef` prop is undefined (line 59–60); `resolvedRef` pattern throughout |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `analytics-api.ts` | Supabase `fetch_hourly_metrics` RPC | `supabase.rpc('fetch_hourly_metrics', ...)` | WIRED | Line 106 of `analytics-api.ts` |
| `analytics-api.ts` | Supabase `fetch_device_breakdown` RPC | `supabase.rpc('fetch_device_breakdown', ...)` | WIRED | Line 142 of `analytics-api.ts` |
| `use-analytics.ts` | `analytics-api.ts` | `fetchHourlyMetrics`, `fetchLifetimeMetrics`, `fetchDeviceBreakdown` imports | WIRED | Lines 9–11 of `use-analytics.ts`; all three used in hook bodies |
| `creative-pie-chart.tsx` | `analytics-types.ts` | `CreativePieSlice` type import | WIRED | Line 11 of `creative-pie-chart.tsx`; note: `aggregateByCreative` is called in `analytics-page.tsx` (line 79) rather than inside the chart component — this is an intentional design choice (component receives pre-aggregated `CreativePieSlice[]` as props); the chain works end-to-end |
| `export-button.tsx` | `xls-export.ts` | `exportToXls` import | WIRED | Line 3 of `export-button.tsx`; called on button click at line 23 |
| `analytics-page.tsx` | `use-analytics.ts` | `useLifetimeMetrics`, `useHourlyMetrics`, `useDeviceBreakdown` | WIRED | Lines 14–16 (import); lines 47–52 (called with correct args) |
| `analytics-page.tsx` | New chart components | `LifetimeKpiCards`, `HourlyChart`, `CreativePieChart`, `PlatformChart`, `ChartDownloadButton` | WIRED | Lines 24–28 (imports); all rendered in JSX with correct props and refs |
| `metrics-chart.tsx` | `chart-download-button.tsx` | `ChartDownloadButton` import | WIRED | Line 14 (import); line 89 (rendered in `CardHeader`) |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| ANLYT-08 | 13-01, 13-02, 13-03 | User can see hourly breakdown chart for any selected date | SATISFIED | `fetch_hourly_metrics` RPC (zero-fill via `generate_series`), `fetchHourlyMetrics` API, `useHourlyMetrics` hook, `HourlyChart` component, wired in `analytics-page.tsx` |
| ANLYT-09 | 13-02, 13-03 | User can see lifetime totals (all-time) as separate section | SATISFIED | `fetchLifetimeMetrics` API, `useLifetimeMetrics` hook, `LifetimeKpiCards` component rendered above date-range controls in `analytics-page.tsx` |
| ANLYT-10 | 13-02, 13-03 | User can see creative share pie/donut chart | SATISFIED | `aggregateByCreative` utility (top-8 + Other), `CreativePieSlice` type, `CreativePieChart` component, `creativePieData` computed in `analytics-page.tsx` |
| ANLYT-11 | 13-01, 13-02, 13-03 | User can see platform breakdown chart (conditional on device_type data) | SATISFIED | `fetch_device_breakdown` RPC (scoped to `impression_served`), `fetchDeviceBreakdown` API, `useDeviceBreakdown` hook, `PlatformChart` component with proper empty state |
| ANLYT-12 | 13-02, 13-03 | User can download any individual chart as PNG | SATISFIED | `ChartDownloadButton` with `recharts-to-png` and white background fix; mounted on `MetricsChart`, `CreativePieChart`, `PlatformChart`, `HourlyChart` |
| ANLYT-13 | 13-01, 13-03 | User can download full analytics report as XLS with row-limit guard and CSV fallback | SATISFIED | SheetJS 0.20.3 installed (CDN tarball), `exportToXls` with `XLSX_ROW_LIMIT = 1_000_000`, `ExportButton` replaces `CsvExportButton` on analytics page |

All 6 requirements mapped to Phase 13 are satisfied by code evidence.

---

## Anti-Patterns Found

No blocking or warning anti-patterns found.

Scan results across all 13 Phase 13 files:
- No `TODO`, `FIXME`, `PLACEHOLDER`, or `coming soon` comments
- No `return null`, `return {}`, `return []` stubs
- No console.log-only implementations
- `CsvExportButton` preserved for backward compat (as documented) — not a gap

---

## Human Verification Required

Phase 13 involves chart rendering, file downloads, and a runtime database dependency (device_type data availability). All automated structural checks pass. The following require a human to confirm:

### 1. Hourly Chart Rendering

**Test:** Start dev server (`pnpm --filter web dev`). Navigate to Analytics page. Locate the "Hourly Breakdown" section at the bottom. Select today's date in the date input.
**Expected:** A 24-bar BarChart renders; X-axis shows labels '12am', '1am', ...'12pm', '1pm' (every 3rd hour due to `interval=2`); bars show impressions (primary color) and clicks (chart-2 color); if no events exist for today, shows "No data available for the selected date."
**Why human:** Chart rendering and hour-label format correctness require visual inspection.

### 2. Lifetime Totals Above Date-Range Controls

**Test:** Navigate to Analytics page. Observe the top of the page before the date selector.
**Expected:** "Lifetime Totals" section with subtitle "All-time performance across all date ranges" appears as the first content section; three KPI cards (Impressions, Clicks, CTR) below it; date-range KPI cards appear separately further down the page.
**Why human:** Section ordering and visual separation requires human inspection; data values reflect live Supabase query results.

### 3. PNG Download with White Background

**Test:** On the Analytics page, click the "PNG" button in the Performance Over Time chart header.
**Expected:** A file named `performance-chart.png` downloads. Open it — it should have a white background, not a black background.
**Why human:** The `backgroundColor: '#ffffff'` option in recharts-to-png is passed at runtime to html2canvas; static analysis cannot confirm the output image background color.

### 4. XLS Export File Quality

**Test:** With some data in the selected date range, click "Export XLS" button.
**Expected:** A file named `analytics-{preset}-{date}.xlsx` downloads (not .csv). Open in Excel or Google Sheets — should contain a single sheet named "Daily Metrics" with columns: Date, Creative, Campaign, Impressions, Viewable Impressions, Clicks, CTR (%), Engagements, Video Plays, Video Completes, Total Dwell Time (ms).
**Why human:** File format correctness and sheet structure require opening the generated file.

### 5. Platform Breakdown Chart Data Availability

**Test:** Observe the Platform Breakdown chart on the Analytics page.
**Expected:** Either horizontal bars for Desktop/Mobile/Tablet/Unknown device types (if `device_type` is populated in `ad_events.extra_data`), or the empty state message "No device data available for the selected period." Capitalized labels (e.g., 'Desktop' not 'desktop').
**Why human:** Whether `device_type` is being populated by the track-event Edge Function depends on actual production traffic and Phase 08 integration state — cannot be verified statically.

---

## Gaps Summary

No gaps found. All five success criteria are satisfied by code evidence. All 14 required artifacts exist and are substantive. All 8 key links are wired. All 6 requirements (ANLYT-08 through ANLYT-13) are satisfied.

The phase goal is structurally complete. Five human verification items remain to confirm runtime behavior (chart rendering, download file quality, visual layout, device data state).

**Note on Plan 02 key link deviation:** The plan specified `creative-pie-chart.tsx -> analytics-types.ts via aggregateByCreative import`. The actual implementation has `creative-pie-chart.tsx` receive pre-aggregated `CreativePieSlice[]` as props, with `aggregateByCreative` called in `analytics-page.tsx`. This is a better architectural choice (component is decoupled from aggregation logic) and does not represent a gap — the function is exported from `analytics-types.ts` and consumed by the analytics page, which feeds the result directly into the chart.

---

_Verified: 2026-02-25T10:40:00Z_
_Verifier: Claude (gsd-verifier)_
