# Phase 10: Analytics & Reporting - Research

**Researched:** 2026-02-24
**Domain:** Analytics dashboard with time-series charts, daily metrics rollup, and CSV export on a React + Supabase stack
**Confidence:** HIGH

## Summary

Phase 10 builds the analytics dashboard that displays impressions, clicks, CTR, dwell time, and engagement metrics per creative and per campaign. The foundation is already solid: the `daily_metrics` rollup table exists from Phase 1 (with its UNIQUE constraint fixed in Phase 9), the `rollup_daily_metrics()` PL/pgSQL function was created in Phase 9, and a pg_cron job runs it daily at 2 AM UTC. The `ad_events` partitioned table collects raw events from Phase 8's `track-event` Edge Function. RLS policies on both `daily_metrics` and `ad_events` are already in place, scoped by `advertiser_id`.

The primary work is threefold: (1) a "today rollup" mechanism so that the dashboard shows same-day data rather than only yesterday's numbers (the cron job runs at 2 AM and only covers the previous day), (2) the frontend analytics dashboard with charts (Recharts v3 via shadcn/ui chart component), date range selection, creative/campaign filtering, and summary KPI cards, and (3) CSV export functionality for any filtered view. No new Edge Functions are required -- the frontend queries `daily_metrics` directly via the Supabase client (RLS handles tenant isolation). For today's data, the simplest approach is an Edge Function or database function that can be called on page load to roll up the current day's events on demand.

**Primary recommendation:** Use Recharts v3 (3.7.0) with shadcn/ui chart component for visualization. Query `daily_metrics` table directly via supabase-js from the frontend (RLS already scoped by advertiser). Build a `rollup_today_metrics()` database function for intraday data freshness, triggered on dashboard page load. Use native browser APIs for CSV generation (no additional library needed for the data volumes involved).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ANLYT-01 | Impressions count per creative and campaign | `daily_metrics.impressions_served` and `daily_metrics.impressions_viewable` columns already exist. Query with `.select()` filtering by `creative_id` or `campaign_id`. Sum across date range on frontend or use PostgREST aggregate `.sum()`. |
| ANLYT-02 | Click count and CTR per creative and campaign | `daily_metrics.clicks` column exists. CTR = clicks / impressions_served, computed on frontend from the fetched rollup data. No server-side CTR column needed. |
| ANLYT-03 | Dwell time / engagement time per creative | `daily_metrics.total_dwell_time_ms` column exists but is currently populated as 0 by the rollup function. Requires enhancement to `rollup_daily_metrics()` to extract dwell time from `ad_events.extra_data` JSONB field, OR a separate engagement tracking mechanism. For v1, `daily_metrics.engagements` count is available; dwell time aggregation from JSONB needs a migration update. |
| ANLYT-04 | Analytics dashboard with charts and time-series data | Recharts v3.7.0 with shadcn/ui chart component provides LineChart, BarChart, AreaChart. Date-series data comes from `daily_metrics` rows ordered by `metric_date`. Summary KPI cards use shadcn/ui Card components (already in project). |
| ANLYT-05 | Analytics refresh on page reload (near-real-time) | Dashboard calls `rollup_today_metrics()` on mount to materialize current-day events into `daily_metrics`. Subsequent data comes from the pre-computed rollup table. TanStack Query with `staleTime: 0` ensures fresh data on every page load. |
| ANLYT-06 | CSV export of analytics data | Native browser `Blob` + `URL.createObjectURL()` + programmatic anchor click. No library needed for the data volumes (thousands of rows max). UTF-8 BOM prefix for Excel compatibility. |
| ANLYT-07 | Event-driven tracking with single ad_events table and request_id linking | Already complete from Phase 8. The `ad_events` table stores all event types with `request_id` linking. Phase 10 reads the pre-aggregated `daily_metrics` (never queries `ad_events` directly from the dashboard). |
</phase_requirements>

## Standard Stack

### Core (Already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2 | Query `daily_metrics` table, call RPC functions | Already used throughout; typed client with RLS enforcement |
| @tanstack/react-query | ^5 | Data fetching, caching, stale-while-revalidate | Already used for billing, creatives, campaigns hooks |
| React | ^19 | UI framework | Already in project |
| radix-ui | ^1.4.3 | Select, Tabs primitives for date range and view selection | Already in project, used by shadcn/ui components |
| lucide-react | ^0.575.0 | Icons (Download, Calendar, TrendingUp, BarChart3, etc.) | Already in project |
| shadcn/ui components | - | Card, Table, Select, Tabs, Skeleton, Badge | Already installed; chart component to be added |

