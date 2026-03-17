# Phase 13: Analytics Enhancements - Research

**Researched:** 2026-02-25
**Domain:** Analytics dashboard enhancements — hourly breakdown, lifetime totals, pie/donut charts, platform breakdown, chart-to-PNG download, XLS export
**Confidence:** HIGH

## Summary

Phase 13 extends the analytics dashboard built in Phase 10. The existing foundation is solid: `daily_metrics` table holds pre-aggregated data, `rollup_today_metrics()` RPC exists, Recharts 3.7.0 is installed, and the analytics page at `apps/web/src/features/analytics/` already has filtering, KPI cards, and a time-series chart. Phase 12 added per-campaign analytics reusing these same components.

The five new capabilities each have a distinct technical approach. Hourly breakdown (ANLYT-08) CANNOT use `daily_metrics` because that table aggregates to day granularity — it requires a new Supabase RPC function that queries `ad_events` directly and groups by `EXTRACT(HOUR FROM event_timestamp)` for a single selected date. Lifetime totals (ANLYT-09) are computed client-side by fetching `daily_metrics` with no date filter (just `advertiser_id`). Creative pie chart (ANLYT-10) and platform breakdown (ANLYT-11) are new Recharts chart components using `PieChart`/`BarChart` with data derived from existing `daily_metrics` queries and a new device-breakdown RPC respectively. Chart PNG export (ANLYT-12) uses the `recharts-to-png` library (v3.0.1, which explicitly supports Recharts 3.x). XLS export (ANLYT-13) uses SheetJS 0.20.3 from the official CDN tarball — the npm registry version is stale at 0.18.5.

A critical discovery: `device_type` IS already stored in `ad_events.extra_data` as a top-level key. The `track-event` Edge Function calls `normalizeDevice(userAgent)` and spreads the result (`device_type`, `os`, `browser`) into `extra_data` on every event. ANLYT-11 is therefore unconditionally feasible for all events tracked since Phase 8. A new Supabase RPC is needed to GROUP BY `extra_data->>'device_type'` from `ad_events` for a given advertiser and date range, since `daily_metrics` does not store device breakdown.

**Primary recommendation:** Add one new Supabase RPC for hourly breakdown and one for platform/device breakdown. Install `recharts-to-png@^3` and SheetJS 0.20.3 (CDN tarball). All new chart components use Recharts PieChart and BarChart — already installed. Lifetime totals is purely client-side with no new infrastructure.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ANLYT-08 | User can see an hourly breakdown chart for any selected date | Requires new `fetch_hourly_metrics(p_advertiser_id, p_date)` RPC that queries `ad_events` directly with `EXTRACT(HOUR FROM event_timestamp)`. Cannot use `daily_metrics` (day granularity only). Returns 24 rows (hours 0-23), zero-filled. BarChart with hour on X-axis. |
| ANLYT-09 | User can see lifetime totals (all-time impressions, clicks, CTR) as separate section | Query `daily_metrics` with only `advertiser_id` filter (no date bounds). Sum client-side using existing `aggregateSummary()`. Display as KPI cards above the date-range section. |
| ANLYT-10 | User can see pie/donut chart showing each creative's share of total impressions | Use existing `daily_metrics` data already fetched for the selected date range. Group by `creative_id` client-side, compute each creative's share. Recharts `PieChart` + `Pie` with `innerRadius` for donut effect. `Cell` component for per-slice colors. |
| ANLYT-11 | User can see platform breakdown chart (Desktop/Mobile/Tablet) | `device_type` IS in `ad_events.extra_data` — confirmed in `track-event` Edge Function. Requires new `fetch_device_breakdown(p_advertiser_id, p_start_date, p_end_date)` RPC querying `ad_events`. Returns counts by device_type. Recharts BarChart or PieChart. |
| ANLYT-12 | User can download any individual chart as a PNG image | Use `recharts-to-png@3.0.1` library. Wrap chart components with `useGenerateImage` hook. On button click, call the returned promise to get a data URL, create anchor element and trigger download. Compatible with Recharts 3.x. |
| ANLYT-13 | User can download full analytics report as XLS (with row-limit guard and CSV fallback) | Install SheetJS 0.20.3 from CDN tarball. Use `XLSX.utils.json_to_sheet()` + `XLSX.utils.book_new()` + `XLSX.writeFile()`. Guard: if row count > 1,000,000, fall back to existing CSV export. Replace `CsvExportButton` with multi-format `ExportButton`. |
</phase_requirements>

