# Phase 12: Campaign Detail Enhancements - Research

**Researched:** 2026-02-25
**Domain:** Campaign analytics tabs, ad tag placements view, creative duplication (React + Supabase)
**Confidence:** HIGH

## Summary

Phase 12 adds three focused enhancements to the existing campaign detail page (`campaign-detail-page.tsx`): an Analytics tab showing per-campaign metrics (CAMP-08), a Placements tab listing all creatives with one-click tag copy (CAMP-09), and a creative duplication feature (CAMP-10). The key architectural decision is converting the current campaign detail page from a flat layout to a tabbed layout using shadcn/ui Tabs.

All three features build entirely on existing infrastructure. The analytics API already supports `campaignId` filtering (`analytics-api.ts:fetchDailyMetrics` takes `filters?.campaignId`). The tag generator utilities (`tag-generator.ts`) already produce DFP and embed tags. Creative duplication is a simple INSERT operation copying all creative fields except `id`, `created_at`, `updated_at`, and `preview_token`, with a `(Copy)` suffix on the name and status reset to `draft`. No new database migrations are needed for CAMP-08 or CAMP-09. CAMP-10 requires only a new API function -- no schema changes since all required columns already exist.

The existing analytics page (`analytics-page.tsx`) provides proven, reusable patterns: `DateRangeSelect` for date range picker, `KpiCards` for summary metrics, `MetricsChart` (Recharts AreaChart) for time-series, and the `useAnalytics` hook with intraday rollup. These components can be imported directly or their patterns replicated for the campaign-scoped context.

**Primary recommendation:** Restructure campaign detail page into a tabbed layout (Creatives | Analytics | Placements), reuse existing analytics components and tag generator utilities, add a `duplicateCreative` API function that copies the creative record server-side with Supabase INSERT.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CAMP-08 | User can view per-campaign analytics (impressions, clicks, CTR) in an Analytics tab inside campaign detail | Analytics API already supports `campaignId` filter. Reuse `useAnalytics` hook, `KpiCards`, `MetricsChart`, `DateRangeSelect` components from Phase 10. Wire with campaign ID from URL params. |
| CAMP-09 | User can view and copy ad tags for all campaign creatives from a Placements tab inside campaign detail | Tag generator utilities (`generateDfpTag`, `generateEmbedTag`) exist from Phase 7. Placements tab renders a table of creatives with inline copy buttons for each tag type. Use `navigator.clipboard.writeText()` pattern from `TagExportDialog`. |
| CAMP-10 | User can duplicate a creative within a campaign | New `duplicateCreative` API function: fetch source creative, INSERT new row with all fields copied, name suffixed with `(Copy)`, status reset to `draft`, same `campaign_id`. Invalidate `campaign-creatives` and `creatives` query caches on success. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.x | UI framework | Already in use across entire app |
| TypeScript | 5.x | Type safety | Project-wide standard |
| @tanstack/react-query | 5.x | Server state management | All data fetching uses this (useQuery/useMutation) |
| @supabase/supabase-js | 2.x | Database client | All API calls go through Supabase client |
| recharts | 2.x | Charts | Used by existing analytics MetricsChart component |
| shadcn/ui | latest | UI components | Tabs, Card, Table, Button, Badge, Tooltip all available |
| lucide-react | latest | Icons | Project-wide icon library |
| sonner | latest | Toast notifications | Used throughout for success/error toasts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-router | 7.x | Routing/URL params | `useParams` to get campaign ID |
| @scrolltoday/shared | local | Database types | `Tables<'creatives'>`, `Insertable<'creatives'>`, `Enums<...>` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tabs for page sections | Separate routes (/campaigns/:id/analytics) | Tabs keep all data in one page load, simpler UX; separate routes would cause re-fetches and break mental model |
| Inline tag copy in table | Reuse TagExportDialog per creative | Dialog per creative is heavy; inline copy buttons are faster for bulk tag export -- the whole point of Placements tab |

**Installation:** No new packages needed. All dependencies already installed.

## Architecture Patterns

### Current Campaign Detail Page Structure
```
campaign-detail-page.tsx (current - flat layout)
  Header: campaign name, status badge, status transitions
  Actions bar: "Assign Creatives" button, creative count
  Creative cards grid: each card has thumbnail, status, actions
  Tracker config section
  Dialogs: AssignCreativesDialog, TagExportDialog
```