### New Dependencies
| Library | Version | Purpose | Why This One |
|---------|---------|---------|--------------|
| recharts | ^3.7.0 | Time-series charts (Line, Area, Bar), responsive containers | React 19 compatible (peer dep: `^19.0.0`), SVG-based, JSX API, 9.5M weekly downloads. shadcn/ui chart component wraps it. |
| react-is | ^19.0.0 | Peer dependency of recharts | Required by recharts; must match React version |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts v3 | Chart.js + react-chartjs-2 | Canvas-based (harder to style with Tailwind); no shadcn/ui integration; larger bundle for equivalent features |
| Recharts v3 | Tremor | Built on Recharts anyway (meta-library); adds unnecessary abstraction layer; shadcn/ui chart is better integrated with existing design system |
| Recharts v3 | visx (Airbnb) | Lower-level, more customization but more code to write; overkill for standard analytics charts |
| Native CSV generation | papaparse/react-papaparse | Adds dependency for something achievable in ~20 lines of code; data volumes are small (daily rollup rows) |
| Native date handling | date-fns | No date library currently in project; preset date range buttons (7d, 30d, 90d) avoid needing a date picker library entirely |

**Installation:**
```bash
cd apps/web && pnpm add recharts react-is
pnpm dlx shadcn@latest add chart
```

## Architecture Patterns

### Recommended Project Structure
```
apps/web/src/features/analytics/
  api/
    analytics-api.ts          # Supabase queries for daily_metrics + RPC calls
  hooks/
    use-analytics.ts          # TanStack Query hooks (useAnalytics, useAnalyticsSummary)
  components/
    date-range-select.tsx     # Preset date range dropdown (7d, 30d, 90d, custom)
    kpi-cards.tsx             # Summary cards (impressions, clicks, CTR, dwell time)
    metrics-chart.tsx         # Time-series Recharts LineChart/AreaChart
    metrics-table.tsx         # Tabular breakdown by creative or campaign
    csv-export-button.tsx     # Download button with CSV generation
    analytics-filters.tsx     # Creative/campaign filter controls
  lib/
    csv-export.ts             # CSV string generation utility
    analytics-types.ts        # TypeScript interfaces for chart data
  pages/
    analytics-page.tsx        # Main analytics dashboard page

supabase/migrations/
  20260225000002_analytics_rollup_today.sql  # rollup_today_metrics() function + dwell time fix
```

### Pattern 1: Query daily_metrics via Supabase Client (RLS-scoped)
**What:** The frontend queries the `daily_metrics` table directly using the typed Supabase client. RLS policies (`advertiser_id = get_user_advertiser_id()`) automatically scope results to the logged-in user's advertiser.
**When to use:** Every analytics data fetch.
**Example:**
```typescript
// api/analytics-api.ts
import { supabase } from '@/lib/supabase'

export interface DailyMetricRow {
  metric_date: string
  creative_id: string | null
  campaign_id: string | null
  impressions_served: number
  impressions_viewable: number
  clicks: number
  engagements: number
  video_plays: number
  video_completes: number
  total_dwell_time_ms: number
}

export async function fetchDailyMetrics(
  advertiserId: string,
  startDate: string,  // 'YYYY-MM-DD'
  endDate: string,    // 'YYYY-MM-DD'
  filters?: { creativeId?: string; campaignId?: string }
): Promise<DailyMetricRow[]> {
  let query = supabase
    .from('daily_metrics')
    .select(
      'metric_date, creative_id, campaign_id, impressions_served, impressions_viewable, clicks, engagements, video_plays, video_completes, total_dwell_time_ms'
    )
    .eq('advertiser_id', advertiserId)
    .gte('metric_date', startDate)
    .lte('metric_date', endDate)
    .order('metric_date', { ascending: true })

  if (filters?.creativeId) {
    query = query.eq('creative_id', filters.creativeId)
  }
  if (filters?.campaignId) {
    query = query.eq('campaign_id', filters.campaignId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data as DailyMetricRow[]
}
```

