# Architecture: ScrollToday v2.0 Feature Integration

**Domain:** Analytics, campaign management, and billing enhancements for existing Supabase + React ad platform
**Researched:** 2026-02-25
**Confidence:** HIGH -- All recommendations are based on direct inspection of the existing codebase schema, API layer, frontend components, and migration history. No external library research needed; this is integration architecture against a known system.

---

## Existing System Snapshot

Before detailing each feature's integration, here is the current state of the relevant architecture:

### Database Tables (as of 2026-02-25)

| Table | Role | Key Columns |
|-------|------|-------------|
| `ad_events` | Immutable event log, monthly-partitioned by `event_timestamp` | `event_timestamp`, `event_type`, `creative_id`, `campaign_id`, `advertiser_id`, `extra_data` |
| `daily_metrics` | Pre-aggregated rollup (one row per date+advertiser+campaign+creative) | `metric_date`, `advertiser_id`, `campaign_id`, `creative_id`, all metric counters |
| `campaigns` | Campaign entity | `id`, `advertiser_id`, `name`, `status` (NO `start_date`, `end_date`, `advertiser_name`) |
| `creatives` | Creative entity | `id`, `advertiser_id`, `campaign_id`, `format_id`, `format_name`, `status`, `template_data` |
| `tracker_configs` | Reusable tracker definitions per advertiser | `id`, `advertiser_id`, `name`, `tracker_url`, `tracker_type` |
| `creative_trackers` | Junction: assigns trackers to creatives with fire conditions | `creative_id`, `tracker_config_id`, `fire_condition` |
| `credit_transactions` | Append-only billing ledger | `advertiser_id`, `type`, `amount`, `balance_after`, `stripe_session_id` |
| `advertisers` | Tenant entity with credit balance | `id`, `name`, `credit_balance` |

### Existing Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `rollup_daily_metrics(p_date)` | pg_cron at 2 AM UTC | Nightly rollup of yesterday's ad_events into daily_metrics |
| `rollup_today_metrics(p_advertiser_id)` | On-demand via RPC | Intraday rollup for "today" analytics |
| `deduct_impression_credit(p_advertiser_id)` | serve-ad Edge Function | Atomic credit deduction per impression |
| `add_impression_credits(p_advertiser_id, p_amount)` | stripe-webhook Edge Function | Credit addition after payment |

### Existing Indexes on ad_events

```
idx_ad_events_request_id          (request_id)
idx_ad_events_creative_id         (creative_id)
idx_ad_events_advertiser_id       (advertiser_id)
idx_ad_events_event_type          (event_type)
idx_ad_events_advertiser_timestamp (advertiser_id, event_timestamp)
```

### Frontend Structure

```
apps/web/src/features/
  analytics/
    api/analytics-api.ts          -- fetchDailyMetrics, triggerTodayRollup, fetchCreativeOptions, fetchCampaignOptions
    hooks/use-analytics.ts        -- useAnalytics, useCreativeOptions, useCampaignOptions
    lib/analytics-types.ts        -- ChartDataPoint, DailyMetricRow, aggregateByDate, aggregateSummary
    lib/csv-export.ts             -- exportToCsv
    components/                   -- MetricsChart (Recharts AreaChart), KpiCards, MetricsTable, DateRangeSelect, AnalyticsFilters, CsvExportButton
    pages/analytics-page.tsx      -- Main analytics page
  campaigns/
    api/campaigns-api.ts          -- CRUD, fetchCampaignsWithCreativeCount, assignCreativeToCampaign
    api/trackers-api.ts           -- CRUD for tracker_configs and creative_trackers
    hooks/                        -- use-campaigns.ts, use-trackers.ts
    components/                   -- TrackerConfigSection (inline in campaign detail), campaign-card, campaign-list, etc.
    pages/campaign-detail-page.tsx -- Campaign detail with creative grid, tracker section
  billing/
    api/billing-api.ts            -- fetchCreditBalance, fetchTransactions, createCheckoutSession
    hooks/                        -- use-credit-balance.ts, use-billing.ts
    pages/billing-page.tsx        -- Balance, credit packs, transaction history
```

---

## Feature-by-Feature Integration Architecture

### 1. Hourly Breakdown Chart

**Question:** daily_metrics only has daily granularity. Do we need hourly_metrics, query raw ad_events by hour, or add a rollup function?

**Recommendation:** Query raw `ad_events` by hour using a PostgreSQL function. Do NOT create an `hourly_metrics` table.