### Recommended New Structure (Tabbed Layout)
```
campaign-detail-page.tsx (new - tabbed layout)
  Header: campaign name, status badge, status transitions (UNCHANGED)
  Tabs:
    [Creatives] - existing creative grid + assign + tracker section
    [Analytics] - KPI cards + chart + date range selector (CAMP-08)
    [Placements] - creative tag table with copy buttons (CAMP-09)
  Dialogs: AssignCreativesDialog, TagExportDialog (UNCHANGED)
```

### Files to Create/Modify
```
apps/web/src/features/campaigns/
  pages/
    campaign-detail-page.tsx          # MODIFY: add Tabs wrapper, extract tab content
  components/
    campaign-analytics-tab.tsx        # NEW: analytics tab content (CAMP-08)
    campaign-placements-tab.tsx       # NEW: placements tab with tag copy (CAMP-09)
  api/
    campaigns-api.ts                  # MODIFY: add duplicateCreative function (CAMP-10)
  hooks/
    use-campaigns.ts                  # MODIFY: add useDuplicateCreative hook (CAMP-10)
```

### Pattern 1: Tabbed Campaign Detail
**What:** Convert flat campaign detail page to tabbed layout using shadcn/ui Tabs
**When to use:** When a detail page needs multiple distinct content sections
**Example:**
```typescript
// Source: existing pattern in TagExportDialog (tabs.tsx) and MetricsChart (tabs for metric selection)
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Inside CampaignDetailPage, after the header:
<Tabs defaultValue="creatives" className="space-y-4">
  <TabsList>
    <TabsTrigger value="creatives">Creatives</TabsTrigger>
    <TabsTrigger value="analytics">Analytics</TabsTrigger>
    <TabsTrigger value="placements">Placements</TabsTrigger>
  </TabsList>
  <TabsContent value="creatives">
    {/* Existing creative grid, assign button, tracker section */}
  </TabsContent>
  <TabsContent value="analytics">
    <CampaignAnalyticsTab campaignId={id!} />
  </TabsContent>
  <TabsContent value="placements">
    <CampaignPlacementsTab campaignId={id!} creatives={creatives ?? []} />
  </TabsContent>
</Tabs>
```

### Pattern 2: Campaign-Scoped Analytics
**What:** Reuse analytics API with campaignId filter pre-set
**When to use:** Showing analytics for a specific campaign (not global)
**Example:**
```typescript
// Source: analytics-api.ts already supports this
// The useAnalytics hook takes (startDate, endDate, filters?)
// For campaign detail, pass { campaignId: id } as filters
const { data, isLoading } = useAnalytics(start, end, { campaignId })
```

### Pattern 3: Creative Duplication via INSERT
**What:** Copy a creative record with modified fields
**When to use:** CAMP-10 duplicate creative
**Example:**
```typescript
// Source: Supabase INSERT pattern from creatives-api.ts
export async function duplicateCreative(
  sourceId: string
): Promise<Tables<'creatives'>> {
  // 1. Fetch the source creative
  const { data: source, error: fetchError } = await supabase
    .from('creatives')
    .select('*')
    .eq('id', sourceId)
    .single()
  if (fetchError) throw new Error(fetchError.message)

  // 2. Build the duplicate (omit id, created_at, updated_at, preview_token)
  const duplicate: Insertable<'creatives'> = {
    advertiser_id: source.advertiser_id,
    campaign_id: source.campaign_id,
    name: `${source.name} (Copy)`,
    format_id: source.format_id,
    format_name: source.format_name,
    status: 'draft',  // Always reset to draft
    schema_version: source.schema_version,
    template_data: source.template_data,
    rendered_html: source.rendered_html,
    thumbnail_url: source.thumbnail_url,
    width: source.width,
    height: source.height,
  }

  // 3. Insert the duplicate
  const { data, error } = await supabase
    .from('creatives')
    .insert(duplicate)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}
```

### Pattern 4: Inline Tag Copy (Placements Tab)
**What:** Table with one-click copy buttons instead of dialog
**When to use:** When users need to bulk-copy tags for multiple creatives
**Example:**
```typescript
// Source: clipboard pattern from tag-export-dialog.tsx
async function handleCopy(text: string, creativeId: string, tagType: string) {
  try {
    await navigator.clipboard.writeText(text)
    setCopied(`${creativeId}-${tagType}`)
    setTimeout(() => setCopied(null), 2000)
  } catch {
    toast.error('Failed to copy to clipboard')
  }
}
```