### Pattern 2: TanStack Query Hook with Date Range
**What:** A React Query hook that fetches analytics data and re-fetches when date range or filters change. Uses `staleTime: 0` so page refresh always triggers a fresh query.
**When to use:** The main data-fetching hook for the analytics page.
**Example:**
```typescript
// hooks/use-analytics.ts
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import { fetchDailyMetrics, triggerTodayRollup } from '../api/analytics-api'

export function useAnalytics(
  startDate: string,
  endDate: string,
  filters?: { creativeId?: string; campaignId?: string }
) {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['analytics', profile?.advertiser_id, startDate, endDate, filters],
    queryFn: async () => {
      // If date range includes today, trigger intraday rollup first
      const today = new Date().toISOString().split('T')[0]
      if (endDate >= today) {
        await triggerTodayRollup()
      }
      return fetchDailyMetrics(profile!.advertiser_id!, startDate, endDate, filters)
    },
    enabled: !!profile?.advertiser_id,
    staleTime: 0,  // Always re-fetch on mount (ANLYT-05: refresh on page reload)
  })
}
```

### Pattern 3: Intraday "Today Rollup" via Database Function
**What:** A PL/pgSQL function that re-aggregates today's events into `daily_metrics`. Called from the frontend via `supabase.rpc()` when the date range includes the current day. This supplements the nightly cron job.
**When to use:** ANLYT-05 near-real-time requirement.
**Why database function, not Edge Function:** The rollup logic is pure SQL aggregation -- there is no HTTP orchestration or external API calls needed. A PL/pgSQL function is simpler, faster (no cold start), and already the pattern used by `rollup_daily_metrics()`.
**Example:**
```sql
-- Migration: rollup_today_metrics()
CREATE OR REPLACE FUNCTION public.rollup_today_metrics(
  p_advertiser_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_count INTEGER;
BEGIN
  WITH upserted AS (
    INSERT INTO public.daily_metrics (
      metric_date, advertiser_id, campaign_id, creative_id,
      impressions_served, impressions_viewable, clicks, engagements,
      video_plays, video_completes, total_dwell_time_ms
    )
    SELECT
      v_today,
      advertiser_id,
      campaign_id,
      creative_id,
      COUNT(*) FILTER (WHERE event_type = 'impression_served'),
      COUNT(*) FILTER (WHERE event_type = 'impression_viewable'),
      COUNT(*) FILTER (WHERE event_type = 'click'),
      COUNT(*) FILTER (WHERE event_type = 'engagement'),
      COUNT(*) FILTER (WHERE event_type = 'video_play'),
      COUNT(*) FILTER (WHERE event_type = 'video_complete'),
      0 -- dwell_time_ms: see Pattern 6 for enhancement
    FROM public.ad_events
    WHERE event_timestamp >= v_today::TIMESTAMPTZ
      AND event_timestamp < (v_today + INTERVAL '1 day')::TIMESTAMPTZ
      AND advertiser_id = p_advertiser_id
    GROUP BY advertiser_id, campaign_id, creative_id
    ON CONFLICT (metric_date, advertiser_id, campaign_id, creative_id)
    DO UPDATE SET
      impressions_served = EXCLUDED.impressions_served,
      impressions_viewable = EXCLUDED.impressions_viewable,
      clicks = EXCLUDED.clicks,
      engagements = EXCLUDED.engagements,
      video_plays = EXCLUDED.video_plays,
      video_completes = EXCLUDED.video_completes,
      total_dwell_time_ms = EXCLUDED.total_dwell_time_ms,
      updated_at = now()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM upserted;

  RETURN v_count;
END;
$$;
```

### Pattern 4: Chart Data Transformation
**What:** Transform `daily_metrics` rows into the shape Recharts expects: an array of objects with a date key and metric values.
**When to use:** Between the API response and the chart component.
**Example:**
```typescript
// lib/analytics-types.ts
export interface ChartDataPoint {
  date: string           // 'YYYY-MM-DD' or formatted label
  impressions: number
  clicks: number
  ctr: number            // percentage (0-100)
  engagements: number
}

// In the component or hook:
function aggregateByDate(rows: DailyMetricRow[]): ChartDataPoint[] {
  const byDate = new Map<string, ChartDataPoint>()

  for (const row of rows) {
    const existing = byDate.get(row.metric_date) ?? {
      date: row.metric_date,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      engagements: 0,
    }
    existing.impressions += row.impressions_served
    existing.clicks += row.clicks
    existing.engagements += row.engagements
    byDate.set(row.metric_date, existing)
  }

  // Compute CTR after aggregation
  for (const point of byDate.values()) {
    point.ctr = point.impressions > 0
      ? Number(((point.clicks / point.impressions) * 100).toFixed(2))
      : 0
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date))
}
```