**Rationale:**
- Hourly charts are a drill-down feature, not the default view. Users will request hourly data for a specific day (or at most a few days), which scopes the query to a single monthly partition.
- The existing `idx_ad_events_advertiser_timestamp` composite index on `(advertiser_id, event_timestamp)` already covers this query pattern efficiently.
- An `hourly_metrics` table would add 24x the rows of `daily_metrics`, require another pg_cron job, and create consistency complexity -- all for a feature that a simple `date_trunc('hour', event_timestamp)` GROUP BY handles well.
- For "today" hourly data, the raw events ARE the source of truth anyway.

**Implementation:**

```sql
-- New PostgreSQL function (single migration)
CREATE OR REPLACE FUNCTION public.fetch_hourly_metrics(
  p_advertiser_id UUID,
  p_date DATE,
  p_campaign_id UUID DEFAULT NULL,
  p_creative_id UUID DEFAULT NULL
)
RETURNS TABLE (
  hour TIMESTAMPTZ,
  impressions_served BIGINT,
  impressions_viewable BIGINT,
  clicks BIGINT,
  engagements BIGINT,
  video_plays BIGINT,
  video_completes BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    date_trunc('hour', ae.event_timestamp) AS hour,
    COUNT(*) FILTER (WHERE ae.event_type = 'impression_served'),
    COUNT(*) FILTER (WHERE ae.event_type = 'impression_viewable'),
    COUNT(*) FILTER (WHERE ae.event_type = 'click'),
    COUNT(*) FILTER (WHERE ae.event_type = 'engagement'),
    COUNT(*) FILTER (WHERE ae.event_type = 'video_play'),
    COUNT(*) FILTER (WHERE ae.event_type = 'video_complete')
  FROM public.ad_events ae
  WHERE ae.advertiser_id = p_advertiser_id
    AND ae.event_timestamp >= p_date::TIMESTAMPTZ
    AND ae.event_timestamp < (p_date + INTERVAL '1 day')::TIMESTAMPTZ
    AND (p_campaign_id IS NULL OR ae.campaign_id = p_campaign_id)
    AND (p_creative_id IS NULL OR ae.creative_id = p_creative_id)
  GROUP BY date_trunc('hour', ae.event_timestamp)
  ORDER BY hour
$$;
```

**Frontend integration:**

| Layer | Change |
|-------|--------|
| `analytics-api.ts` | Add `fetchHourlyMetrics(advertiserId, date, filters)` calling `supabase.rpc('fetch_hourly_metrics', ...)` |
| `analytics-types.ts` | Add `HourlyChartDataPoint` type with `hour: string` instead of `date: string` |
| `use-analytics.ts` | Add `useHourlyAnalytics(date, filters)` hook with queryKey `['analytics-hourly', ...]` |
| `metrics-chart.tsx` | Add "Hourly" view toggle. When a single day is selected (or user clicks a day on the daily chart), switch to hourly X-axis with `HH:00` formatting |
| No new page needed | Hourly view is an in-place drill-down on the existing chart component |

**Schema changes:** One migration (the function above). No new tables. No new indexes needed.

**Performance note:** For a single day + single advertiser, the query hits one partition using the existing composite index. Expected scan: ~10K-100K rows per day per advertiser at moderate scale, which PostgreSQL handles in <100ms.

---

### 2. Lifetime Totals

**Question:** Simple aggregate query on daily_metrics, or a separate materialized view?

**Recommendation:** Simple aggregate query on `daily_metrics`. No materialized view.

**Rationale:**
- Lifetime totals are a SUM over all `daily_metrics` rows for an advertiser (optionally filtered by campaign/creative). With the existing `idx_daily_metrics_advertiser_date` index, this is a fast index scan.
- At 1 year of data with 50 creatives, that is ~18K rows per advertiser -- trivially fast to SUM.
- A materialized view adds maintenance (refresh scheduling), risks stale data, and provides negligible performance gain at this scale.
- The existing `aggregateSummary()` function in `analytics-types.ts` already computes totals client-side from fetched rows. For lifetime totals, we can either: (a) fetch all daily_metrics rows for the advertiser and sum client-side, or (b) add a server-side aggregate query. Recommendation: server-side for efficiency.

**Implementation:**