### Anti-Patterns to Avoid
- **Querying ad_events directly:** Always use `daily_metrics` rollup table. The ad_events table is partitioned and not suitable for dashboard queries. The `fetchDailyMetrics` API already handles this correctly.
- **Creating new analytics components from scratch:** The existing KpiCards, MetricsChart, DateRangeSelect, and aggregation utilities are battle-tested. Reuse them or compose them, do not rewrite.
- **Duplicating creative trackers during creative copy:** CAMP-10 only duplicates the creative record itself. Tracker assignments (creative_trackers table) should NOT be copied -- the user should assign trackers independently to the copy. This avoids confusion about which trackers fire for which creative.
- **Using a modal/dialog for tag export in Placements tab:** The whole point of the Placements tab is to provide a flat, scannable list with quick copy. Using dialogs defeats the purpose. Use inline copy buttons.
- **Generating new UUIDs client-side:** Let Supabase/PostgreSQL generate UUIDs via `gen_random_uuid()` default on the `id` column. Do not set `id` in the INSERT payload.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date range selection | Custom date picker | `DateRangeSelect` component from `features/analytics/components/` | Already handles 5 preset ranges, no external date lib needed |
| KPI summary cards | Custom metric display | `KpiCards` component from `features/analytics/components/` | Handles formatting, loading skeletons, all 5 metric types |
| Time-series chart | Custom chart from Recharts primitives | `MetricsChart` component from `features/analytics/components/` | Has metric switching tabs, responsive container, tooltip formatting |
| Data aggregation | Manual sum/group logic | `aggregateByDate()` and `aggregateSummary()` from `analytics-types.ts` | Handles CTR calculation, date grouping, null safety |
| Tag generation | Building tag strings inline | `generateDfpTag()` and `generateEmbedTag()` from `tag-generator.ts` | Handles GAM macros, cachebuster, noscript fallback |
| Clipboard copy | Custom clipboard logic | Pattern from `TagExportDialog` (navigator.clipboard.writeText) | Already handles success feedback and error toasts |
| Intraday rollup trigger | Custom rollup logic | `triggerTodayRollup()` from `analytics-api.ts` via `useAnalytics` hook | Non-fatal, scoped to advertiser, already called when date range includes today |

**Key insight:** Phase 12 is almost entirely a composition phase. Every technical building block already exists. The work is structuring the campaign detail page with tabs and wiring existing components/utilities into the new tab panels.

## Common Pitfalls

### Pitfall 1: Forgetting to Pass campaignId Filter to Analytics
**What goes wrong:** Analytics tab shows global metrics instead of campaign-specific data
**Why it happens:** The `useAnalytics` hook's `filters` parameter is optional. If you forget to pass `{ campaignId }`, it returns all metrics for the advertiser.
**How to avoid:** Always pass `{ campaignId }` when using `useAnalytics` within campaign detail context. The analytics API already supports this filter -- `fetchDailyMetrics` line 32: `if (filters?.campaignId) { query = query.eq('campaign_id', filters.campaignId) }`.
**Warning signs:** Analytics tab shows the same numbers as the main Analytics page.

### Pitfall 2: Creative Duplication Missing Fields
**What goes wrong:** Duplicated creative is missing `rendered_html`, `template_data`, or `thumbnail_url`
**Why it happens:** When building the INSERT payload, developer forgets to copy all necessary fields from the source creative.
**How to avoid:** Explicitly copy ALL fields from the creatives Row type: `advertiser_id`, `campaign_id`, `name` (with suffix), `format_id`, `format_name`, `schema_version`, `template_data`, `rendered_html`, `thumbnail_url`, `width`, `height`. Reset `status` to `draft`. Omit: `id`, `created_at`, `updated_at`, `preview_token` (let DB generate new ones).
**Warning signs:** Duplicated creative shows blank preview or missing thumbnail.

### Pitfall 3: Query Cache Invalidation After Duplication
**What goes wrong:** Duplicated creative does not appear in the list until page refresh
**Why it happens:** TanStack Query cache not invalidated for the relevant query keys after mutation.
**How to avoid:** In `useDuplicateCreative` mutation's `onSuccess`, invalidate: `['campaign-creatives', campaignId]`, `['campaigns']` (creative count changed), and `['creatives']` (global creatives list).
**Warning signs:** Creative appears after manual browser refresh but not immediately.

### Pitfall 4: Placements Tab Showing Tags for Draft/Archived Creatives
**What goes wrong:** Tags shown for creatives that cannot serve ads, causing confusion
**Why it happens:** Not filtering by creative status in the placements display.
**How to avoid:** Show all creatives in the placements table, but disable or hide copy buttons for creatives with status `draft` or `archived`. Show a visual indicator (e.g., muted text, tooltip) explaining why tags are unavailable. The existing `TagExportDialog` already checks `creative.status === 'active' || creative.status === 'paused'`.
**Warning signs:** User copies a tag for a draft creative and wonders why it does not serve.