### Pattern 5: CSV Export (No Library Needed)
**What:** Generate a CSV string from the analytics data array, create a Blob, and trigger a download via a temporary anchor element.
**When to use:** ANLYT-06 CSV export button.
**Example:**
```typescript
// lib/csv-export.ts
export function exportToCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][]
): void {
  const BOM = '\ufeff' // UTF-8 BOM for Excel compatibility
  const headerLine = headers.join(',')
  const dataLines = rows.map((row) =>
    row.map((cell) => {
      const str = String(cell)
      // Escape cells containing commas, quotes, or newlines
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str
    }).join(',')
  )

  const csvContent = BOM + [headerLine, ...dataLines].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}
```

### Pattern 6: Date Range Selection with Presets
**What:** Use the existing shadcn/ui Select component with preset date ranges instead of a full date picker calendar. This avoids adding a date picker library (no `date-fns` needed) and covers the most common analytics use cases.
**When to use:** ANLYT-04 configurable date ranges.
**Example:**
```typescript
// components/date-range-select.tsx
const DATE_PRESETS = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'This month', value: 'this-month' },
  { label: 'Last month', value: 'last-month' },
] as const

function getDateRange(preset: string): { start: string; end: string } {
  const now = new Date()
  const end = now.toISOString().split('T')[0]

  switch (preset) {
    case '7d': {
      const start = new Date(now)
      start.setDate(start.getDate() - 6)
      return { start: start.toISOString().split('T')[0], end }
    }
    case '30d': {
      const start = new Date(now)
      start.setDate(start.getDate() - 29)
      return { start: start.toISOString().split('T')[0], end }
    }
    // ... other cases
  }
}
```

### Anti-Patterns to Avoid
- **Do NOT query `ad_events` directly from the dashboard:** Success criteria #5 explicitly states "dashboard reads exclusively from rollups (never queries raw events directly)." Always read from `daily_metrics`.
- **Do NOT compute aggregates on the frontend from raw events:** The `daily_metrics` table exists specifically to avoid scanning millions of raw event rows. Let PostgreSQL do the heavy lifting.
- **Do NOT skip the today rollup:** Without `rollup_today_metrics()`, the dashboard would show data only up to yesterday (the cron job runs at 2 AM). Users expect to see today's metrics.
- **Do NOT use `refetchInterval` for analytics polling:** Unlike the credit balance (30s polling), analytics data does not need continuous polling. `staleTime: 0` ensures fresh data on page reload, which satisfies ANLYT-05 without wasting API calls.
- **Do NOT forget `NULLS NOT DISTINCT` on the unique index:** The Phase 9 migration already fixed this, but if creating any new unique constraints involving nullable columns (`campaign_id`, `creative_id`), always use `NULLS NOT DISTINCT`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Time-series charts | Custom SVG/Canvas rendering | Recharts v3 LineChart/AreaChart | Battle-tested, responsive, accessible, JSX API, tooltips built-in |
| Chart theming | Custom color management | shadcn/ui ChartContainer + CSS variables | Consistent with existing design system, dark mode support |
| Date range presets | Custom date math library | Native `Date` API with preset buttons | No date library currently in project; presets cover 95% of analytics use cases |
| CSV generation | Full CSV library (papaparse) | 20-line utility with `Blob` + `URL.createObjectURL` | Data volumes are small (max ~365 rows for a year); no streaming needed |
| Data aggregation | Frontend-side raw event scanning | PostgreSQL `rollup_daily_metrics()` + `rollup_today_metrics()` | Database is orders of magnitude faster at aggregation; partitioned table with indexes |
| Tenant data isolation | Manual `WHERE advertiser_id = ?` checks | RLS policies (already on `daily_metrics`) | RLS is enforced at the database level, impossible to bypass from client |
| Number formatting | Custom format functions | `Intl.NumberFormat` | Native, locale-aware, handles thousands separators |

