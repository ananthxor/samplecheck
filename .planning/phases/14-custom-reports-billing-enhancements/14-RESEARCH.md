# Phase 14: Custom Reports & Billing Enhancements - Research

**Researched:** 2026-02-27
**Domain:** React + Supabase — report persistence, billing consumption tables, Excel bulk import with preview
**Confidence:** HIGH

---

## Summary

Phase 14 has no CONTEXT.md, so all decisions are Claude's discretion. The three feature groups are independent of each other in implementation order but share the same stack. All required libraries are already installed (SheetJS 0.20.3, TanStack Table, TanStack Query, date-fns, react-day-picker, shadcn/ui, Zod). No new npm packages are needed.

Custom Reports (RPT-01 through RPT-04) require a new `saved_reports` database table to persist report configurations, a React-side report builder dialog for defining metrics/date range/resolution/name, a "My Reports" page section showing saved reports with search and re-run, and XLS export reusing the existing `exportToXls` pattern from Phase 13. The billing consumption additions (BILL-06 through BILL-09) are purely front-end additions to the existing billing page — they query the already-existing `daily_metrics` + `creatives` tables, compute cost from impressions via `credit_balance` math, and render summary cards plus a paginated per-creative table. The tracker bulk upload (TRK-04) reads an Excel file client-side via SheetJS, validates rows against the `tracker_configs` schema (name, tracker_url, tracker_type, category), shows a preview DataTable before INSERT, and supports downloadable sample templates generated from SheetJS.

**Primary recommendation:** Build in three sequential plans — (1) DB migration + saved_reports table + custom reports UI, (2) billing consumption summary + per-creative table + billing XLS, (3) tracker bulk upload with preview + sample template download.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RPT-01 | User can create a named report with date range, data resolution (hourly/daily), and selected metrics (Impressions, Clicks, CTR, Viewability %) | Requires new `saved_reports` table; builder uses shadcn Dialog + Checkbox/Select; date range via react-day-picker DateRangePicker |
| RPT-02 | User can view and re-run previously saved reports, organized by type (Display / Standard Banner / Tracker / Placement) | Query `saved_reports` table with React Query; re-run = load config → call existing `fetchDailyMetrics`; organize by `report_type` column |
| RPT-03 | User can search saved reports by name | TanStack Table globalFilter on `name` column — pattern already used in `CampaignDataTable` |
| RPT-04 | User can export any report as XLS | Reuse `exportToXls` pattern from `apps/web/src/features/analytics/lib/xls-export.ts` |
| BILL-06 | User can see a consumption summary table showing impressions used and cost by creative type (Creatives, Static, Trackers, Videos) for a selected date range | Query `daily_metrics` + join `creatives.format_id` to bucket by creative type; cost = impressions × rate; no new tables needed |
| BILL-07 | User can see per-creative performance metrics (impressions, clicks, CTR, cost) in a paginated table on the billing page | Query `daily_metrics` grouped by `creative_id`; join `creatives` for name; paginate client-side with TanStack Table `getPaginationRowModel()` |
| BILL-08 | User can filter the billing view by date range | Add a date range preset selector (reuse `DateRangeSelect` from analytics feature) to billing page |
| BILL-09 | User can download a billing statement as XLS | Reuse `exportToXls` pattern; create a new `exportBillingXls` variant for the billing data shape |
| TRK-04 | User can bulk upload trackers via Excel with a preview step before committing, and downloadable sample templates per tracker category | SheetJS `read()` + `utils.sheet_to_json()` for parse; Zod validation per row; preview in shadcn Dialog with DataTable; SheetJS `utils.json_to_sheet()` + `writeFile()` for sample template download |
</phase_requirements>

---

## Standard Stack