```sql
-- No new function needed. Use Supabase client query directly.
-- OR add a lightweight helper:

CREATE OR REPLACE FUNCTION public.fetch_lifetime_totals(
  p_advertiser_id UUID,
  p_campaign_id UUID DEFAULT NULL,
  p_creative_id UUID DEFAULT NULL
)
RETURNS TABLE (
  impressions_served BIGINT,
  impressions_viewable BIGINT,
  clicks BIGINT,
  engagements BIGINT,
  video_plays BIGINT,
  video_completes BIGINT,
  total_dwell_time_ms BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(dm.impressions_served), 0),
    COALESCE(SUM(dm.impressions_viewable), 0),
    COALESCE(SUM(dm.clicks), 0),
    COALESCE(SUM(dm.engagements), 0),
    COALESCE(SUM(dm.video_plays), 0),
    COALESCE(SUM(dm.video_completes), 0),
    COALESCE(SUM(dm.total_dwell_time_ms), 0)
  FROM public.daily_metrics dm
  WHERE dm.advertiser_id = p_advertiser_id
    AND (p_campaign_id IS NULL OR dm.campaign_id = p_campaign_id)
    AND (p_creative_id IS NULL OR dm.creative_id = p_creative_id)
$$;
```

**Frontend integration:**

| Layer | Change |
|-------|--------|
| `analytics-api.ts` | Add `fetchLifetimeTotals(advertiserId, filters?)` calling the RPC |
| `analytics-types.ts` | Add `'lifetime'` to `DateRangePreset` union |
| `date-range-select.tsx` | Add "Lifetime" option to the preset dropdown |
| `use-analytics.ts` | When preset is `'lifetime'`, call `fetchLifetimeTotals` instead of date-range query. Return summary-only data (no chart data for lifetime -- show KPI cards only, hide daily chart) |
| `analytics-page.tsx` | Conditionally hide the time-series chart when "Lifetime" is selected (show KPI cards + metrics table only) |

**Schema changes:** One optional migration (the function). Could also be done purely client-side with a wide date range query.

---

### 3. Pie Chart by Creative / Platform Breakdown

**Question:** daily_metrics has `creative_id` for creative breakdown and `device_type` for platform. What query patterns?

**Important finding:** The current `daily_metrics` table does NOT have a `device_type` column. The question mentions it, but inspecting the schema shows only: `metric_date, advertiser_id, campaign_id, creative_id, impressions_served, impressions_viewable, clicks, engagements, video_plays, video_completes, total_dwell_time_ms`.

Similarly, `ad_events` does NOT have a `device_type` column. It has `extra_data JSONB` which could contain device info, but only if the `track-event` Edge Function stores it there.

**Recommendation: Two sub-features with different approaches.**

#### 3a. Creative Breakdown Pie Chart

Already fully supported. The existing `MetricsTable` component groups by `creative_id` using client-side aggregation. A pie chart is the same data in a different visualization.

| Layer | Change |
|-------|--------|
| `analytics-page.tsx` | Add a `<BreakdownPieChart>` component alongside the existing metrics table |
| New component `breakdown-pie-chart.tsx` | Recharts `PieChart` that takes the same `DailyMetricRow[]` data, groups by `creative_id`, shows proportional impressions/clicks/engagements. Toggle between "By Creative" / "By Campaign" like the existing table |
| No API changes | Already fetching `creative_id` and `campaign_id` in `fetchDailyMetrics` |
| No schema changes | None needed |

#### 3b. Platform/Device Breakdown Pie Chart

Requires schema work because device info is not currently captured in `daily_metrics`.

**Option A (recommended): Add `device_type` to daily_metrics granularity.**

This means changing the rollup to group by device type in addition to creative/campaign. The UNIQUE constraint becomes `(metric_date, advertiser_id, campaign_id, creative_id, device_type)`.

```sql
-- Migration to add device_type
ALTER TABLE public.daily_metrics
  ADD COLUMN device_type TEXT NOT NULL DEFAULT 'unknown';

-- Drop old unique index and create new one
DROP INDEX IF EXISTS idx_daily_metrics_unique;
CREATE UNIQUE INDEX idx_daily_metrics_unique
  ON public.daily_metrics (metric_date, advertiser_id, campaign_id, creative_id, device_type)
  NULLS NOT DISTINCT;
```

This also requires:
1. The `track-event` Edge Function to detect and store device type in `ad_events.extra_data->>'device_type'` (or a new column on ad_events).
2. Both rollup functions (`rollup_daily_metrics` and `rollup_today_metrics`) to include device_type in the GROUP BY.

**Option B (simpler short-term): Query ad_events.extra_data for device info.**

If `extra_data` already contains `device_type` from the tracking layer:

```sql
SELECT
  COALESCE(ae.extra_data->>'device_type', 'unknown') AS device_type,
  COUNT(*) FILTER (WHERE ae.event_type = 'impression_served') AS impressions
FROM ad_events ae
WHERE ae.advertiser_id = p_advertiser_id
  AND ae.event_timestamp >= p_start::TIMESTAMPTZ
  AND ae.event_timestamp < p_end::TIMESTAMPTZ
GROUP BY COALESCE(ae.extra_data->>'device_type', 'unknown')
```

**Decision recommendation:** Check if `track-event` currently stores device info. If not, device breakdown requires instrumenting the tracking layer first. This is a Phase 2 concern -- build the creative/campaign pie chart first (zero schema work), add device breakdown when the tracking pipeline supports it.

---

### 4. Custom Reports (Saved Reports)

**Question:** Need a saved_reports table? What schema? Store metric selections? Query at export time vs pre-compute?

**Recommendation:** New `saved_reports` table with JSONB config. Query at export time, never pre-compute.

**Rationale:**
- Pre-computing defeats the purpose. Reports need fresh data when opened/exported.
- The report definition is just a filter configuration: date range, metric selections, group-by dimensions, creative/campaign filters. Store as JSONB for flexibility.
- Reports execute against `daily_metrics` (or `ad_events` for hourly) using the same API functions that the analytics page uses.

**Schema:**

```sql
CREATE TABLE public.saved_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  advertiser_id UUID NOT NULL REFERENCES public.advertisers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full access to saved_reports"
ON public.saved_reports FOR ALL
TO authenticated
USING ((SELECT public.is_super_admin()))
WITH CHECK ((SELECT public.is_super_admin()));

CREATE POLICY "Users can manage own saved_reports"
ON public.saved_reports FOR ALL
TO authenticated
USING (advertiser_id = (SELECT public.get_user_advertiser_id()))
WITH CHECK (advertiser_id = (SELECT public.get_user_advertiser_id()));

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.saved_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_saved_reports_advertiser ON public.saved_reports (advertiser_id);
```

**Config JSONB structure:**

```typescript
interface ReportConfig {
  // Date range
  datePreset?: DateRangePreset  // '7d' | '30d' | '90d' | 'this-month' | 'last-month' | 'lifetime'
  customStart?: string          // 'YYYY-MM-DD' (if no preset)
  customEnd?: string            // 'YYYY-MM-DD' (if no preset)

  // Filters
  campaignId?: string
  creativeId?: string

  // Selected metrics (which columns to include)
  metrics: Array<'impressions' | 'clicks' | 'ctr' | 'engagements' | 'viewable_impressions' | 'video_plays' | 'video_completes' | 'dwell_time'>

  // Group by
  groupBy: 'date' | 'creative' | 'campaign' | 'none'

  // Granularity
  granularity: 'daily' | 'hourly'
}
```

**Frontend integration:**

| Layer | Change |
|-------|--------|
| New feature directory | `features/reports/` with api, hooks, components, pages |
| `reports-api.ts` | CRUD for `saved_reports` table, plus `executeReport(config)` that calls existing `fetchDailyMetrics` or `fetchHourlyMetrics` based on config |
| `report-builder-page.tsx` | Form UI to configure report: date range picker, metric checkboxes, filter dropdowns, group-by selector |
| `reports-list-page.tsx` | List of saved reports with "Run" and "Export CSV" actions |
| `router.tsx` | Add `/reports` and `/reports/new` and `/reports/:id` routes |
| `csv-export.ts` | Reuse existing `exportToCsv` function -- it already handles arbitrary headers/rows |

**Key principle:** Reports share the same data-fetching logic as the analytics page. The `executeReport` function maps the stored config to the same `fetchDailyMetrics` / `fetchHourlyMetrics` calls. No separate query infrastructure.

---

### 5. Tracker Management Page

**Question:** tracker_configs already in DB. Just a new frontend page, or schema changes?

**Recommendation:** New standalone page extracting and enhancing the existing `TrackerConfigSection` component. No schema changes needed.

**Current state:**
- `TrackerConfigSection` component is embedded inside `campaign-detail-page.tsx` at the bottom
- `trackers-api.ts` already has full CRUD for both `tracker_configs` and `creative_trackers`
- `use-trackers.ts` has all the React Query hooks

**Problem with current UX:**
- Trackers are only accessible from inside a campaign detail page
- Advertiser-level tracker library is mixed with campaign-specific context
- No way to see which creatives use which tracker across all campaigns

