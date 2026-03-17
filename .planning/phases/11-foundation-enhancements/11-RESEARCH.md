# Phase 11: Foundation Enhancements - Research

**Researched:** 2026-02-25
**Domain:** Campaign table UI, tracker management page, help/guide page, database schema extensions
**Confidence:** HIGH

## Summary

Phase 11 introduces three distinct feature areas: (1) converting the campaigns list from a card grid to a professional sortable/searchable data table with new date metadata fields, (2) promoting tracker configuration management from an embedded section within campaign detail to a dedicated top-level page with category filtering and full CRUD, and (3) adding a static guide/help page with categorized documentation topics.

The existing codebase is well-structured with established patterns (React Query hooks, Supabase API layer, shadcn/ui components, Zod validation). The campaigns feature currently uses a card-based grid layout (`CampaignCard` + `CampaignList`). Tracker configs are already fully CRUD-capable but live embedded inside the campaign detail page with no category field. Two database migrations are required: adding `advertiser_name`, `start_date`, and `end_date` columns to the `campaigns` table, and adding a `category` column to the `tracker_configs` table.

**Primary recommendation:** Use `@tanstack/react-table` with the existing shadcn/ui `Table` component for the campaigns data table (shadcn's official data-table recipe). Use native HTML date inputs (or add shadcn Popover + Calendar components with `react-day-picker` and `date-fns`) for the campaign date fields. The dedicated trackers page should reuse the existing tracker API/hooks and promote the embedded `TrackerConfigSection` to a full page. The guide page is static content requiring no backend work.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CAMP-05 | Campaign table layout with Name, Advertiser, Last Modified, impressions served | Install @tanstack/react-table; replace CampaignList card grid with DataTable; query daily_metrics SUM for impressions; add advertiser_name to campaigns table |
| CAMP-06 | Search campaigns by name and advertiser | TanStack Table getFilteredRowModel() with global filter or column-level filters on name + advertiser_name |
| CAMP-07 | Set Advertiser Name, Start Date, End Date on campaigns | Database migration: add advertiser_name TEXT, start_date DATE, end_date DATE to campaigns table; extend campaign form dialog with new fields; update shared types |
| TRK-01 | Dedicated Trackers page from sidebar | New route /trackers, new feature folder features/trackers, sidebar nav item with Crosshair icon, reuse existing tracker API/hooks |
| TRK-02 | Filter and search trackers by category and name | Database migration: add category TEXT CHECK to tracker_configs; client-side filtering with category tabs + search input |
| TRK-03 | Create tracker with Name, Category, Type, URL template | Extend tracker form schema with category field; update create/edit dialog; update shared types |
| HELP-01 | Guide/Help page from sidebar | New route /guide, sidebar nav item with BookOpen icon, static React page with content sections |
| HELP-02 | Categorized help topics | Accordion or collapsible sections for 6 categories; static markdown-like content; no backend required |
</phase_requirements>

## Standard Stack

### Core (New Dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-table | ^8 | Headless data table with sorting, filtering, pagination | Official shadcn/ui data-table recipe; already using TanStack Query in project |
| react-day-picker | ^9 | Calendar component for date picker | Required by shadcn/ui Calendar component |
| date-fns | ^4 | Date formatting and manipulation | Required by react-day-picker; lightweight date utility |

### Already Installed (Key for This Phase)

| Library | Version | Purpose | How Used |
|---------|---------|---------|----------|
| @tanstack/react-query | ^5 | Server state management | Campaign/tracker data fetching hooks |
| react-hook-form + zod | ^7 / ^4 | Form handling + validation | Campaign and tracker form dialogs |
| lucide-react | ^0.575 | Icon library | Sidebar icons, table action buttons |
| sonner | ^2 | Toast notifications | CRUD success/error feedback |
| shadcn/ui Table | - | Base table styling primitives | TableHeader, TableBody, TableRow, TableHead, TableCell |

### shadcn Components to Add

| Component | Purpose | Depends On |
|-----------|---------|------------|
| Popover | Date picker wrapper | radix-ui (already installed) |
| Calendar | Date selection inside popover | react-day-picker, date-fns |
| Accordion | Collapsible help topic sections | radix-ui (already installed) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @tanstack/react-table | Manual sort/filter with Array.sort/filter | TanStack gives column visibility, pagination, multi-sort for free; manual is simpler for <5 columns but scales poorly |
| react-day-picker Calendar | Native HTML `<input type="date">` | Native inputs are simpler but offer no custom styling, no popover composition with shadcn, inconsistent across browsers |
| Static help page content | CMS/Markdown file loading | Static inline content is faster to build and sufficient; CMS is overkill for 6 categories |

**Installation:**
```bash
cd apps/web
pnpm add @tanstack/react-table react-day-picker date-fns
pnpm dlx shadcn@latest add popover calendar accordion
```

## Architecture Patterns

### Recommended Project Structure

```
apps/web/src/features/
  campaigns/
    components/
      campaign-list.tsx          # REFACTOR: card grid -> DataTable
      campaign-table-columns.tsx # NEW: TanStack column definitions
      campaign-data-table.tsx    # NEW: reusable DataTable wrapper
      campaign-form-dialog.tsx   # EXTEND: add advertiser_name, start_date, end_date fields
      campaign-card.tsx          # REMOVE or keep as dead code
    api/
      campaigns-api.ts           # EXTEND: fetchCampaignsWithMetrics (join daily_metrics)
    hooks/
      use-campaigns.ts           # EXTEND: useCampaignsWithMetrics hook
  trackers/                      # NEW feature folder
    api/
      trackers-api.ts            # MOVE from campaigns/api/ or import it
    hooks/
      use-trackers.ts            # MOVE from campaigns/hooks/ or import it
    components/
      tracker-list-page.tsx      # NEW: full-page tracker management
      tracker-form-dialog.tsx    # NEW: create/edit with category field
      tracker-table.tsx          # NEW: tracker table with category filter + search
    lib/
      tracker-types.ts           # EXTEND from campaigns/lib/ with category
  guide/                         # NEW feature folder
    pages/
      guide-page.tsx             # NEW: static help content
    data/
      guide-content.ts           # NEW: structured help topic data
```

### Pattern 1: TanStack Table with shadcn/ui (Data Table Recipe)

**What:** Headless table library + shadcn Table primitives for styled, sortable, filterable tables
**When to use:** Any data list that needs column sorting, search filtering, or pagination
**Example:**

```typescript
// campaign-table-columns.tsx
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export type CampaignRow = {
  id: string
  name: string
  advertiser_name: string | null
  status: string
  updated_at: string
  impressions_served: number
}

export const columns: ColumnDef<CampaignRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Name <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
  },
  {
    accessorKey: "advertiser_name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Advertiser <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => row.getValue("advertiser_name") ?? "\u2014",
  },
  {
    accessorKey: "updated_at",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Last Modified <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => new Date(row.getValue("updated_at")).toLocaleDateString(),
    sortingFn: "datetime",
  },
  {
    accessorKey: "impressions_served",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Impressions <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => new Intl.NumberFormat().format(row.getValue("impressions_served")),
  },
]
```

```typescript
// campaign-data-table.tsx
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

export function CampaignDataTable({ columns, data }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
  })
  // ... render with shadcn Table components
}
```

### Pattern 2: Client-Side Category Filtering (Tabs + Search)

**What:** Tab buttons for category filtering combined with text search input
**When to use:** Tracker list with category (Conversion, Impression, Click) + name search
**Example:**

```typescript
// Category filter tabs + search input above the table
const categories = ["All", "Conversion", "Impression", "Click"] as const
const [activeCategory, setActiveCategory] = useState<string>("All")
const [search, setSearch] = useState("")

const filtered = trackers.filter(t => {
  const matchesCategory = activeCategory === "All" || t.category === activeCategory.toLowerCase()
  const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase())
  return matchesCategory && matchesSearch
})
```

### Pattern 3: Static Content Data Structure (Guide Page)

**What:** Typed content objects that drive the guide page rendering
**When to use:** Help/guide pages with categorized topics
**Example:**

```typescript
// guide-content.ts
export interface GuideTopic {
  title: string
  content: string  // Can be JSX string or markdown-like text
}

export interface GuideCategory {
  id: string
  title: string
  icon: LucideIcon
  topics: GuideTopic[]
}

export const GUIDE_CATEGORIES: GuideCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Rocket,
    topics: [
      { title: "Creating Your First Ad", content: "..." },
      { title: "Understanding Ad Formats", content: "..." },
    ],
  },
  // ... 5 more categories
]
```

### Anti-Patterns to Avoid

- **Server-side pagination for small datasets:** Campaign and tracker lists are scoped per-advertiser, unlikely to exceed hundreds of rows. Client-side sorting/filtering with TanStack Table is the right approach. Do NOT add server-side pagination complexity.
- **Splitting tracker API into a separate feature with duplicated code:** The existing tracker API in `campaigns/api/trackers-api.ts` and hooks in `campaigns/hooks/use-trackers.ts` should be REUSED (imported) from the new trackers feature, not duplicated. Consider a shared location or re-export.
- **Over-engineering the guide page:** No CMS, no markdown parsing, no API calls. Static typed data objects rendered with Accordion components are sufficient.
- **Using global TanStack Table filter for category tabs:** Category filtering should be handled via row pre-filtering (array filter) before passing to the table, not via TanStack's column filter, to keep the tab UX clean and independent from table state.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sortable table columns | Custom sort with Array.sort on click | @tanstack/react-table getSortedRowModel() | Multi-column sort, sort direction indicators, sort type detection (string vs number vs date) |
| Table search/filter | Custom filter with useState + array.filter | @tanstack/react-table getFilteredRowModel() with globalFilter | Debounced filtering, fuzzy match support, consistent API |
| Date picker UI | Custom date input with manual calendar | shadcn Popover + Calendar (react-day-picker) | Accessibility, keyboard navigation, locale support, month/year navigation |
| Collapsible help sections | Custom div toggle with useState | shadcn Accordion (Radix) | Animation, accessibility (aria-expanded), keyboard support, consistent styling |

**Key insight:** This phase is heavily UI-focused with minimal backend work. The biggest trap would be hand-rolling table sorting/filtering logic when @tanstack/react-table handles it declaratively, or building custom date inputs when shadcn's Calendar component exists.

## Common Pitfalls

### Pitfall 1: Impressions Data Requires Cross-Table Aggregation
**What goes wrong:** The campaigns table has no `impressions_served` column. Displaying impressions in the campaign table requires joining/aggregating from `daily_metrics`.
**Why it happens:** The campaign data currently only has `name`, `status`, `advertiser_id`, `created_at`, `updated_at`. Impressions live in `daily_metrics` grouped by campaign_id.
**How to avoid:** Two approaches:
1. **Supabase RPC function** that returns campaigns with aggregated impressions (recommended for clean data layer)
2. **Client-side join** - fetch campaigns and daily_metrics separately, then merge in the API layer
The RPC approach is cleaner but requires a database function. The client-side approach is simpler but makes two queries.
**Recommendation:** Use a Supabase query with embedded count or create a simple view/RPC. Example: fetch campaigns, then for each campaign aggregate impressions from daily_metrics. For simplicity, fetch all daily_metrics grouped by campaign_id in one query, then merge client-side.

### Pitfall 2: Tracker Category Column Does Not Exist
**What goes wrong:** TRK-02 requires filtering trackers by category (Conversion, Impression, Click), but the `tracker_configs` table only has `tracker_type` (pixel/script), not `category`.
**Why it happens:** In Phase 7, trackers were designed as generic URL templates with fire conditions. The "category" concept (what the tracker measures) was not part of the original schema.
**How to avoid:** Add a database migration: `ALTER TABLE tracker_configs ADD COLUMN category TEXT NOT NULL DEFAULT 'impression' CHECK (category IN ('conversion', 'impression', 'click'))`. Update the shared types. Add category to the form schema.
**Warning signs:** If you try to filter by a non-existent column, the Supabase query will error.

### Pitfall 3: Campaign Date Fields Don't Exist
**What goes wrong:** CAMP-07 requires `advertiser_name`, `start_date`, and `end_date` on campaigns, but the table only has `name` and `status`.
**Why it happens:** v1.0 campaigns were minimal (name + status lifecycle). Flight dates were deferred.
**How to avoid:** Database migration to add columns. Make them nullable (existing campaigns won't have values). Update shared types and form validation.

### Pitfall 4: Moving Tracker Files Breaks Imports
**What goes wrong:** Creating a new `features/trackers/` folder and moving tracker API/hooks there breaks all existing imports in `features/campaigns/`.
**Why it happens:** The campaign detail page uses `TrackerConfigSection` and `CreativeTrackers` which import from `../api/trackers-api` and `../hooks/use-trackers`.
**How to avoid:** Keep tracker API and hooks in their current location (`features/campaigns/`) and import from there in both the campaigns and trackers features. OR move to a shared location like `features/trackers/` and update all imports. The safest approach is to keep existing files where they are and import them from the new trackers page.

### Pitfall 5: Advertiser Name Confusion
**What goes wrong:** `advertiser_name` on campaigns could be confused with the `advertisers.name` field (the tenant entity).
**Why it happens:** In the original schema, each user belongs to an advertiser (tenant). The `advertiser_name` on campaigns is the client/brand name for that specific campaign (e.g., "Nike" for a Nike campaign run by an agency).
**How to avoid:** Name the column clearly. In the form, label it "Advertiser / Brand Name" to distinguish from the account-level advertiser entity. In the database, use `advertiser_name` on the campaigns table (consistent with the requirement wording).

### Pitfall 6: Search Dialog Needs Updating for New Routes
**What goes wrong:** The global search dialog (`search-dialog.tsx`) has hardcoded platform sections. New routes (/trackers, /guide) won't appear in search.
**Why it happens:** The search dialog defines `platformSections` as a static array.
**How to avoid:** Add Trackers and Guide entries to both `platformSections` in search-dialog.tsx and `platformNavItems` in app-sidebar.tsx when adding the new routes.

## Code Examples

### Database Migration: Campaign Date Fields and Tracker Category

```sql
-- Migration: Add campaign date fields (CAMP-07) and tracker category (TRK-02)

-- Campaign enhancements
ALTER TABLE public.campaigns
  ADD COLUMN advertiser_name TEXT,
  ADD COLUMN start_date DATE,
  ADD COLUMN end_date DATE;

COMMENT ON COLUMN public.campaigns.advertiser_name IS 'Client/brand name for this campaign';
COMMENT ON COLUMN public.campaigns.start_date IS 'Campaign flight start date';
COMMENT ON COLUMN public.campaigns.end_date IS 'Campaign flight end date';

-- Tracker category
ALTER TABLE public.tracker_configs
  ADD COLUMN category TEXT NOT NULL DEFAULT 'impression'
  CHECK (category IN ('conversion', 'impression', 'click'));

COMMENT ON COLUMN public.tracker_configs.category IS 'Tracker category: conversion, impression, or click';

-- Index for category filtering
CREATE INDEX idx_tracker_configs_category ON public.tracker_configs (category);
```

### Updated Shared Types (database.types.ts additions)

```typescript
// campaigns table additions
campaigns: {
  Row: {
    // ... existing fields ...
    advertiser_name: string | null
    start_date: string | null  // DATE in ISO format
    end_date: string | null    // DATE in ISO format
  }
  Insert: {
    // ... existing fields ...
    advertiser_name?: string | null
    start_date?: string | null
    end_date?: string | null
  }
  Update: {
    // ... existing fields ...
    advertiser_name?: string | null
    start_date?: string | null
    end_date?: string | null
  }
}

// tracker_configs table additions
tracker_configs: {
  Row: {
    // ... existing fields ...
    category: string  // 'conversion' | 'impression' | 'click'
  }
  Insert: {
    // ... existing fields ...
    category?: string  // defaults to 'impression'
  }
  Update: {
    // ... existing fields ...
    category?: string
  }
}
```

### Campaigns API: Fetch With Impressions

```typescript
// Fetch campaigns with total impressions from daily_metrics
export async function fetchCampaignsForTable(
  advertiserId: string
): Promise<CampaignTableRow[]> {
  // Fetch campaigns
  const { data: campaigns, error: campError } = await supabase
    .from('campaigns')
    .select('*')
    .order('updated_at', { ascending: false })

  if (campError) throw new Error(campError.message)

  // Fetch aggregated impressions by campaign
  const { data: metrics, error: metError } = await supabase
    .from('daily_metrics')
    .select('campaign_id, impressions_served')
    .eq('advertiser_id', advertiserId)
    .not('campaign_id', 'is', null)

  if (metError) throw new Error(metError.message)

  // Aggregate impressions per campaign
  const impressionMap = new Map<string, number>()
  for (const row of metrics) {
    if (row.campaign_id) {
      impressionMap.set(
        row.campaign_id,
        (impressionMap.get(row.campaign_id) ?? 0) + row.impressions_served
      )
    }
  }

  return campaigns.map(c => ({
    ...c,
    impressions_served: impressionMap.get(c.id) ?? 0,
  }))
}
```

### Sidebar Extension

```typescript
// Add to platformNavItems in app-sidebar.tsx
import { Crosshair, BookOpen } from 'lucide-react'

const platformNavItems: NavItem[] = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Creatives', url: '/creatives', icon: Palette },
  { title: 'Campaigns', url: '/campaigns', icon: Megaphone },
  { title: 'Trackers', url: '/trackers', icon: Crosshair },   // NEW
  { title: 'Analytics', url: '/analytics', icon: BarChart3 },
  { title: 'Billing', url: '/billing', icon: CreditCard },
  { title: 'Guide', url: '/guide', icon: BookOpen },           // NEW
]
```

### Guide Page with Accordion

```typescript
// guide-page.tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { GUIDE_CATEGORIES } from "../data/guide-content"

export default function GuidePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Guide</h1>
        <p className="text-muted-foreground">
          Learn how to use the ScrollToday platform
        </p>
      </div>
      {GUIDE_CATEGORIES.map((category) => (
        <section key={category.id}>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <category.icon className="size-5" />
            {category.title}
          </h2>
          <Accordion type="multiple" className="w-full">
            {category.topics.map((topic, i) => (
              <AccordionItem key={i} value={`${category.id}-${i}`}>
                <AccordionTrigger>{topic.title}</AccordionTrigger>
                <AccordionContent>
                  <div className="prose prose-sm max-w-none text-muted-foreground">
                    {topic.content}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      ))}
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Card grid for campaign list | Data table with sorting/filtering | This phase | Professional campaign management UX |
| Trackers embedded in campaign detail | Dedicated top-level trackers page | This phase | Trackers are accessible without navigating to a specific campaign |
| Campaign has name only | Campaign has advertiser_name + flight dates | This phase | Supports advertiser attribution and campaign scheduling metadata |
| No help documentation | Categorized guide page | This phase | Self-service platform guidance |

**No deprecated/outdated concerns in this domain.** All libraries in the recommended stack are current and actively maintained.

## Open Questions

1. **Impressions aggregation strategy**
   - What we know: daily_metrics has impressions_served per (campaign_id, metric_date). We need total per campaign for the table.
   - What's unclear: Whether to aggregate client-side (two queries) or via RPC/view (one query, requires migration).
   - Recommendation: Client-side aggregation is simpler and avoids another migration. The daily_metrics table is already scoped by RLS, so fetching all rows for the advertiser and aggregating in JS is fine for the expected data volume.

2. **Tracker feature file organization**
   - What we know: Tracker API/hooks currently live in `features/campaigns/`. The new trackers page needs them.
   - What's unclear: Whether to move tracker files to a new `features/trackers/` folder or import from campaigns.
   - Recommendation: Keep existing files in `features/campaigns/` to avoid breaking imports. The new trackers page can import from `@/features/campaigns/api/trackers-api` and `@/features/campaigns/hooks/use-trackers`. Optionally create re-exports in `features/trackers/` for cleaner imports.

3. **Guide page content depth**
   - What we know: HELP-02 specifies 6 categories. The content needs to be useful.
   - What's unclear: How detailed each topic should be. Real documentation vs placeholder text.
   - Recommendation: Write real, concise guidance content (not lorem ipsum). Each topic should be 2-4 sentences explaining the feature. This can be iterated later but should be genuinely helpful from day one.

## Sources

### Primary (HIGH confidence)
- **Existing codebase** - All files read directly: campaigns-api.ts, campaign-list.tsx, campaign-card.tsx, campaign-form-dialog.tsx, tracker-config-section.tsx, trackers-api.ts, use-trackers.ts, tracker-types.ts, initial_schema.sql, tracker_tables.sql, database.types.ts, app-sidebar.tsx, router.tsx, search-dialog.tsx, analytics-api.ts, billing-page.tsx, table.tsx
- **Database schema** - supabase/migrations/20260219000000_initial_schema.sql (campaigns table: no date fields, no advertiser_name)
- **Tracker schema** - supabase/migrations/20260223000001_tracker_tables.sql (no category column)
- **Shared types** - packages/shared/src/database.types.ts (current type definitions)

### Secondary (MEDIUM confidence)
- [shadcn/ui Data Table documentation](https://ui.shadcn.com/docs/components/radix/data-table) - TanStack Table recipe with shadcn Table primitives
- [shadcn/ui Date Picker documentation](https://ui.shadcn.com/docs/components/radix/date-picker) - Popover + Calendar composition using react-day-picker
- [shadcn/ui Calendar documentation](https://ui.shadcn.com/docs/components/radix/calendar) - react-day-picker integration

### Tertiary (LOW confidence)
- None. All findings are verified against codebase and official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using established shadcn/ui patterns with @tanstack/react-table; all verified against official docs
- Architecture: HIGH - Follows existing project patterns (feature folders, React Query hooks, Supabase API layer)
- Database changes: HIGH - Verified current schema lacks required columns; migration pattern is straightforward ALTER TABLE
- Pitfalls: HIGH - Identified through direct codebase inspection; all six pitfalls are verified gaps

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (stable domain, no fast-moving dependencies)