### Core (all already installed — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| xlsx (SheetJS) | 0.20.3 | Read Excel files for bulk import; write Excel for export and sample templates | Already installed in Phase 13; `utils.read()`, `utils.sheet_to_json()`, `utils.json_to_sheet()`, `utils.book_new()`, `utils.book_append_sheet()`, `writeFile()` all available |
| @tanstack/react-table | ^8.21.3 | Paginated per-creative table; report search with globalFilter | Already used in `CampaignDataTable`; add `getPaginationRowModel()` for BILL-07 |
| @tanstack/react-query | ^5 | Data fetching + caching for saved reports, billing consumption | Already used project-wide; same `useQuery` / `useMutation` pattern |
| react-day-picker | ^9.13.2 | Date range picker for custom report builder | Already installed; used with shadcn `Popover` + `Calendar` |
| date-fns | ^4.1.0 | Date range computation, formatting | Already installed; used in analytics |
| zod | ^4.3.6 | Validate Excel rows during bulk tracker import | Already used for all form schemas |
| shadcn/ui | (local) | Dialog, Input, Checkbox, Select, Table, Card, Badge, Tabs, Skeleton, Popover, Calendar | All components already present in `apps/web/src/components/ui/` |
| supabase-js | ^2 | `supabase.from('saved_reports').select/insert/delete`, RLS-scoped | Already used everywhere |

### No new packages required

The full Phase 14 stack is already installed. The only deliverables are:
1. A new Supabase migration (new `saved_reports` table + RLS)
2. New React components and hooks following existing patterns

---

## Architecture Patterns

### Recommended New File Structure

```
apps/web/src/features/
├── reports/                          # NEW feature — custom reports
│   ├── api/
│   │   └── reports-api.ts            # CRUD for saved_reports table
│   ├── hooks/
│   │   └── use-reports.ts            # TanStack Query hooks
│   ├── components/
│   │   ├── report-builder-dialog.tsx # RPT-01: create/edit report
│   │   ├── saved-reports-list.tsx    # RPT-02 + RPT-03: list + search
│   │   └── report-export-button.tsx  # RPT-04: XLS export
│   ├── lib/
│   │   ├── report-types.ts           # Types + Zod schema
│   │   └── report-xls-export.ts     # XLS export logic for reports
│   └── pages/
│       └── reports-page.tsx          # /reports route
│
├── billing/                          # EXTEND existing feature
│   ├── api/
│   │   └── billing-api.ts            # ADD: fetchConsumptionSummary, fetchCreativeConsumption
│   ├── hooks/
│   │   └── use-billing-consumption.ts # NEW: consumption hooks
│   ├── components/
│   │   ├── consumption-summary.tsx   # BILL-06: 4-type summary cards
│   │   ├── creative-consumption-table.tsx # BILL-07: paginated per-creative table
│   │   └── billing-export-button.tsx # BILL-09: XLS statement download
│   └── pages/
│       └── billing-page.tsx          # ADD: sections for BILL-06/07/08/09
│
└── trackers/                         # EXTEND existing feature
    └── components/
        ├── tracker-bulk-upload-dialog.tsx # TRK-04: upload + preview dialog
        └── tracker-sample-download.tsx   # TRK-04: download sample template

supabase/migrations/
└── YYYYMMDD_saved_reports.sql        # NEW: saved_reports table + RLS
```

---

### Pattern 1: Saved Reports Table Schema

**What:** `saved_reports` table stores report config as JSONB with indexed columns for filtering by type and searching by name.
**When to use:** Any time user-defined configurations need to be persisted and re-run.

```sql
-- Source: project migration pattern (20260223000001_tracker_tables.sql, 20260219000000_initial_schema.sql)
CREATE TABLE public.saved_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  advertiser_id UUID NOT NULL REFERENCES public.advertisers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('display', 'standard_banner', 'tracker', 'placement')),
  resolution TEXT NOT NULL CHECK (resolution IN ('hourly', 'daily')) DEFAULT 'daily',
  metrics JSONB NOT NULL DEFAULT '["impressions","clicks","ctr","viewability"]',
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for per-advertiser queries and text search
CREATE INDEX idx_saved_reports_advertiser ON public.saved_reports (advertiser_id);
CREATE INDEX idx_saved_reports_name ON public.saved_reports (advertiser_id, name);

-- RLS: same pattern as tracker_configs
ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full access to saved_reports"
ON public.saved_reports FOR ALL TO authenticated
USING ((SELECT public.is_super_admin()))
WITH CHECK ((SELECT public.is_super_admin()));

CREATE POLICY "Users can manage own saved_reports"
ON public.saved_reports FOR ALL TO authenticated
USING (advertiser_id = (SELECT public.get_user_advertiser_id()))
WITH CHECK (advertiser_id = (SELECT public.get_user_advertiser_id()));

-- updated_at trigger (matches existing pattern)
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.saved_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

---

### Pattern 2: Custom Reports API + Hooks

**What:** Standard Supabase direct query + React Query pattern (matches billing-api.ts and analytics-api.ts).
**When to use:** For all `saved_reports` CRUD operations.

```typescript
// Source: apps/web/src/features/billing/api/billing-api.ts pattern
// apps/web/src/features/reports/api/reports-api.ts