### Pitfall 5: Analytics Tab Performance with Large Date Ranges
**What goes wrong:** Slow loading when user selects 90-day range for a campaign with many creatives
**Why it happens:** Fetching all daily_metrics rows for a campaign can be many rows (creatives x days).
**How to avoid:** The aggregation functions (`aggregateByDate`, `aggregateSummary`) handle this client-side efficiently. The `daily_metrics` table has an index on `(campaign_id, metric_date)` -- see `idx_daily_metrics_campaign_date` in the initial migration. This index ensures fast server-side filtering. No additional optimization needed for v2 scale.
**Warning signs:** N/A -- existing indexes handle this. Only flag if query times exceed 2s.

### Pitfall 6: Tab State Loss When Switching Tabs
**What goes wrong:** User switches from Analytics to Creatives and back, losing their date range selection
**Why it happens:** Tab content unmounts when switching in default Tabs behavior.
**How to avoid:** Two options: (a) lift date range state to the parent `campaign-detail-page.tsx` so it persists across tab switches, or (b) use `forceMount` on TabsContent (shadcn supports this). Option (a) is simpler and recommended.
**Warning signs:** Date range resets to default every time user clicks away and back to Analytics tab.

## Code Examples

Verified patterns from the existing codebase:

### Reusing Analytics Hook for Campaign Context
```typescript
// Source: apps/web/src/features/analytics/hooks/use-analytics.ts
// The hook already accepts filters with campaignId
import { useAnalytics } from '@/features/analytics/hooks/use-analytics'

// Inside CampaignAnalyticsTab:
const { data, isLoading } = useAnalytics(start, end, { campaignId })
// This calls fetchDailyMetrics with the campaign filter
// AND triggers today's rollup if endDate >= today
```

### KPI Cards with Campaign Data
```typescript
// Source: apps/web/src/features/analytics/components/kpi-cards.tsx
// For CAMP-08, the requirement is impressions, clicks, CTR
// KpiCards already shows all five metrics. Use it directly:
import { KpiCards } from '@/features/analytics/components/kpi-cards'
import { aggregateSummary } from '@/features/analytics/lib/analytics-types'

const summary = useMemo(() => aggregateSummary(data ?? []), [data])

<KpiCards
  impressions={summary.impressions}
  clicks={summary.clicks}
  ctr={summary.ctr}
  engagements={summary.engagements}
  totalDwellTimeMs={summary.totalDwellTimeMs}
  loading={isLoading}
/>
```

### Placements Table Row with Copy Buttons
```typescript
// Source: tag-generator.ts + tag-export-dialog.tsx patterns
import { generateDfpTag, generateEmbedTag, getServeBaseUrl } from '../lib/tag-generator'

// For each creative in the campaign:
const serveBaseUrl = getServeBaseUrl()
const dfpTag = generateDfpTag({
  creativeId: creative.id,
  width: creative.width ?? 300,
  height: creative.height ?? 250,
  serveBaseUrl,
})
const embedTag = generateEmbedTag({
  creativeId: creative.id,
  width: creative.width ?? 300,
  height: creative.height ?? 250,
  serveBaseUrl,
})
```

### Creative Duplication Mutation Hook
```typescript
// Source: use-campaigns.ts pattern for mutations
export function useDuplicateCreative() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sourceId: string) => duplicateCreative(sourceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaign-creatives'] })
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      void queryClient.invalidateQueries({ queryKey: ['creatives'] })
    },
  })
}
```