## Standard Stack

### Core (Already in project — no new installs)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.7.0 | PieChart, BarChart for new chart types | Already installed; PieChart/BarChart are part of the core library |
| @tanstack/react-query | ^5 | Data fetching hooks for new RPC endpoints | Already used for all analytics hooks |
| @supabase/supabase-js | ^2 | `supabase.rpc()` calls for new DB functions | Already used; pattern established |
| shadcn/ui components | - | Card, Button, Skeleton, Select, Popover | Already installed |
| lucide-react | ^0.575.0 | Download, BarChart2, PieChart icons | Already installed |

### New Dependencies
| Library | Version | Purpose | Why This One |
|---------|---------|---------|--------------|
| recharts-to-png | ^3.0.1 | Chart element to PNG download | Wraps html2canvas; v3.0.1 explicitly supports Recharts 3.x (peer dep `recharts: ^3.0.0`); `useGenerateImage` hook works on any HTML div |
| xlsx (SheetJS) | 0.20.3 (CDN tarball) | XLS workbook generation and download | Only maintained version (npm registry is stale at 0.18.5); `json_to_sheet` + `writeFile` covers the exact use case |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| recharts-to-png | html2canvas directly | recharts-to-png wraps html2canvas with a React hook API; using html2canvas directly requires manual ref management and canvas cleanup — more code for same result |
| recharts-to-png | dom-to-image | Less maintained; fewer installs; similar capability — recharts-to-png is purpose-built for this use case |
| recharts-to-png | SVG serialization + canvas | Works for SVG-only charts; fails for mixed SVG+HTML tooltips; brittle across browsers |
| SheetJS CDN tarball | exceljs | exceljs is 3x larger bundle; SheetJS CDN tarball is the maintainer-recommended path for bundlers |
| SheetJS CDN tarball | csv-only fallback | XLS is an explicit requirement (ANLYT-13); CSV is the fallback for large datasets, not the primary output |

**Installation:**
```bash
# In apps/web:
pnpm add recharts-to-png
pnpm add https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
```

## Architecture Patterns

### Recommended Project Structure
```
apps/web/src/features/analytics/
  api/
    analytics-api.ts           # EXISTING: add fetchLifetimeMetrics(), fetchHourlyMetrics(), fetchDeviceBreakdown()
  hooks/
    use-analytics.ts           # EXISTING: add useLifetimeMetrics(), useHourlyMetrics(), useDeviceBreakdown()
  components/
    hourly-chart.tsx           # NEW: BarChart with 24-hour X-axis
    creative-pie-chart.tsx     # NEW: PieChart/donut showing creative share
    platform-chart.tsx         # NEW: BarChart/PieChart for device type breakdown
    lifetime-kpi-cards.tsx     # NEW: KPI cards showing all-time totals (above date-range section)
    chart-download-button.tsx  # NEW: Wraps useGenerateImage to download chart as PNG
    export-button.tsx          # NEW: Replaces csv-export-button; supports XLS + CSV fallback
  lib/
    analytics-types.ts         # EXISTING: add HourlyDataPoint, CreativePieSlice, DeviceBreakdownPoint
    csv-export.ts              # EXISTING: unchanged (used as CSV fallback in export-button)
    xls-export.ts              # NEW: SheetJS workbook generation utility
  pages/
    analytics-page.tsx         # EXISTING: add new sections, wire new hooks

supabase/migrations/
  YYYYMMDD_hourly_device_analytics.sql   # NEW: fetch_hourly_metrics() + fetch_device_breakdown() functions
```