import { supabase } from '@/lib/supabase'

export interface SavedReport {
  id: string
  advertiser_id: string
  name: string
  report_type: 'display' | 'standard_banner' | 'tracker' | 'placement'
  resolution: 'hourly' | 'daily'
  metrics: string[]
  date_range_start: string
  date_range_end: string
  created_at: string
  updated_at: string
}

export async function fetchSavedReports(advertiserId: string): Promise<SavedReport[]> {
  const { data, error } = await supabase
    .from('saved_reports')
    .select('*')
    .eq('advertiser_id', advertiserId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data as SavedReport[]
}

export async function createSavedReport(
  payload: Omit<SavedReport, 'id' | 'created_at' | 'updated_at'>
): Promise<SavedReport> {
  const { data, error } = await supabase
    .from('saved_reports')
    .insert(payload)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as SavedReport
}

export async function deleteSavedReport(id: string): Promise<void> {
  const { error } = await supabase.from('saved_reports').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
```

```typescript
// Source: apps/web/src/features/analytics/hooks/use-analytics.ts pattern
// apps/web/src/features/reports/hooks/use-reports.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import { fetchSavedReports, createSavedReport, deleteSavedReport } from '../api/reports-api'
import { toast } from 'sonner'

export function useSavedReports() {
  const { profile } = useAuth()
  return useQuery({
    queryKey: ['saved-reports', profile?.advertiser_id],
    queryFn: () => fetchSavedReports(profile!.advertiser_id!),
    enabled: !!profile?.advertiser_id,
  })
}

export function useCreateReport() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  return useMutation({
    mutationFn: createSavedReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-reports', profile?.advertiser_id] })
      toast.success('Report saved')
    },
    onError: (err: Error) => toast.error(`Failed to save report: ${err.message}`),
  })
}

export function useDeleteReport() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  return useMutation({
    mutationFn: deleteSavedReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-reports', profile?.advertiser_id] })
      toast.success('Report deleted')
    },
  })
}
```

---

### Pattern 3: TanStack Table with Pagination (BILL-07)

**What:** `getPaginationRowModel()` + manual page controls for per-creative billing table.
**When to use:** Any table needing server-side-style pagination but with client-side data (< 10k rows expected).

```typescript
// Source: @tanstack/react-table v8 docs — getPaginationRowModel
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type PaginationState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface CreativeConsumptionRow {
  creativeId: string
  creativeName: string
  impressions: number
  clicks: number
  ctr: number
  cost: number
}

// Inside component:
const [pagination, setPagination] = useState<PaginationState>({
  pageIndex: 0,
  pageSize: 10,
})

const table = useReactTable({
  data: rows,
  columns,
  state: { pagination },
  onPaginationChange: setPagination,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
})

// Pagination controls:
// table.getCanPreviousPage(), table.getCanNextPage()
// table.previousPage(), table.nextPage()
// table.getPageCount(), table.getState().pagination.pageIndex
```

---

### Pattern 4: SheetJS Read + Validate + Preview (TRK-04)

**What:** Read Excel file client-side, validate rows against Zod schema, show in preview table before INSERT.
**When to use:** Any bulk import from Excel with user validation step.

```typescript
// Source: SheetJS 0.20.3 official docs — https://docs.sheetjs.com/docs/api/utilities/array
import { read, utils } from 'xlsx'
import { trackerConfigSchema } from '@/features/campaigns/lib/tracker-types'

interface ParseResult {
  valid: TrackerConfigFormData[]
  errors: { row: number; message: string }[]
}