### Tabs Implementation Pattern
```typescript
// Source: apps/web/src/components/ui/tabs.tsx exists (shadcn/ui Tabs)
// Used in: tag-export-dialog.tsx, metrics-chart.tsx, metrics-table.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

<Tabs defaultValue="creatives">
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="creatives">Creatives</TabsTrigger>
    <TabsTrigger value="analytics">Analytics</TabsTrigger>
    <TabsTrigger value="placements">Placements</TabsTrigger>
  </TabsList>
  <TabsContent value="creatives" className="space-y-6">
    {/* ... */}
  </TabsContent>
  <TabsContent value="analytics">
    {/* ... */}
  </TabsContent>
  <TabsContent value="placements">
    {/* ... */}
  </TabsContent>
</Tabs>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Flat campaign detail page | Tabbed layout with Creatives/Analytics/Placements | Phase 12 (this phase) | Better UX: separates creative management, analytics, and tag export into focused views |
| Tag export via dialog per creative | Placements tab with inline copy for all creatives | Phase 12 (this phase) | Faster workflow: copy tags for multiple creatives without opening/closing dialogs |
| Manual creative recreation | Duplicate button with automatic copy | Phase 12 (this phase) | Saves time: one-click duplication preserving all template config |

**Deprecated/outdated:**
- None for this phase. All existing patterns are current and stable.

## Open Questions

1. **Should the Creatives tab remain the default tab?**
   - What we know: Currently the detail page opens to the creative grid. Users primarily come to campaign detail to manage creatives.
   - What's unclear: Whether analytics or placements will become the more frequent use case over time.
   - Recommendation: Keep Creatives as `defaultValue`. It matches existing behavior and is the most commonly needed view.

2. **Should duplicated creatives copy the `rendered_html` field?**
   - What we know: `rendered_html` is the compiled output HTML for serving. The duplicated creative will have the same template_data, so the rendered_html is still valid.
   - What's unclear: Whether the rendered_html references the original creative's ID in any embedded URLs or tracking.
   - Recommendation: Copy `rendered_html` as-is for immediate usability. The user will likely edit the duplicate anyway, which triggers re-rendering. If the rendered_html contains the creative ID in serving URLs, it will need re-rendering -- but since the creative gets a new UUID, the serve endpoint resolves the creative by ID anyway, so the old rendered_html still works as a starting point. Flag for validation during implementation.

3. **Should the Placements tab show per-creative metrics alongside tags?**
   - What we know: CAMP-09 only requires "view and copy ad tags." It does not mention metrics.
   - What's unclear: Whether showing impressions per creative in the placements view would be useful context.
   - Recommendation: Keep Placements tab focused on tags only per CAMP-09 scope. Per-creative metrics can be added to the Analytics tab's breakdown table if needed in a future phase.

## Sources

### Primary (HIGH confidence)
- **Codebase inspection** - Direct reading of all source files listed below
  - `apps/web/src/features/campaigns/pages/campaign-detail-page.tsx` - Current campaign detail structure
  - `apps/web/src/features/campaigns/api/campaigns-api.ts` - Campaign CRUD + creative assignment API
  - `apps/web/src/features/campaigns/hooks/use-campaigns.ts` - TanStack Query hooks for campaigns
  - `apps/web/src/features/campaigns/lib/tag-generator.ts` - DFP and embed tag generation
  - `apps/web/src/features/campaigns/components/tag-export-dialog.tsx` - Tag copy UX pattern
  - `apps/web/src/features/analytics/api/analytics-api.ts` - Analytics API with campaign filter support
  - `apps/web/src/features/analytics/hooks/use-analytics.ts` - Analytics hooks with rollup trigger
  - `apps/web/src/features/analytics/lib/analytics-types.ts` - Types, aggregation, date range utilities
  - `apps/web/src/features/analytics/components/kpi-cards.tsx` - KPI summary cards component
  - `apps/web/src/features/analytics/components/metrics-chart.tsx` - Recharts time-series chart
  - `apps/web/src/features/analytics/components/date-range-select.tsx` - Date range preset selector
  - `apps/web/src/features/analytics/pages/analytics-page.tsx` - Full analytics page pattern
  - `apps/web/src/features/creatives/api/creatives-api.ts` - Creative INSERT pattern for duplication
  - `packages/shared/src/database.types.ts` - Full database type definitions
  - `supabase/migrations/20260219000000_initial_schema.sql` - Schema, indexes, RLS policies
  - `supabase/migrations/20260225000002_analytics_rollup_today.sql` - Intraday rollup function
  - `apps/web/src/router.tsx` - Route `/campaigns/:id` already configured

### Secondary (MEDIUM confidence)
- None needed. All findings verified via direct codebase inspection.

### Tertiary (LOW confidence)
- None. No external research was needed for this phase -- it is entirely a composition of existing infrastructure.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, no new dependencies
- Architecture: HIGH - Tabbed layout pattern proven in existing codebase (TagExportDialog, MetricsChart, MetricsTable all use Tabs)
- Pitfalls: HIGH - Based on direct code reading of all integration points
- Creative duplication: HIGH - Simple INSERT with field copying, pattern matches createCreative in creatives-api.ts

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (stable -- all patterns are internal codebase, no external dependency changes expected)