### Pattern 1: Hourly Breakdown via Supabase RPC
**What:** A PL/pgSQL function that queries `ad_events` for a single calendar date, groups by `EXTRACT(HOUR FROM event_timestamp)`, and returns 24 rows (zero-filled for hours with no events).
**When to use:** ANLYT-08 — when user selects a single date for hourly drill-down.
**Why RPC and not direct table query:** `daily_metrics` is day-granular only. The `ad_events` table requires GROUP BY, which PostgREST cannot do without explicit aggregate enablement. RPC is the established pattern in this codebase.
**Example:**
```sql
-- Migration: fetch_hourly_metrics()
CREATE OR REPLACE FUNCTION public.fetch_hourly_metrics(
  p_advertiser_id UUID,
  p_date DATE
)
RETURNS TABLE (
  hour_of_day INTEGER,
  impressions BIGINT,
  clicks BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH hours AS (
    SELECT generate_series(0, 23) AS hour_of_day
  ),
  event_counts AS (
    SELECT
      EXTRACT(HOUR FROM ae.event_timestamp)::INTEGER AS hour_of_day,
      COUNT(*) FILTER (WHERE ae.event_type = 'impression_served') AS impressions,
      COUNT(*) FILTER (WHERE ae.event_type = 'click') AS clicks
    FROM public.ad_events ae
    WHERE ae.advertiser_id = p_advertiser_id
      AND ae.event_timestamp >= p_date::TIMESTAMPTZ
      AND ae.event_timestamp < (p_date + INTERVAL '1 day')::TIMESTAMPTZ
    GROUP BY EXTRACT(HOUR FROM ae.event_timestamp)::INTEGER
  )
  SELECT
    h.hour_of_day,
    COALESCE(ec.impressions, 0) AS impressions,
    COALESCE(ec.clicks, 0) AS clicks
  FROM hours h
  LEFT JOIN event_counts ec ON ec.hour_of_day = h.hour_of_day
  ORDER BY h.hour_of_day;
END;
$$;
```

### Pattern 2: Device Breakdown via Supabase RPC
**What:** A PL/pgSQL function that queries `ad_events.extra_data->>'device_type'` for a date range and groups by device type to produce Desktop/Mobile/Tablet counts.
**When to use:** ANLYT-11 — platform breakdown chart.
**Why confirmed feasible:** `track-event` Edge Function calls `normalizeDevice(userAgent)` and spreads `{device_type, os, browser}` into `extra_data` for every event. Values are `'desktop'`, `'mobile'`, `'tablet'`, or `'unknown'`.
**Example:**
```sql
-- Migration: fetch_device_breakdown()
CREATE OR REPLACE FUNCTION public.fetch_device_breakdown(
  p_advertiser_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  device_type TEXT,
  impressions BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(ae.extra_data->>'device_type', 'unknown') AS device_type,
    COUNT(*) AS impressions
  FROM public.ad_events ae
  WHERE ae.advertiser_id = p_advertiser_id
    AND ae.event_type = 'impression_served'
    AND ae.event_timestamp >= p_start_date::TIMESTAMPTZ
    AND ae.event_timestamp < (p_end_date + INTERVAL '1 day')::TIMESTAMPTZ
  GROUP BY ae.extra_data->>'device_type'
  ORDER BY impressions DESC;
END;
$$;
```

### Pattern 3: Lifetime Totals (Client-Side, No New Migration)
**What:** Fetch `daily_metrics` with only `advertiser_id` filter (no date bounds). Aggregate using the existing `aggregateSummary()` function. Display as a separate KPI card section above the date-range section.
**When to use:** ANLYT-09.
**Key consideration:** This query may return many rows for long-running advertisers. Add a reasonable maximum: either accept performance at this volume (daily rollup rows are small per row) or add `created_at` index guard. For v1, unbounded is fine — an advertiser with 3 years of daily data × 100 creatives = ~110,000 rows max.
**Example:**
```typescript
// api/analytics-api.ts — add:
export async function fetchLifetimeMetrics(
  advertiserId: string
): Promise<DailyMetricRow[]> {
  const { data, error } = await supabase
    .from('daily_metrics')
    .select(
      'metric_date, creative_id, campaign_id, impressions_served, impressions_viewable, clicks, engagements, video_plays, video_completes, total_dwell_time_ms'
    )
    .eq('advertiser_id', advertiserId)

  if (error) throw new Error(error.message)
  return data as DailyMetricRow[]
}
```