export function parseTrackerExcel(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer)
      const wb = read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]!]!
      const rows = utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

      const valid: TrackerConfigFormData[] = []
      const errors: { row: number; message: string }[] = []

      rows.forEach((row, i) => {
        const result = trackerConfigSchema.safeParse({
          name: row['Name'] ?? row['name'],
          tracker_url: row['Tracker URL'] ?? row['tracker_url'],
          tracker_type: (row['Type'] ?? row['tracker_type'] ?? 'pixel').toString().toLowerCase(),
          category: (row['Category'] ?? row['category'] ?? 'impression').toString().toLowerCase(),
        })
        if (result.success) {
          valid.push(result.data)
        } else {
          errors.push({ row: i + 2, message: result.error.errors[0]?.message ?? 'Invalid row' })
        }
      })
      resolve({ valid, errors })
    }
    reader.readAsArrayBuffer(file)
  })
}
```

**Sample template download (also with SheetJS):**

```typescript
// Source: SheetJS 0.20.3 official docs — utils.json_to_sheet
import { utils, writeFile } from 'xlsx'

export function downloadTrackerTemplate(category: string): void {
  const sampleData = [
    {
      Name: 'My Tracker Name',
      'Tracker URL': 'https://tracking.example.com/pixel?cb=%%CACHEBUSTER%%',
      Type: 'pixel',
      Category: category,
    },
  ]
  const ws = utils.json_to_sheet(sampleData)
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Trackers')
  writeFile(wb, `tracker-template-${category}.xlsx`)
}
```

---

### Pattern 5: Billing Consumption — Query daily_metrics + Creatives Join

**What:** Client-side aggregation from `daily_metrics` joined to `creatives.format_id` to bucket by creative type. No new tables needed.
**When to use:** BILL-06, BILL-07.

```typescript
// Source: apps/web/src/features/analytics/api/analytics-api.ts pattern + Supabase join syntax

// Fetch daily_metrics with creative format info for consumption view
export async function fetchCreativeConsumption(
  advertiserId: string,
  startDate: string,
  endDate: string
): Promise<CreativeConsumptionRow[]> {
  const { data, error } = await supabase
    .from('daily_metrics')
    .select(`
      creative_id,
      impressions_served,
      impressions_viewable,
      clicks,
      creatives!inner(name, format_id)
    `)
    .eq('advertiser_id', advertiserId)
    .gte('metric_date', startDate)
    .lte('metric_date', endDate)

  if (error) throw new Error(error.message)
  return data
}
```

**Creative type bucketing logic (client-side):**

The `creatives.format_id` values in this project (from `apps/web/src/features/templates/formats/registry.ts`) need to be mapped to the four billing buckets: `Creatives`, `Static`, `Trackers`, `Videos`. Research confirms `format_id` values like `static-banner`, `in-feed`, `animated-banner`, `video-endcard`, `click-to-play`, `countdown`, `carousel`, `multi-frame`, etc. Map video-related format IDs to "Videos", static to "Static", trackers to "Trackers", all other interactive to "Creatives".

**Cost calculation:** Impressions × rate. The project uses `credit_balance` (integer credits, 1 credit = 1 impression served). So cost = `impressions_served` credits consumed. Display as integer credits, not dollars.

---

### Pattern 6: Report Builder Dialog — Metric Checkboxes + Date Range

**What:** shadcn Dialog with Checkboxes for metric selection, shadcn Select for resolution, react-day-picker `DateRange` for date range, Input for report name.
**When to use:** RPT-01.

```typescript
// Source: react-day-picker v9 docs — DateRange type
// Source: apps/web/src/features/trackers/components/tracker-form-dialog.tsx pattern
import type { DateRange } from 'react-day-picker'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// react-day-picker v9 DateRange picker in a Popover:
const [dateRange, setDateRange] = useState<DateRange | undefined>()

// Inside render:
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">
      {dateRange?.from && dateRange?.to
        ? `${format(dateRange.from, 'MMM d')} – ${format(dateRange.to, 'MMM d, yyyy')}`
        : 'Pick date range'}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0">
    <Calendar
      mode="range"
      selected={dateRange}
      onSelect={setDateRange}
      numberOfMonths={2}
    />
  </PopoverContent>