**Key insight:** The analytics phase is primarily a frontend visualization problem. All the hard backend work (event collection, partitioned storage, rollup function, RLS policies, cron scheduling) was completed in Phases 1, 8, and 9. The only backend addition needed is the intraday `rollup_today_metrics()` function.

## Common Pitfalls

### Pitfall 1: Dashboard Shows No Data for Today
**What goes wrong:** Users serve ads, check the analytics dashboard immediately, and see zero metrics for today.
**Why it happens:** The `rollup_daily_metrics()` cron job runs at 2 AM UTC and only processes yesterday's events. Today's events have not been aggregated yet.
**How to avoid:** Create a `rollup_today_metrics(p_advertiser_id)` function that aggregates the current day's events on demand. Call it via `supabase.rpc('rollup_today_metrics', { p_advertiser_id })` in the analytics query hook before fetching `daily_metrics`. Scope it to the specific advertiser to keep it fast.
**Warning signs:** `daily_metrics` has no rows for today's date; users report "analytics are a day behind."

### Pitfall 2: NULL campaign_id Breaks Unique Constraint / ON CONFLICT
**What goes wrong:** Multiple rollup attempts for the same creative with `campaign_id = NULL` insert duplicate rows instead of upserting.
**Why it happens:** In standard SQL, `NULL != NULL`, so the original UNIQUE constraint on `(metric_date, advertiser_id, campaign_id, creative_id)` treats two NULLs as distinct.
**How to avoid:** Phase 9 migration already created `NULLS NOT DISTINCT` unique index. Verify it exists before any new rollup logic.
**Warning signs:** Duplicate rows in `daily_metrics` for the same date/creative combination; inflated metric counts.

### Pitfall 3: Recharts v3 Breaking Changes from v2 Examples
**What goes wrong:** Copy-pasting Recharts v2 examples (including shadcn/ui chart docs which currently reference v2) leads to missing props or incorrect behavior.
**Why it happens:** Recharts v3 removed internal state props like `activeIndex`, changed z-index behavior to render-order based, and deprecated the `Customized` wrapper approach.
**How to avoid:** Use Recharts v3 API directly. Key changes: (1) z-index is determined by JSX render order, (2) custom components no longer need `Customized` wrapper, (3) `ResponsiveContainer` ref behavior changed. Reference the official v3 migration guide.
**Warning signs:** Console warnings about deprecated props; charts rendering with incorrect layering; blank charts.

### Pitfall 4: Performance Degradation on Large Date Ranges
**What goes wrong:** Selecting "All Time" with many creatives and campaigns causes slow dashboard loading.
**Why it happens:** Even with `daily_metrics` rollup, a year of data across 100 creatives = ~36,500 rows. Combined with multiple chart re-renders, this can feel sluggish.
**How to avoid:** (1) Limit maximum date range to 90 days in the UI, (2) Use `useMemo` for data transformations, (3) Consider pagination for the tabular view. The `idx_daily_metrics_advertiser_date` composite index ensures fast range queries.
**Warning signs:** Dashboard load time exceeds 2-3 seconds; browser tab becomes unresponsive during chart rendering.

### Pitfall 5: Dwell Time Column Always Shows Zero
**What goes wrong:** The `total_dwell_time_ms` column in `daily_metrics` always shows 0 even though engagement events are being tracked.
**Why it happens:** The existing `rollup_daily_metrics()` function explicitly sets `total_dwell_time_ms = 0` with the comment "dwell_time_ms calculated separately if needed." Engagement/dwell time data is stored in `ad_events.extra_data` JSONB but is not extracted during rollup.
**How to avoid:** Either (a) update the rollup function to extract dwell time from `extra_data`, or (b) track dwell time as a separate event type with the duration in a structured field, or (c) accept engagement count (not duration) for v1 and defer dwell-time-in-seconds to v2. Option (c) is recommended for v1 simplicity.
**Warning signs:** Dashboard shows engagement count but no time-based dwell metric.