**Implementation:**

| Layer | Change |
|-------|--------|
| New page `features/campaigns/pages/trackers-page.tsx` | Standalone page with the tracker library (lifted from `TrackerConfigSection`) plus a "Usage" column showing count of creative_trackers per config |
| `trackers-api.ts` | Add `fetchTrackerUsageCount(configId)` -- `select('creative_id', { count: 'exact' })` from `creative_trackers` filtered by `tracker_config_id` |
| `campaign-detail-page.tsx` | Keep the existing `TrackerConfigSection` as-is (or replace with a link to `/trackers`). The `CreativeTrackers` per-creative expand section stays |
| `router.tsx` | Add `/trackers` route |
| `app-sidebar.tsx` | Add "Trackers" nav item (under Campaigns or as standalone) |
| No schema changes | `tracker_configs` and `creative_trackers` tables are complete as-is |

**Optional enhancement:** Add an `updateTrackerConfig` API call -- `trackers-api.ts` already has it implemented but there is no edit UI. The new page should include inline editing.

---

### 6. Campaign Enhancements

**Question:** campaigns table needs `advertiser_name`, `start_date`, `end_date` fields. Impressions counter from daily_metrics join.

**Recommendation:** Add `start_date` and `end_date` to campaigns. Do NOT add `advertiser_name` to campaigns -- it is already on the `advertisers` table.

**Rationale for not duplicating advertiser_name:**
- `campaigns.advertiser_id` already references `advertisers.id`
- Super admins who need to see advertiser names can join: `campaigns(*, advertisers(name))`
- Denormalizing `advertiser_name` into campaigns creates a maintenance burden if the advertiser name changes

**Migration:**

```sql
-- Add date fields to campaigns
ALTER TABLE public.campaigns
  ADD COLUMN start_date DATE,
  ADD COLUMN end_date DATE;

-- Constraint: end_date must be >= start_date if both are set
ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_date_range_valid
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);

-- Index for date-based queries (finding active campaigns)
CREATE INDEX idx_campaigns_dates ON public.campaigns (start_date, end_date)
  WHERE start_date IS NOT NULL;
```

**Impressions counter -- no schema change needed:**

The impression count per campaign is a runtime query, not a stored column. Two approaches:

**Approach A (recommended): Supabase relational query with aggregate**

```typescript
// In campaigns-api.ts -- extend fetchCampaignsWithCreativeCount
export async function fetchCampaignsEnhanced(): Promise<CampaignEnhanced[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*, creatives(count), advertisers(name)')
    .order('updated_at', { ascending: false })

  // Then fetch impression totals per campaign
  const { data: metrics } = await supabase
    .from('daily_metrics')
    .select('campaign_id, impressions_served')
    // RLS scopes to advertiser automatically

  // Group impressions by campaign_id client-side
  const impressionMap = new Map<string, number>()
  for (const m of metrics ?? []) {
    if (m.campaign_id) {
      impressionMap.set(
        m.campaign_id,
        (impressionMap.get(m.campaign_id) ?? 0) + m.impressions_served
      )
    }
  }

  return data.map(campaign => ({
    ...campaign,
    creative_count: campaign.creatives?.[0]?.count ?? 0,
    advertiser_name: campaign.advertisers?.name ?? '',
    total_impressions: impressionMap.get(campaign.id) ?? 0,
  }))
}
```

**Approach B: Database function for efficiency at scale**

```sql
CREATE OR REPLACE FUNCTION public.fetch_campaign_summary(p_campaign_id UUID)
RETURNS TABLE (total_impressions BIGINT, total_clicks BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(impressions_served), 0),
    COALESCE(SUM(clicks), 0)
  FROM daily_metrics
  WHERE campaign_id = p_campaign_id
$$;
```

Use Approach A initially (simpler, fewer migrations). Switch to Approach B only if campaign list becomes slow with many campaigns.

**Frontend integration:**

| Layer | Change |
|-------|--------|
| `campaigns-api.ts` | Modify `fetchCampaignsWithCreativeCount` to also fetch start_date, end_date, and impression totals |
| `campaign-form-dialog.tsx` | Add start_date and end_date fields (date pickers) |
| `campaign-card.tsx` | Show date range, impression count |
| `campaign-list.tsx` | Display new columns |
| Shared types | Update `Tables<'campaigns'>` type generation (supabase gen types) |

---

### 7. Per-Campaign Analytics Tab

**Question:** Filter daily_metrics by campaign_id. Already available in schema.