</Popover>
```

---

### Pattern 7: Saved Reports List with Type Tabs + Search

**What:** shadcn Tabs to filter by report_type; TanStack Table globalFilter for name search; re-run triggers query with saved config.
**When to use:** RPT-02, RPT-03.

```typescript
// Source: apps/web/src/features/analytics/components/metrics-table.tsx (tabs pattern)
// Source: apps/web/src/features/campaigns/components/campaign-data-table.tsx (globalFilter pattern)

const REPORT_TYPES = ['all', 'display', 'standard_banner', 'tracker', 'placement'] as const
type ReportTypeFilter = (typeof REPORT_TYPES)[number]

// Filter by type in component state, globalFilter for name search
// Re-run = set parent state (dateRange, metrics, resolution) from report config
// → triggers existing useAnalytics hook with those params
```

---

### Pattern 8: Billing XLS Export (BILL-09)

**What:** Extend existing `exportToXls` pattern for billing data.
**When to use:** BILL-09.

```typescript
// Source: apps/web/src/features/analytics/lib/xls-export.ts (existing pattern)
import { utils, writeFile } from 'xlsx'

export function exportBillingXls(
  consumptionRows: ConsumptionSummaryRow[],
  creativeRows: CreativeConsumptionRow[],
  dateRange: string
): void {
  const today = new Date().toISOString().split('T')[0]!
  const filename = `billing-statement-${dateRange}-${today}`

  // Sheet 1: Consumption Summary by Type
  const summarySheet = utils.json_to_sheet(consumptionRows.map(r => ({
    'Creative Type': r.type,
    'Impressions Used': r.impressions,
    'Credits Consumed': r.credits,
  })))

  // Sheet 2: Per-Creative Performance
  const creativeSheet = utils.json_to_sheet(creativeRows.map(r => ({
    'Creative': r.creativeName,
    'Impressions': r.impressions,
    'Clicks': r.clicks,
    'CTR (%)': r.ctr,
    'Credits': r.cost,
  })))

  const wb = utils.book_new()
  utils.book_append_sheet(wb, summarySheet, 'Consumption Summary')
  utils.book_append_sheet(wb, creativeSheet, 'Per-Creative')
  writeFile(wb, `${filename}.xlsx`)
}
```

---

### Anti-Patterns to Avoid

- **Don't query `ad_events` directly for reports or billing.** The project decision (from Phase 13 and prior) is that all analytics data comes from `daily_metrics` pre-aggregated rollups. `ad_events` is partitioned and designed for write-heavy workloads, not ad hoc reads.
- **Don't build a custom search input.** TanStack Table's `globalFilterFn: 'includesString'` + standard `Input` handles RPT-03 — no custom search component needed.
- **Don't use `react-hook-form` for the report builder.** The report builder has checkbox-group state (selected metrics) that is awkward in RHF. Manage with `useState` arrays; only name field needs validation (min 1 char, validate with Zod `safeParse` manually before submit).
- **Don't try to parse Excel files with native JS.** Excel `.xlsx` files are ZIP archives with XML inside. Only SheetJS handles them correctly, including binary `.xls` files, empty cells, merged cells, and type coercion.
- **Don't use `file-saver` library** for downloads — SheetJS `writeFile()` handles browser download natively without an additional dependency.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Excel file parsing | Custom ArrayBuffer reader | SheetJS `read()` + `sheet_to_json()` | Handles `.xls`, `.xlsx`, empty cells, merged cells, type coercion — hundreds of edge cases |
| Excel file generation | Manual CSV with `.xlsx` extension | SheetJS `json_to_sheet()` + `writeFile()` | Produces valid multi-sheet OOXML workbooks; CSV named .xlsx won't open in Excel |
| Paginated table | Custom prev/next state | TanStack Table `getPaginationRowModel()` | Already installed; handles edge cases (last page partial, page size changes, re-sort resets page) |
| Name-based search | Custom filter function | TanStack Table `globalFilterFn: 'includesString'` | Already used in `CampaignDataTable`; handles unicode, case insensitivity |
| Date range display in dialog | Custom date input parsing | react-day-picker `mode="range"` + shadcn Popover + Calendar | Already installed; handles locale, disabled dates, keyboard nav |
| Row validation on import | Manual string checks | Zod `safeParse()` per row | Reuses existing `trackerConfigSchema` schema; type-safe; good error messages |

**Key insight:** Every "custom" solution here would duplicate either functionality already installed or well-tested library behavior. The entire Phase 14 feature set is building UI and data layer wiring — not infrastructure.

---

## Common Pitfalls

### Pitfall 1: SheetJS `sheet_to_json` Column Header Matching

**What goes wrong:** User uploads a file where the header row uses different casing or spacing than expected (e.g., "tracker url" instead of "Tracker URL"), causing all rows to fail validation with unhelpful errors.
**Why it happens:** `sheet_to_json` uses the first row as-is for object keys. The parser checks exact key matches.
**How to avoid:** Normalize header keys in the parse step — lowercase and trim all keys before mapping to schema fields. Also accept both human-readable ("Tracker URL") and snake_case ("tracker_url") variants.
**Warning signs:** All rows failing with "required" validation errors even though the file visually looks correct.

### Pitfall 2: daily_metrics Has No `creative_type` Column — Must Join creatives

**What goes wrong:** Building billing consumption (BILL-06) by assuming `daily_metrics` has a type column, then discovering at query time there is no such column.
**Why it happens:** `daily_metrics` has `creative_id` but not `format_id`. The format/type info lives in `creatives.format_id`.
**How to avoid:** Use Supabase's PostgREST nested select syntax (`creatives!inner(name, format_id)`) to join in one query. Client-side aggregation then groups by format_id bucket.
**Warning signs:** TypeScript errors when accessing `.format_id` on `DailyMetricRow`.

### Pitfall 3: Supabase Nested Select Returns Embedded Object, Not Flat Fields

**What goes wrong:** Supabase join returns `{ creative_id, impressions_served, creatives: { name, format_id } }` — accessing `row.name` instead of `row.creatives.name` causes undefined.
**Why it happens:** PostgREST embeds joined records as nested objects, not flat column names.
**How to avoid:** Define TypeScript type for the join result explicitly. Access as `row.creatives.name`.
**Warning signs:** `undefined` values in the table when data is clearly present in the network response.

### Pitfall 4: react-day-picker v9 API Changed from v8

**What goes wrong:** Using v8 API patterns (`selected`, `onSelect` with different prop shapes) from older docs or training data when the project has v9.13.2.
**Why it happens:** v9 changed the `DateRange` type shape and how `mode="range"` works.
**How to avoid:** The project has `react-day-picker@^9.13.2` and `date-fns@^4.1.0`. Use the v9 API: `mode="range"`, `selected: DateRange | undefined`, `onSelect: (range: DateRange | undefined) => void`. Import `DateRange` from `react-day-picker`.
**Warning signs:** TypeScript errors on Calendar props; `selected` prop type mismatch.

### Pitfall 5: TanStack Table Pagination `pageIndex` Does Not Reset on Filter Change

**What goes wrong:** User searches in the "My Reports" list while on page 3, filter reduces results to 1 page, but table still shows "Page 3 of 1" and renders empty.
**Why it happens:** TanStack Table does not automatically reset `pageIndex` to 0 when global filter changes.
**How to avoid:** Add an `autoResetPageIndex` or reset pagination state manually when `globalFilter` changes via `table.resetPageIndex()` or by resetting `pageIndex` to 0 in the `onGlobalFilterChange` handler.
**Warning signs:** Empty table after filtering with "Page 3 of 1" or "No results" showing when items exist.

### Pitfall 6: SheetJS `writeFile` on iOS/Safari

**What goes wrong:** `writeFile()` does not trigger a download on older iOS browsers; the call silently fails.
**Why it happens:** iOS Safari historically had restrictions on programmatic downloads. SheetJS has a `bookType: 'xlsx'` + manual `Blob` + `URL.createObjectURL` fallback.
**How to avoid:** This is a LOW risk for an ad platform (primarily desktop users). For v1, `writeFile()` is acceptable. If iOS support matters, use the SheetJS `write()` + `Blob` pattern.
**Warning signs:** Download does not appear on iOS devices.

### Pitfall 7: Metrics JSONB Array — Store as `string[]`, Not Object

**What goes wrong:** Storing selected metrics as `{ impressions: true, clicks: false, ... }` JSONB object, then struggling with partial updates and comparison.
**Why it happens:** Temptation to use an object for checkbox state matches naturally to JSONB.
**How to avoid:** Store as a simple `string[]` array e.g. `["impressions", "clicks", "viewability"]`. Easier to serialize, compare, and display. Zod validates as `z.array(z.string()).min(1)`.
**Warning signs:** Complex update logic when user adds/removes a metric.

---

## Code Examples

### SheetJS Multi-Sheet Workbook Write (for billing export BILL-09)

```typescript
// Source: SheetJS 0.20.3 CDN docs — https://docs.sheetjs.com/docs/api/utilities/array
import { utils, writeFile } from 'xlsx'