### Pattern 4: Creative Pie/Donut Chart (Client-Side Aggregation)
**What:** Use existing `daily_metrics` data already fetched for the current date range. Group by `creative_id` client-side, compute each creative's share of total impressions. Use Recharts `PieChart` + `Pie` with `innerRadius` set to create the donut effect. `Cell` component assigns per-slice fill colors from a fixed palette.
**When to use:** ANLYT-10.
**Example:**
```typescript
// Source: Recharts 3.x PieChart API (recharts.github.io)
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))']

interface CreativePieSlice {
  name: string   // creative name or ID
  value: number  // impressions_served
}

export function CreativePieChart({ data }: { data: CreativePieSlice[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius="55%"
          outerRadius="80%"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => new Intl.NumberFormat('en-US').format(value)} />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

### Pattern 5: Chart PNG Download with recharts-to-png
**What:** `useGenerateImage` hook from `recharts-to-png` attaches a `ref` to any HTML element (the chart wrapper div). On button click, call the returned async function to get a data URL string, then trigger a download via a temporary anchor element.
**When to use:** ANLYT-12 — download button on each chart card.
**Note:** The hook wraps html2canvas, which renders the DOM element to a canvas. This works for Recharts SVG charts but requires the element to be visible/rendered (not display:none) at capture time.
**Example:**
```typescript
// Source: recharts-to-png v3.0.1 (github.com/brammitch/recharts-to-png)
import { useGenerateImage } from 'recharts-to-png'
import FileSaver from 'file-saver'

// OR without file-saver:
function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}

export function ChartDownloadButton({ chartRef, filename }: {
  chartRef: React.RefObject<HTMLDivElement>
  filename: string
}) {
  const [getImage, { isLoading }] = useGenerateImage<HTMLDivElement>({
    quality: 0.92,
    type: 'image/png',
  })

  const handleDownload = async () => {
    const png = await getImage(chartRef)
    if (png) downloadDataUrl(png, filename)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={isLoading}>
      <Download className="mr-2 size-4" />
      {isLoading ? 'Generating...' : 'Download PNG'}
    </Button>
  )
}

// Usage — wrap chart in a div with forwardRef or local ref:
// <div ref={chartRef}><MetricsChart ... /></div>
// <ChartDownloadButton chartRef={chartRef} filename="impressions-chart.png" />
```

### Pattern 6: XLS Export with SheetJS 0.20.3
**What:** Transform analytics data into a multi-sheet Excel workbook. Sheet 1 contains daily metrics (date, creative, campaign, impressions, clicks, CTR). Sheet 2 (optional) contains hourly data if available. Guard against Excel's 1,048,576 row limit — fall back to CSV if exceeded.
**When to use:** ANLYT-13 — export button producing .xlsx file.
**Example:**
```typescript
// Source: docs.sheetjs.com/docs/getting-started/installation/frameworks
import { utils, writeFile } from 'xlsx'
import type { DailyMetricRow } from './analytics-types'
import { exportToCsv } from './csv-export'  // existing fallback

const XLSX_ROW_LIMIT = 1_000_000  // leave headroom below 1,048,576

export function exportToXls(
  rows: DailyMetricRow[],
  creativeNames: Record<string, string>,
  campaignNames: Record<string, string>,
  dateRange: string
): void {
  if (rows.length > XLSX_ROW_LIMIT) {
    // CSV fallback for huge datasets
    const csvHeaders = ['Date', 'Creative', 'Campaign', 'Impressions', 'Clicks', 'CTR (%)']
    const csvRows = rows.map(r => [
      r.metric_date,
      creativeNames[r.creative_id ?? ''] ?? r.creative_id ?? '',
      campaignNames[r.campaign_id ?? ''] ?? r.campaign_id ?? '',
      r.impressions_served,
      r.clicks,
      r.impressions_served > 0 ? ((r.clicks / r.impressions_served) * 100).toFixed(2) : '0',
    ])
    exportToCsv(`analytics-${dateRange}.csv`, csvHeaders, csvRows as (string | number)[][])
    return
  }

  const sheetData = rows.map(r => ({
    Date: r.metric_date,
    Creative: creativeNames[r.creative_id ?? ''] ?? r.creative_id ?? '',
    Campaign: campaignNames[r.campaign_id ?? ''] ?? r.campaign_id ?? '',
    Impressions: r.impressions_served,
    'Viewable Impressions': r.impressions_viewable,
    Clicks: r.clicks,
    'CTR (%)': r.impressions_served > 0
      ? Number(((r.clicks / r.impressions_served) * 100).toFixed(2))
      : 0,
    Engagements: r.engagements,
    'Video Plays': r.video_plays,
    'Video Completes': r.video_completes,
  }))

  const ws = utils.json_to_sheet(sheetData)
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Daily Metrics')

  const today = new Date().toISOString().split('T')[0]
  writeFile(wb, `analytics-${dateRange}-${today}.xlsx`)
}
```

### Pattern 7: Hourly BarChart with 24-Hour X-Axis
**What:** BarChart with `dataKey="hour_of_day"` on X-axis, ticks 0-23, `tickFormatter` to format as `"12am"` / `"1pm"` etc.
**When to use:** ANLYT-08 hourly breakdown chart.
**Example:**
```typescript
// Source: Recharts 3.x BarChart API
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function formatHour(hour: number): string {
  if (hour === 0) return '12am'
  if (hour < 12) return `${hour}am`
  if (hour === 12) return '12pm'
  return `${hour - 12}pm`
}