### Pitfall 6: CSV Export with Special Characters Corrupts in Excel
**What goes wrong:** Campaign or creative names containing commas, quotes, or non-ASCII characters produce malformed CSV files.
**Why it happens:** CSV values containing commas or quotes must be escaped by wrapping in quotes and doubling internal quotes. Excel requires a UTF-8 BOM to detect encoding.
**How to avoid:** Use the CSV export utility pattern (Pattern 5) which handles escaping and BOM. Always wrap cells containing special characters in quotes.
**Warning signs:** Excel shows garbled text; columns are misaligned; names with commas split across multiple columns.

### Pitfall 7: PostgREST Aggregate Functions Require Explicit Enablement
**What goes wrong:** Attempting to use `.sum()` or `.count()` aggregate syntax in supabase-js queries returns errors.
**Why it happens:** PostgREST v12 aggregate functions require explicit enablement via `ALTER ROLE authenticator SET pgrst.db_aggregates_enabled = 'true'`.
**How to avoid:** For Phase 10, avoid PostgREST aggregates entirely. Fetch raw `daily_metrics` rows and aggregate on the frontend. The data volume (a few hundred rows at most for a date range) makes frontend aggregation trivially fast and avoids this configuration dependency.
**Warning signs:** API errors mentioning aggregate functions not supported; unexpected query results.

## Code Examples

Verified patterns from official sources and codebase analysis:

### Recharts v3 Time-Series AreaChart with shadcn/ui
```typescript
// Source: Recharts v3 docs + shadcn/ui chart component pattern
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface MetricsChartProps {
  data: ChartDataPoint[]
  metric: 'impressions' | 'clicks' | 'ctr' | 'engagements'
}

export function MetricsChart({ data, metric }: MetricsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tickFormatter={(d: string) =>
            new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
          }
          className="text-xs"
        />
        <YAxis className="text-xs" />
        <Tooltip
          labelFormatter={(d: string) =>
            new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })
          }
          formatter={(value: number) => [
            metric === 'ctr'
              ? `${value.toFixed(2)}%`
              : new Intl.NumberFormat('en-US').format(value),
            metric.charAt(0).toUpperCase() + metric.slice(1),
          ]}
        />
        <Area
          type="monotone"
          dataKey={metric}
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.1}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
```

### KPI Summary Cards
```typescript
// Source: Existing billing-page.tsx Card pattern
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, MousePointerClick, Eye, Clock } from 'lucide-react'

interface KpiCardsProps {
  impressions: number
  clicks: number
  ctr: number
  engagements: number
}

const formatter = new Intl.NumberFormat('en-US')

export function KpiCards({ impressions, clicks, ctr, engagements }: KpiCardsProps) {
  const cards = [
    { label: 'Impressions', value: formatter.format(impressions), icon: Eye },
    { label: 'Clicks', value: formatter.format(clicks), icon: MousePointerClick },
    { label: 'CTR', value: `${ctr.toFixed(2)}%`, icon: TrendingUp },
    { label: 'Engagements', value: formatter.format(engagements), icon: Clock },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.label}
            </CardTitle>
            <card.icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

### RPC Call for Today Rollup
```typescript
// Source: Existing supabase.rpc() pattern from billing
export async function triggerTodayRollup(advertiserId: string): Promise<void> {
  const { error } = await supabase.rpc('rollup_today_metrics', {
    p_advertiser_id: advertiserId,
  })
  if (error) {
    console.error('Today rollup failed:', error.message)
    // Non-fatal: dashboard still shows historical data
  }
}
```

### Fetch Creatives/Campaigns for Filter Dropdowns
```typescript
// Source: Existing creatives-api.ts pattern
export async function fetchCreativeOptions(advertiserId: string) {
  const { data, error } = await supabase
    .from('creatives')
    .select('id, name')
    .eq('advertiser_id', advertiserId)
    .order('name')

  if (error) throw new Error(error.message)
  return data
}

export async function fetchCampaignOptions(advertiserId: string) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('id, name')
    .eq('advertiser_id', advertiserId)
    .order('name')

  if (error) throw new Error(error.message)
  return data
}
```

### Database Migration: rollup_today_metrics + dwell_time enhancement
```sql
-- Migration: 20260225000002_analytics_rollup_today.sql