const wb = utils.book_new()
const ws1 = utils.json_to_sheet(summaryData)
const ws2 = utils.json_to_sheet(detailData)
utils.book_append_sheet(wb, ws1, 'Summary')
utils.book_append_sheet(wb, ws2, 'Details')
writeFile(wb, 'billing-statement.xlsx')
// Produces a valid .xlsx file with two tabs
```

### TanStack Table with Pagination + Search

```typescript
// Source: @tanstack/react-table v8 — getCoreRowModel, getPaginationRowModel, getFilteredRowModel
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
} from '@tanstack/react-table'

const [globalFilter, setGlobalFilter] = useState('')
const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

const table = useReactTable({
  data,
  columns,
  state: { globalFilter, pagination },
  onGlobalFilterChange: (f) => {
    setGlobalFilter(f)
    setPagination(prev => ({ ...prev, pageIndex: 0 })) // reset page on search
  },
  onPaginationChange: setPagination,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  globalFilterFn: 'includesString',
})
```

### Zod Row Validation for Bulk Import

```typescript
// Source: apps/web/src/features/campaigns/lib/tracker-types.ts (existing schema)
import { trackerConfigSchema } from '@/features/campaigns/lib/tracker-types'

rows.forEach((rawRow, i) => {
  const result = trackerConfigSchema.safeParse({
    name: String(rawRow['Name'] ?? rawRow['name'] ?? '').trim(),
    tracker_url: String(rawRow['Tracker URL'] ?? rawRow['tracker_url'] ?? '').trim(),
    tracker_type: String(rawRow['Type'] ?? rawRow['tracker_type'] ?? 'pixel').toLowerCase(),
    category: String(rawRow['Category'] ?? rawRow['category'] ?? 'impression').toLowerCase(),
  })
  if (!result.success) {
    errors.push({ row: i + 2, message: result.error.errors[0]?.message ?? 'Invalid' })
  } else {
    valid.push(result.data)
  }
})
```

### React Query useMutation for Bulk Insert

```typescript
// Source: apps/web/src/features/billing/hooks/use-billing.ts (mutation pattern)
export function useBulkCreateTrackers() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  return useMutation({
    mutationFn: (rows: TrackerConfigFormData[]) =>
      Promise.all(
        rows.map(row =>
          supabase.from('tracker_configs').insert({
            ...row,
            advertiser_id: profile!.advertiser_id!,
          })
        )
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracker-configs'] })
      toast.success(`${rows.length} trackers imported`)
    },
  })
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact for Phase 14 |
|--------------|------------------|---------------------|
| Separate `file-saver` library for browser downloads | SheetJS `writeFile()` handles natively | No extra package needed |
| TanStack Table v7 (`react-table`) manual `usePagination` plugin | TanStack Table v8 built-in `getPaginationRowModel()` | Already in use; just add pagination model |
| react-day-picker v8 `onDayClick` | react-day-picker v9 `mode="range"` + `onSelect` | Project already on v9.13.2 — use v9 API |
| SheetJS npm registry (0.18.5, stale) | SheetJS CDN tarball (0.20.3, maintained) | Already installed correctly in Phase 13 |