export function HourlyChart({ data }: { data: { hour_of_day: number; impressions: number; clicks: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="hour_of_day"
          tickFormatter={formatHour}
          interval={2}
          className="text-xs"
        />
        <YAxis className="text-xs" />
        <Tooltip
          labelFormatter={(hour) => formatHour(Number(hour))}
        />
        <Bar dataKey="impressions" fill="hsl(var(--primary))" fillOpacity={0.8} name="Impressions" />
        <Bar dataKey="clicks" fill="hsl(var(--chart-2))" fillOpacity={0.8} name="Clicks" />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

### Anti-Patterns to Avoid
- **Do NOT use `daily_metrics` for hourly breakdown:** It aggregates to day granularity. You must query `ad_events` via RPC for hourly data.
- **Do NOT query `ad_events` from the frontend directly:** Use the Supabase RPC pattern. PostgREST cannot GROUP BY without aggregate enablement. RPC is the established pattern.
- **Do NOT install xlsx from the npm registry:** The npm registry version is 0.18.5 (stale, unmaintained). Use the CDN tarball: `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`.
- **Do NOT use recharts-to-png v2:** It does not support Recharts 3.x. Use v3.0.1 which has `recharts: ^3.0.0` as a peer dep.
- **Do NOT capture hidden chart elements:** html2canvas requires the element to be rendered and visible. Do not try to capture charts in hidden tabs or `display:none` containers.
- **Do NOT skip zero-filling for hourly data:** If no events occur for an hour, the RPC's `generate_series(0, 23)` LEFT JOIN ensures the chart always shows all 24 hours (flat bars for empty hours, not gaps).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chart to PNG conversion | Custom SVG serialization + canvas drawImage | recharts-to-png v3.0.1 | SVG serialization is brittle (fonts, foreignObject, cross-origin images all break); html2canvas handles these edge cases |
| XLS file generation | Custom binary Excel format builder | SheetJS xlsx 0.20.3 | Excel XLSX format is a ZIP of XML files — not hand-rollable; SheetJS handles the full spec including number formatting, multiple sheets, and correct MIME types |
| 24-hour zero-filled series | Frontend gap detection and zero insertion | PostgreSQL `generate_series(0,23)` LEFT JOIN | Server-side zero-filling is simpler, faster, and returns a complete dataset without client-side post-processing |
| Device type parsing | User-agent sniffing in the frontend | Read from `ad_events.extra_data->>'device_type'` | Already normalized server-side by `normalizeDevice()` in `tracking-utils.ts`; don't re-parse on the frontend |
| Color palette for pie slices | Custom HSL color generation | Fixed palette using shadcn/ui CSS variables (`--chart-1` through `--chart-5`) | Design system consistency, automatic dark mode support |

**Key insight:** Phase 13 is primarily a frontend composition problem. The backend work is minimal — two new RPC functions. The heavy lift is wiring data flows and installing two libraries. Do not build chart-to-image conversion or spreadsheet generation from scratch.

## Common Pitfalls

### Pitfall 1: Hourly Data Is Empty or Sparse
**What goes wrong:** The hourly chart shows data for only a few hours, with visible gaps instead of zero bars.
**Why it happens:** The GROUP BY query returns only hours where events occurred. An hour with zero events is absent from the result.
**How to avoid:** Use `generate_series(0, 23)` in the RPC with a LEFT JOIN. Every hour must have a row, even with `impressions = 0` and `clicks = 0`. See Pattern 1 SQL above.
**Warning signs:** Chart skips from hour 9 to hour 14; bars are missing for overnight hours.

### Pitfall 2: Lifetime Totals Query Is Slow for Mature Advertisers
**What goes wrong:** `fetchLifetimeMetrics()` returns 100,000+ rows and takes 3+ seconds.
**Why it happens:** `daily_metrics` is queried without a date bound. Advertisers with many creatives over a long period accumulate many rows.
**How to avoid:** For Phase 13, lifetime totals are expected to be fast (product is new). Add a warning in code comments to revisit if needed. Mitigation: add `LIMIT 100000` as a safety cap, or switch to a server-side SUM via a new RPC function if performance becomes an issue post-launch.
**Warning signs:** Analytics page takes > 2 seconds to load; browser memory usage spikes.

### Pitfall 3: Chart PNG Captures Background as Black
**What goes wrong:** Downloaded PNG has a black background instead of the page's white/light background.
**Why it happens:** html2canvas does not inherit CSS custom properties by default when the element is in a transparent container. The canvas background defaults to transparent, which renders as black.
**How to avoid:** Pass `backgroundColor: '#ffffff'` (or the current theme's background color) in the html2canvas options: `useGenerateImage({ quality: 0.92, type: 'image/png', backgroundColor: '#fff' })`. Alternatively, set an explicit background color on the chart wrapper div.
**Warning signs:** PNG file shows chart content but with black background; obvious in dark mode.

### Pitfall 4: SheetJS npm Install Pulls Stale Version
**What goes wrong:** `pnpm add xlsx` installs 0.18.5 from npm — stale, has known security issues, missing features.
**Why it happens:** SheetJS stopped publishing to npm. The npm registry version is 0.18.5, not 0.20.3.
**How to avoid:** Always install from the CDN tarball: `pnpm add https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`. The `package.json` dependency will show the tarball URL, not a semver range.
**Warning signs:** `npm show xlsx version` returns `0.18.5`; import auto-complete shows old API.

### Pitfall 5: Device Breakdown Counts Only impression_served Events
**What goes wrong:** Platform chart shows a number that doesn't match the impression count in KPI cards.
**Why it happens:** The `fetch_device_breakdown()` RPC filters on `event_type = 'impression_served'`. Other event types (clicks, viewable impressions) also carry `device_type` in `extra_data`. If the RPC is incorrectly written to count all event types, the device count will be inflated.
**How to avoid:** Scope the RPC to only count `impression_served` events. This matches the KPI card's impressions metric. Document this in the function comment.
**Warning signs:** Desktop + Mobile + Tablet total is 3-5x the impressions count in KPI cards.

### Pitfall 6: recharts-to-png useGenerateImage Hook Ref Mismatch
**What goes wrong:** `getImage(ref)` returns `undefined` or throws; PNG download does nothing.
**Why it happens:** The ref must be attached to the outermost div wrapping the chart — not to the Recharts component itself. If the ref is attached to `<AreaChart>` or `<ResponsiveContainer>` directly (which render SVG, not div), the hook cannot find the element correctly.
**How to avoid:** Always wrap the Recharts component in a `<div ref={chartRef}>` and pass `chartRef` to `useGenerateImage`. Keep the wrapper div visible (not `display:none`) when capturing.
**Warning signs:** Console log of `ref.current` is null; PNG is blank white.

### Pitfall 7: Pie Chart Label Overlap with Many Creatives
**What goes wrong:** If an advertiser has 15+ creatives, the pie chart labels overlap and become unreadable.
**Why it happens:** Recharts places labels radially around the pie. With many thin slices, labels collide.
**How to avoid:** Limit the creative pie to the top-N creatives by impressions (e.g., top 8), grouping the rest as "Other." Show a legend below the chart instead of labels directly on slices when count > 5. Use `label={false}` and rely on Tooltip for detail.
**Warning signs:** Labels render on top of each other; pie slices are too thin to read.

## Code Examples

Verified patterns from official sources and codebase analysis:

### Supabase RPC Call for Hourly Metrics
```typescript
// Source: existing supabase.rpc() pattern from analytics-api.ts
export async function fetchHourlyMetrics(
  advertiserId: string,
  date: string  // 'YYYY-MM-DD'
): Promise<{ hour_of_day: number; impressions: number; clicks: number }[]> {
  const { data, error } = await supabase.rpc('fetch_hourly_metrics', {
    p_advertiser_id: advertiserId,
    p_date: date,
  })
  if (error) throw new Error(error.message)
  return data
}
```

### TanStack Query Hook for Hourly Data
```typescript
// Source: existing use-analytics.ts hook pattern
export function useHourlyMetrics(date: string | null) {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['analytics-hourly', profile?.advertiser_id, date],
    queryFn: () => fetchHourlyMetrics(profile!.advertiser_id!, date!),
    enabled: !!profile?.advertiser_id && !!date,
    staleTime: 5 * 60 * 1000,  // 5 min; hourly data changes slowly once a day is selected
  })
}
```

### TanStack Query Hook for Lifetime Totals
```typescript
export function useLifetimeMetrics() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['analytics-lifetime', profile?.advertiser_id],
    queryFn: () => fetchLifetimeMetrics(profile!.advertiser_id!),
    enabled: !!profile?.advertiser_id,
    staleTime: 10 * 60 * 1000,  // 10 min; lifetime totals change slowly
  })
}
```

### Creative Share Computation (Client-Side)
```typescript
// Source: existing aggregateByDate() pattern in analytics-types.ts
interface CreativePieSlice {
  name: string
  creativeId: string
  value: number  // impressions
  share: number  // 0-100
}

export function aggregateByCreative(
  rows: DailyMetricRow[],
  creativeNames: Record<string, string>
): CreativePieSlice[] {
  const byCreative = new Map<string, number>()

  for (const row of rows) {
    const id = row.creative_id ?? 'unknown'
    byCreative.set(id, (byCreative.get(id) ?? 0) + row.impressions_served)
  }

  const total = Array.from(byCreative.values()).reduce((a, b) => a + b, 0)

  return Array.from(byCreative.entries())
    .map(([creativeId, value]) => ({
      name: creativeNames[creativeId] ?? creativeId.slice(0, 8),
      creativeId,
      value,
      share: total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.value - a.value)
}
```

### SheetJS Multi-Sheet Workbook
```typescript
// Source: docs.sheetjs.com/docs/getting-started/installation/frameworks
import { utils, writeFile } from 'xlsx'

// Sheet 1: Daily metrics
const dailyWs = utils.json_to_sheet(dailyRows)
// Sheet 2: Hourly breakdown (if available)
const hourlyWs = utils.json_to_sheet(hourlyRows)

const wb = utils.book_new()
utils.book_append_sheet(wb, dailyWs, 'Daily Metrics')
utils.book_append_sheet(wb, hourlyWs, 'Hourly Breakdown')

writeFile(wb, `analytics-report-${today}.xlsx`)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSV-only export | XLS workbook via SheetJS 0.20.3 | Phase 13 | Multi-sheet reports; formatted columns; Excel-native file format |
| Manual SVG-to-canvas conversion | recharts-to-png v3 `useGenerateImage` hook | Phase 13 | One-line chart capture; handles cross-browser SVG rendering quirks |
| xlsx npm registry (0.18.5) | SheetJS CDN tarball (0.20.3) | 2022 (maintainers moved off npm) | Security patches; current API; maintained codebase |
| recharts-to-png v2 | recharts-to-png v3 | 2024 | Recharts 3.x compatibility; `useGenerateImage` replaces `useCurrentPng` |

**Deprecated/outdated:**
- `recharts-to-png` v2 `useCurrentPng` hook — replaced by `useGenerateImage` in v3
- `xlsx` from npm registry (0.18.5) — superseded by CDN tarball 0.20.3; do not use `npm install xlsx` (no version specifier)

## Open Questions

1. **Does `fetch_device_breakdown()` need to scope to impression_served only or all event types?**
   - What we know: `device_type` is present on every event in `extra_data`. The ANLYT-11 requirement says "platform breakdown chart (Desktop / Mobile / Tablet) if device data is available in tracking pipeline."
   - What's unclear: Whether "platform breakdown" should show impression counts (what the KPI cards show) or a general event count.
   - Recommendation: Scope to `impression_served` events for consistency with the KPI impressions metric. Document this decision in the RPC function comment.

2. **Does hourly breakdown need a date picker (single date), or should it reuse the existing date range controls?**
   - What we know: ANLYT-08 says "user can select any single date." The existing `DateRangeSelect` component only offers presets (7d, 30d, etc.), not single-date selection.
   - What's unclear: How the date selection UI should work for hourly drill-down (click on a chart point? separate date input?).
   - Recommendation: Add a simple date picker input (`<input type="date">` styled via shadcn/ui or the existing `react-day-picker` already in the project) beside the hourly chart section. `react-day-picker@^9` is already installed in the project (`package.json` shows `"react-day-picker": "^9.13.2"`).

3. **ANLYT-12 scope: is PNG download on the existing metrics chart too, or only new charts?**
   - What we know: ANLYT-12 says "any individual chart." The existing `MetricsChart` is also a chart.
   - What's unclear: Whether "download button on any chart" includes retroactively adding it to the existing time-series chart.
   - Recommendation: Add the download button to ALL charts (existing and new) — the `ChartDownloadButton` component is reusable with a ref. This satisfies the requirement's "any" wording without architectural changes.

4. **What is the expected XLS report structure for ANLYT-13?**
   - What we know: "Full analytics report as XLS workbook." Currently the CSV exports the raw `daily_metrics` rows.
   - What's unclear: Whether the XLS should be a single-sheet dump of daily metrics, or a structured report with multiple sheets (overview + daily + hourly).
   - Recommendation: Minimum viable: one sheet with daily metrics (same data as current CSV). Enhanced: add a summary sheet with lifetime totals, and an hourly sheet if hourly data was loaded. Both are supported by SheetJS `book_append_sheet()`.

## Sources

### Primary (HIGH confidence)
- Codebase: `supabase/functions/track-event/index.ts` — confirmed `device_type` stored in `extra_data`
- Codebase: `supabase/functions/_shared/tracking-utils.ts` — `normalizeDevice()` returns `{device_type, os, browser}` with values `'desktop'`, `'mobile'`, `'tablet'`, `'unknown'`
- Codebase: `supabase/migrations/20260219000000_initial_schema.sql` — `ad_events` schema, `extra_data JSONB DEFAULT '{}'`, confirmed `daily_metrics` is day-granular only
- Codebase: `apps/web/src/features/analytics/` — all existing analytics files; established patterns for API/hooks/components
- Codebase: `apps/web/package.json` — `recharts: "^3.7.0"` confirmed; `react-day-picker: "^9.13.2"` already installed
- npm: `recharts-to-png` v3.0.1 — peer deps `recharts: ^3.0.0`, `react: >=16.8.3`; dependency `html2canvas: ^1.2.0`
- SheetJS official docs (docs.sheetjs.com) — version 0.20.3, CDN tarball install, `json_to_sheet` + `writeFile` API
- PostgreSQL docs — `EXTRACT(HOUR FROM TIMESTAMPTZ)`, `generate_series()` for zero-filling

### Secondary (MEDIUM confidence)
- WebSearch: recharts-to-png README (github.com/brammitch/recharts-to-png) — `useGenerateImage` hook API, ref attachment pattern
- WebSearch: SheetJS xlsx row limit — confirmed XLSX max 1,048,576 rows; CSV has no row limit
- WebSearch: Recharts 3.x PieChart API (recharts.github.io) — `innerRadius`, `outerRadius`, `Cell` child component for per-slice colors

### Tertiary (LOW confidence)
- recharts-to-png `backgroundColor` html2canvas option — sourced from community examples, not official recharts-to-png docs; should be verified during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — recharts 3.7.0 already installed; recharts-to-png v3.0.1 peer deps confirmed; SheetJS 0.20.3 CDN tarball install documented by official SheetJS docs
- Architecture: HIGH — two new RPC functions, seven new frontend components; all follow established codebase patterns; device_type confirmed present in ad_events.extra_data from codebase inspection
- Pitfalls: HIGH — SheetJS npm/CDN issue confirmed; recharts-to-png v2/v3 break confirmed; zero-filling requirement identified from hourly aggregation fundamentals; pie label overlap is a known Recharts issue at scale
- ANLYT-11 feasibility: HIGH — directly confirmed by codebase inspection of track-event Edge Function; device_type, os, browser are spread into extra_data for every tracked event

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (stable patterns; SheetJS CDN tarball URL is version-pinned so no drift risk)