**Recommendation:** Add an analytics tab to the campaign detail page. Zero schema changes.

**Current state:**
- `campaign-detail-page.tsx` shows creatives, trackers, status management
- `fetchDailyMetrics` already accepts `filters.campaignId`
- `useAnalytics` hook already supports campaign filtering

**Implementation:**

| Layer | Change |
|-------|--------|
| `campaign-detail-page.tsx` | Add a `Tabs` component at the top: "Creatives" (existing content) and "Analytics" (new tab content) |
| New component `campaign-analytics-tab.tsx` | Reuses `KpiCards`, `MetricsChart`, `CsvExportButton`, `DateRangeSelect` from the analytics feature. Passes `filters={{ campaignId: id }}` to `useAnalytics` |
| No API changes | `fetchDailyMetrics` already handles `campaignId` filter |
| No schema changes | `daily_metrics.campaign_id` with `idx_daily_metrics_campaign_date` index already exists |

**Important: avoid component duplication.** The analytics components (`KpiCards`, `MetricsChart`, `DateRangeSelect`, etc.) should be imported from `features/analytics/components/` into the campaign feature. Do NOT recreate them.

```
features/campaigns/pages/campaign-detail-page.tsx
  -- Imports from:
  features/analytics/components/kpi-cards.tsx
  features/analytics/components/metrics-chart.tsx
  features/analytics/components/date-range-select.tsx
  features/analytics/components/csv-export-button.tsx
  features/analytics/hooks/use-analytics.ts
  features/analytics/lib/analytics-types.ts
```

This cross-feature import is acceptable because analytics components are purely presentational with data passed via props/hooks.

---

### 8. Billing Spend Summary

**Question:** Impressions consumed per creative type. Join daily_metrics with creatives for format/type grouping. Cost = impressions * CPM rate.

**Recommendation:** Server-side aggregate query joining `daily_metrics` with `creatives`. CPM rates stored in app config (not in DB) since they are business logic.

**Rationale:**
- The join is straightforward: `daily_metrics.creative_id -> creatives.format_id`
- CPM rates vary by creative format (e.g., standard banner = $2 CPM, video = $5 CPM, interactive = $3 CPM)
- Rates should be defined as application constants, not stored in the DB, because: (a) they change rarely, (b) they are the same for all advertisers (pricing tiers), (c) storing in DB adds complexity for no benefit

**Implementation:**

```typescript
// billing-api.ts

// CPM rates by creative format (cents per 1000 impressions)
// Keep in sync with pricing page / Stripe product definitions
const CPM_RATES: Record<string, number> = {
  'static-banner': 2.00,
  'animated-banner': 2.50,
  'multi-frame': 3.00,
  'in-feed': 3.00,
  'carousel': 3.50,
  'flipcard': 3.50,
  'cube': 3.50,
  'accordion': 3.50,
  'slider': 3.50,
  'scratch': 3.50,
  'quiz': 4.00,
  'countdown': 3.00,
  'video-endcard': 5.00,
  'click-to-play': 5.00,
}

export interface SpendSummaryRow {
  format_id: string
  format_name: string
  impressions: number
  cpm: number
  estimated_spend: number  // impressions / 1000 * cpm
}

export async function fetchSpendSummary(
  advertiserId: string,
  startDate?: string,
  endDate?: string
): Promise<SpendSummaryRow[]> {
  // Fetch daily_metrics with creative format info
  let query = supabase
    .from('daily_metrics')
    .select('impressions_served, creative_id, creatives(format_id, format_name)')
    .eq('advertiser_id', advertiserId)

  if (startDate) query = query.gte('metric_date', startDate)
  if (endDate) query = query.lte('metric_date', endDate)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  // Aggregate by format
  const byFormat = new Map<string, { format_name: string; impressions: number }>()
  for (const row of data) {
    const format_id = row.creatives?.format_id ?? 'unknown'
    const format_name = row.creatives?.format_name ?? 'Unknown'
    const existing = byFormat.get(format_id) ?? { format_name, impressions: 0 }
    existing.impressions += row.impressions_served
    byFormat.set(format_id, existing)
  }

  return Array.from(byFormat.entries()).map(([format_id, agg]) => {
    const cpm = CPM_RATES[format_id] ?? 2.00
    return {
      format_id,
      format_name: agg.format_name,
      impressions: agg.impressions,
      cpm,
      estimated_spend: (agg.impressions / 1000) * cpm,
    }
  })
}
```