---

## Open Questions

1. **What is the cost rate per impression?**
   - What we know: `credit_balance` on `advertisers` is decremented 1 credit per `impression_served` (from Phase 9 migration comments)
   - What's unclear: Is cost displayed as "X credits consumed" or converted to dollars? The billing page shows "Impression Credits" not dollars — use credits throughout.
   - Recommendation: Display as "credits consumed" (integer, matches existing billing page language). Do not add a dollar-rate conversion unless explicitly requested.

2. **Does "report type" (Display / Standard Banner / Tracker / Placement) filter the data query or just categorize the saved report?**
   - What we know: RPT-02 says reports are "organized by type" — this appears to be a label/categorization applied at save time, not a query filter on the underlying data.
   - What's unclear: Whether report_type should filter what creatives are included in the query.
   - Recommendation: Treat `report_type` as a categorization/label on the saved report config only. The data query always pulls from `daily_metrics` for the advertiser's full set. This is simpler and consistent with how "organized" is used in the requirement.

3. **What format_ids map to which billing bucket (Creatives/Static/Trackers/Videos)?**
   - What we know: `format_id` values include `static-banner`, `in-feed`, `animated-banner`, `video-endcard`, `click-to-play`, `countdown`, `carousel`, `multi-frame`, `accordion`, `flipcard`, `slider`, `cube`, `scratch`, `quiz` (from registry.ts file listing)
   - Recommendation: Video bucket = `['video-endcard', 'click-to-play']`; Static bucket = `['static-banner', 'in-feed']`; Trackers = rows with `tracker_configs` source (no `creative_id`? or separate tracker table); Creatives = all other interactive formats. This mapping should be a constant in `billing-api.ts`.