-- 1. Create advertiser-scoped intraday rollup function
CREATE OR REPLACE FUNCTION public.rollup_today_metrics(
  p_advertiser_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_count INTEGER;
BEGIN
  WITH upserted AS (
    INSERT INTO public.daily_metrics (
      metric_date, advertiser_id, campaign_id, creative_id,
      impressions_served, impressions_viewable, clicks, engagements,
      video_plays, video_completes, total_dwell_time_ms
    )
    SELECT
      v_today,
      ae.advertiser_id,
      ae.campaign_id,
      ae.creative_id,
      COUNT(*) FILTER (WHERE ae.event_type = 'impression_served'),
      COUNT(*) FILTER (WHERE ae.event_type = 'impression_viewable'),
      COUNT(*) FILTER (WHERE ae.event_type = 'click'),
      COUNT(*) FILTER (WHERE ae.event_type = 'engagement'),
      COUNT(*) FILTER (WHERE ae.event_type = 'video_play'),
      COUNT(*) FILTER (WHERE ae.event_type = 'video_complete'),
      COALESCE(
        SUM(
          CASE WHEN ae.event_type = 'engagement'
          THEN (ae.extra_data->>'dwell_time_ms')::BIGINT
          ELSE 0 END
        ), 0
      )
    FROM public.ad_events ae
    WHERE ae.event_timestamp >= v_today::TIMESTAMPTZ
      AND ae.event_timestamp < (v_today + INTERVAL '1 day')::TIMESTAMPTZ
      AND ae.advertiser_id = p_advertiser_id
    GROUP BY ae.advertiser_id, ae.campaign_id, ae.creative_id
    ON CONFLICT (metric_date, advertiser_id, campaign_id, creative_id)
    DO UPDATE SET
      impressions_served = EXCLUDED.impressions_served,
      impressions_viewable = EXCLUDED.impressions_viewable,
      clicks = EXCLUDED.clicks,
      engagements = EXCLUDED.engagements,
      video_plays = EXCLUDED.video_plays,
      video_completes = EXCLUDED.video_completes,
      total_dwell_time_ms = EXCLUDED.total_dwell_time_ms,
      updated_at = now()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM upserted;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.rollup_today_metrics IS
  'Aggregates today''s ad_events for a specific advertiser into daily_metrics. Called on-demand from the analytics dashboard to provide near-real-time metrics. Scoped to one advertiser for performance.';

-- 2. Add composite index for efficient intraday rollup queries
-- The existing idx_ad_events_advertiser_id covers advertiser_id lookups,
-- but adding event_timestamp to it helps the date-scoped queries.
CREATE INDEX IF NOT EXISTS idx_ad_events_advertiser_timestamp
  ON public.ad_events (advertiser_id, event_timestamp);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Query raw events on every dashboard load | Pre-aggregated rollup tables (OLAP-lite) | Standard practice | Millisecond dashboard queries instead of multi-second table scans |
| Server-side chart rendering | Client-side SVG charts (Recharts) | 2018+ | Interactive tooltips, responsive, no server load for rendering |
| Recharts v2 with `CategoricalChartState` | Recharts v3 with hooks API | 2024-2025 | Cleaner API, better React 19 support, custom components without wrappers |
| moment.js for date formatting | `Intl.DateTimeFormat` native API | 2020+ | Zero bundle size for date formatting; locale-aware |
| file-saver + papaparse for CSV | Native `Blob` + `URL.createObjectURL` | Always available | No dependencies needed for small data volumes |
| PostgREST manual aggregate queries | PostgREST v12 native `.sum()`, `.count()` | 2024 | Requires explicit enablement; not recommended for Phase 10 (frontend aggregation is simpler) |

**Deprecated/outdated:**
- Recharts v2 `CategoricalChartState` internal props -- removed in v3
- `Customized` wrapper component -- no longer needed in Recharts v3
- `moment.js` for date formatting -- superseded by native `Intl.DateTimeFormat`
- Large CSV libraries for small data exports -- native Blob is sufficient

## Open Questions

1. **Dwell time tracking data availability**
   - What we know: The `engagement` event type exists in `ad_events`. The `total_dwell_time_ms` column exists in `daily_metrics` but is populated as 0.
   - What's unclear: Whether Phase 8's ad SDK already sends `dwell_time_ms` in the `extra_data` JSONB field of engagement events, or if this field needs to be added to the tracking code.
   - Recommendation: Check the Phase 8 serve-ad tracking injection code. If dwell time is not yet tracked, add it to the engagement event payload in the ad SDK. For the dashboard, display engagement count for v1 and add dwell-time-in-seconds as an enhancement once tracking is confirmed.

2. **shadcn/ui chart component and Recharts v3 compatibility**
   - What we know: shadcn/ui's official chart component currently wraps Recharts v2. A PR (#8486) for v3 support exists but may not be merged yet.
   - What's unclear: Whether `npx shadcn@latest add chart` installs v2 or v3.
   - Recommendation: Install Recharts v3 directly (`pnpm add recharts@^3`), then use shadcn/ui chart's `ChartContainer` pattern manually or use Recharts components directly. The shadcn/ui chart is thin wrapper -- the core value is the CSS variable theming, which can be replicated with a few Tailwind classes.

3. **PostgREST aggregate enablement on Supabase hosted**
   - What we know: PostgREST v12 aggregate functions require explicit `ALTER ROLE authenticator SET pgrst.db_aggregates_enabled = 'true'`.
   - What's unclear: Whether this setting is available on Supabase hosted plans or requires a support request.
   - Recommendation: Skip PostgREST aggregates entirely. Fetch `daily_metrics` rows and aggregate on the frontend. The data volumes (hundreds of rows) make this trivially fast and avoids infrastructure configuration.

4. **Metrics table view granularity**
   - What we know: `daily_metrics` stores per-creative, per-campaign, per-day granularity.
   - What's unclear: Whether users want a breakdown by creative within a campaign, or campaign-level totals, or both.
   - Recommendation: Default view shows campaign-level aggregates (sum across all creatives). Drill-down into a campaign shows per-creative breakdown. Both are achievable from the same `daily_metrics` data by grouping on the frontend.

## Sources

### Primary (HIGH confidence)
- Codebase: `supabase/migrations/20260219000000_initial_schema.sql` -- `daily_metrics` table schema, `ad_events` partitioned table, RLS policies, indexes
- Codebase: `supabase/migrations/20260225000001_billing_tables.sql` -- `rollup_daily_metrics()` function, `NULLS NOT DISTINCT` unique index fix, pg_cron job
- Codebase: `supabase/functions/track-event/index.ts` -- event ingestion pattern
- Codebase: `packages/shared/src/database.types.ts` -- TypeScript types for all tables including `daily_metrics`
- Codebase: `apps/web/src/features/billing/` -- established pattern for feature modules (api/, hooks/, components/, pages/)
- Codebase: `apps/web/src/router.tsx` -- existing `/analytics` placeholder route
- Codebase: `apps/web/src/components/layout/app-sidebar.tsx` -- Analytics nav item already in sidebar
- Codebase: `apps/web/components.json` -- shadcn/ui configuration (new-york style, no RSC)
- npm registry: `recharts@3.7.0` peer dependencies -- `react: ^19.0.0` confirmed compatible
- [Recharts v3 migration guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide) -- Breaking changes from v2

### Secondary (MEDIUM confidence)
- [shadcn/ui chart docs](https://ui.shadcn.com/docs/components/radix/chart) -- Chart component installation and usage (currently v2-based, v3 PR in progress)
- [PostgREST Aggregate Functions](https://supabase.com/blog/postgrest-aggregate-functions) -- Requires explicit enablement
- [shadcn/ui Recharts v3 PR #8486](https://github.com/shadcn-ui/ui/pull/8486) -- Ongoing v3 update

### Tertiary (LOW confidence)
- PostgREST aggregate enablement on Supabase hosted -- unclear if `ALTER ROLE authenticator` is accessible without support request
- Dwell time tracking in ad SDK -- needs codebase verification of `extra_data` content

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Recharts v3.7.0 confirmed React 19 compatible via npm peer deps; no other new deps needed
- Architecture: HIGH -- Pre-aggregated rollup table pattern already built and tested; frontend query pattern matches existing billing feature
- Pitfalls: HIGH -- Based on direct codebase analysis of the rollup function (dwell_time hardcoded to 0), NULL handling fix, and Recharts v3 migration guide
- Backend work: HIGH -- Only one new database function needed (`rollup_today_metrics`); all other infrastructure exists
- Chart library: MEDIUM -- Recharts v3 peer deps confirm React 19 support, but shadcn/ui chart component may still be on v2 (workaround documented)

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (stable patterns; monitor shadcn/ui chart v3 PR merge status)