**Frontend integration:**

| Layer | Change |
|-------|--------|
| `billing-api.ts` | Add `fetchSpendSummary` function (above) and `CPM_RATES` config |
| `use-billing.ts` | Add `useSpendSummary(startDate?, endDate?)` hook |
| New component `spend-summary-card.tsx` | Table showing format, impressions, CPM rate, estimated spend. Total row at bottom |
| `billing-page.tsx` | Add spend summary section between "Available Credits" and "Purchase Credits" |
| No schema changes | Uses existing daily_metrics + creatives join via Supabase relational queries |

**Alternative: if CPM rates need to be dynamic/per-advertiser:**

Add a `pricing_tiers` table or a `cpm_rate` column to `creatives`. But this is premature -- start with static config and move to DB-stored rates only if the business requires per-advertiser pricing.

---

## Data Flow Summary

```
                        EXISTING                           NEW (v2.0)
                        --------                           ----------

ad_events (raw)  ──┬── rollup_daily_metrics (cron)  ──── daily_metrics
                   │                                         │
                   │── rollup_today_metrics (on-demand) ─────┘
                   │                                         │
                   │── fetch_hourly_metrics (NEW, on-demand) │  <-- Feature 1
                   │                                         │
                   │                                    ┌────┴────────────┐
                   │                                    │                 │
                   │                              fetchDailyMetrics  fetchLifetimeTotals  <-- Feature 2
                   │                                    │                 │
                   │                         ┌──────────┼─────────────────┘
                   │                         │          │
                   │                    KPI Cards   MetricsChart
                   │                    (existing)  (existing)
                   │                         │          │
                   │                    PieChart    HourlyChart   <-- Features 1, 3
                   │                    (NEW)       (NEW)
                   │
                   │
daily_metrics ────┬── analytics-page  (existing + enhanced)
                  │── campaign-detail (analytics tab, NEW)      <-- Feature 7
                  │── billing spend summary (NEW join)          <-- Feature 8
                  │── saved_reports (execute at query time)     <-- Feature 4
                  │
                  │
saved_reports ────── reports pages (NEW)                        <-- Feature 4
                  │
tracker_configs ──── trackers page (NEW standalone)             <-- Feature 5
                  │
campaigns ────────── enhanced list + form (MODIFIED)            <-- Feature 6
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `features/analytics/` | All analytics data fetching, chart components, KPI display, aggregation logic | Supabase `daily_metrics`, `ad_events` via RPC |
| `features/campaigns/` | Campaign CRUD, creative assignment, tracker management, per-campaign analytics tab | Supabase `campaigns`, `creatives`, imports from `analytics/` |
| `features/billing/` | Credit balance, transactions, checkout, spend summary | Supabase `advertisers`, `credit_transactions`, `daily_metrics` + `creatives` join |
| `features/reports/` (NEW) | Saved report configs, report execution, CSV export | Supabase `saved_reports`, delegates to `analytics/` API for data |
| Database functions | Hourly metrics, lifetime totals, rollups | `ad_events`, `daily_metrics` tables |

---

## Migration Requirements Summary

| Migration | Tables/Functions Affected | Feature | Priority |
|-----------|--------------------------|---------|----------|
| `_add_campaign_dates.sql` | ALTER `campaigns` ADD `start_date`, `end_date` + constraint + index | Feature 6 | P0 -- needed before campaign form changes |
| `_hourly_metrics_fn.sql` | CREATE FUNCTION `fetch_hourly_metrics` | Feature 1 | P0 |
| `_lifetime_totals_fn.sql` | CREATE FUNCTION `fetch_lifetime_totals` | Feature 2 | P1 (could be client-side initially) |
| `_saved_reports_table.sql` | CREATE TABLE `saved_reports` + RLS + index + trigger | Feature 4 | P1 |
| `_daily_metrics_device_type.sql` | ALTER `daily_metrics` ADD `device_type`, rebuild unique index, update rollup functions | Feature 3b | P2 -- only after tracking pipeline supports device detection |

**Features requiring NO migrations:** Feature 3a (creative pie chart), Feature 5 (tracker page), Feature 7 (campaign analytics tab), Feature 8 (billing spend summary).

---

## Suggested Build Order

Based on dependency analysis and migration complexity:

```
Phase 1: Zero-migration features (frontend only)
  1. Feature 3a: Creative/Campaign Pie Chart     -- new component using existing data
  2. Feature 7:  Per-Campaign Analytics Tab       -- reuse existing analytics components
  3. Feature 5:  Tracker Management Page          -- extract existing TrackerConfigSection
  4. Feature 8:  Billing Spend Summary            -- new component + API function