---

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `apps/web/src/features/analytics/lib/xls-export.ts` — verified SheetJS write pattern
- Codebase inspection: `apps/web/src/features/analytics/api/analytics-api.ts` — verified Supabase query pattern
- Codebase inspection: `apps/web/src/features/campaigns/components/campaign-data-table.tsx` — verified TanStack Table pattern with globalFilter
- Codebase inspection: `apps/web/src/features/billing/api/billing-api.ts` — verified billing query pattern
- Codebase inspection: `supabase/migrations/20260223000001_tracker_tables.sql` — verified RLS + table creation pattern
- Codebase inspection: `apps/web/src/features/campaigns/lib/tracker-types.ts` — verified Zod schema for tracker rows
- Codebase inspection: `apps/web/package.json` — confirmed all packages installed (xlsx 0.20.3, @tanstack/react-table 8.21.3, react-day-picker 9.13.2, date-fns 4.1.0, zod 4.3.6)
- Codebase inspection: `apps/web/src/components/ui/` — confirmed shadcn components available (Dialog, Calendar, Popover, Checkbox, Table, Tabs, Card, Badge, Input, Skeleton, Select)

### Secondary (MEDIUM confidence)
- SheetJS 0.20.3 API: `read()`, `utils.sheet_to_json()`, `utils.json_to_sheet()`, `utils.book_new()`, `utils.book_append_sheet()`, `writeFile()` — verified against official CDN docs structure and confirmed via existing `xls-export.ts` usage in codebase
- TanStack Table v8 `getPaginationRowModel()` — verified against existing `getCoreRowModel()` / `getSortedRowModel()` usage in `campaign-data-table.tsx`; pagination model documented in same package
- react-day-picker v9 `mode="range"` API — project version 9.13.2 confirmed in package.json; `DateRange` type from `react-day-picker` documented in v9 changelog

### Tertiary (LOW confidence — flag for validation if needed)
- Creative type to billing bucket mapping — based on format directory listing (`ls` of templates/formats/`) and inferred semantics; should be confirmed with user before finalizing bucket definitions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages confirmed installed and verified via codebase
- Architecture: HIGH — patterns are direct extensions of existing code in the same project
- Pitfalls: HIGH (pitfalls 1-5) / LOW (pitfall 6 iOS) — derived from actual schema inspection and library version verification
- Open questions: LOW — three interpretation gaps that need product clarification but don't block implementation

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (stable stack; SheetJS and TanStack Table APIs are stable)