Phase 2: Light migrations (new functions/columns)
  5. Feature 6:  Campaign Enhancements            -- ALTER campaigns + form changes
  6. Feature 1:  Hourly Breakdown Chart           -- new PG function + chart toggle
  7. Feature 2:  Lifetime Totals                  -- new PG function + date preset

Phase 3: New table + full feature
  8. Feature 4:  Custom Reports                   -- new table + new feature directory

Phase 4: Tracking pipeline work (deferred)
  9. Feature 3b: Device/Platform Breakdown        -- requires track-event changes + migration
```

**Ordering rationale:**
- Phase 1 items have zero backend changes and can ship immediately as frontend PRs
- Phase 2 items are independent of each other and can be developed in parallel
- Feature 4 (Custom Reports) depends on Features 1 and 2 being available (reports need hourly + lifetime options)
- Feature 3b (device breakdown) requires instrumenting the entire tracking pipeline and is orthogonal to all other features

---

## Anti-Patterns to Avoid

### Anti-Pattern: Separate Analytics Endpoint Per Feature

**What:** Creating isolated API functions for campaign analytics, billing analytics, report analytics, each with their own query logic.
**Why bad:** Duplicated query patterns, inconsistent metric definitions, harder to maintain.
**Instead:** All analytics queries go through the same `analytics-api.ts` module. Campaign analytics tab and reports both import from there. Billing spend summary is the only exception because it needs a creative format join.

### Anti-Pattern: Denormalizing Metric Totals into Entity Tables

**What:** Adding `total_impressions BIGINT` column to `campaigns` or `creatives` tables and keeping it in sync via triggers.
**Why bad:** Stale data, sync failures, complexity. The existing rollup architecture already solves aggregation.
**Instead:** Always compute totals by querying `daily_metrics`. It is fast enough with the existing indexes.

### Anti-Pattern: Pre-Computing Report Results

**What:** Running report queries on a schedule and caching results in a `report_results` table.
**Why bad:** Stale data, storage waste, complex invalidation logic.
**Instead:** Execute reports on-demand against `daily_metrics`. For a single advertiser's date range, these queries return in <200ms.

### Anti-Pattern: Hourly Metrics Rollup Table

**What:** Creating an `hourly_metrics` table with 24x the rows of daily_metrics and a corresponding cron job.
**Why bad:** Massively increases storage and maintenance for a drill-down feature used occasionally.
**Instead:** Query `ad_events` directly with `date_trunc('hour', ...)` for the specific day requested. The partition pruning + advertiser index makes this fast.

---

## Scalability Considerations

| Concern | At 100 advertisers | At 1K advertisers | At 10K advertisers |
|---------|-------------------|-------------------|---------------------|
| Hourly query perf | <50ms (single partition scan) | <50ms (advertiser-scoped) | <100ms; consider BRIN index on ad_events timestamp |
| Lifetime totals | <20ms (few hundred rows) | <50ms (~5K rows) | <200ms; add materialized view if needed |
| daily_metrics size | ~50K rows/year | ~500K rows/year | ~5M rows/year; consider partitioning daily_metrics by year |
| saved_reports | Trivial | Trivial | Trivial (metadata only) |
| Spend summary join | <50ms | <100ms | <200ms; consider caching format aggregates |

Current architecture handles 1K advertisers without changes. At 10K, consider:
1. BRIN index on `ad_events.event_timestamp` for partition-crossing queries
2. Yearly partitioning on `daily_metrics`
3. Redis/in-memory caching for frequently requested lifetime totals

---

## Sources

- Direct codebase inspection (HIGH confidence):
  - `supabase/migrations/20260219000000_initial_schema.sql` -- complete schema
  - `supabase/migrations/20260225000001_billing_tables.sql` -- billing schema + rollup functions
  - `supabase/migrations/20260225000002_analytics_rollup_today.sql` -- intraday rollup
  - `supabase/migrations/20260223000001_tracker_tables.sql` -- tracker schema
  - `supabase/migrations/20260224000001_credit_balance_serving.sql` -- credit system
  - `apps/web/src/features/analytics/` -- complete analytics frontend
  - `apps/web/src/features/campaigns/` -- complete campaigns frontend
  - `apps/web/src/features/billing/` -- complete billing frontend
  - `apps/web/src/router.tsx` -- route structure
