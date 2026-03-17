# Feature Research: ScrollToday v2.0 Enhancements

**Domain:** Self-service digital ad platform -- enhancement milestone
**Researched:** 2026-02-25
**Confidence:** MEDIUM-HIGH (competitor patterns verified via official sites; UX patterns from Google Ad Manager, Airtory, and industry standards; some complexity estimates from training data cross-verified with codebase analysis)

---

## Context: What v1 Already Has

Before detailing v2.0 features, here is what exists and must be extended (not rebuilt):

| v1 Feature | Current State | Relevant Files |
|------------|--------------|----------------|
| Campaign CRUD | Card grid layout, name-only form, status lifecycle | `campaign-list.tsx`, `campaign-card.tsx`, `campaign-form-dialog.tsx` |
| Campaign Detail | Creative assignment grid, tracker config section, tag export | `campaign-detail-page.tsx` |
| Tracker Configs | Advertiser-level library (name, URL, type: pixel/script), creative-tracker assignments with fire conditions | `tracker-config-section.tsx`, `tracker-types.ts` |
| Analytics | KPI cards, time-series line chart (daily), metrics table, date range selector, creative/campaign filters, CSV export | `analytics-page.tsx`, `analytics-types.ts` |
| Billing | Credit balance card, 3 pack tiers, transaction history table | `billing-page.tsx`, `transaction-table.tsx` |
| Database | `daily_metrics` table (daily granularity), `tracker_configs`, `creative_trackers`, `campaigns` (name + status only) | Initial + tracker + billing migrations |
| Sidebar Nav | Dashboard, Creatives, Campaigns, Analytics, Billing, Settings, Admin | `app-sidebar.tsx` |

---

## Feature Area 1: Dedicated Tracker Management Page

### What This Is

A top-level sidebar page (`/trackers`) that serves as the global tracker library for an advertiser. Currently, tracker configs live inside the campaign detail page as a collapsible section -- this elevates trackers to a first-class entity.

### How Ad Platforms Handle This

**Airtory** provides "Ad Trackers" as a top-level concept with built-in impression, click, engagement, and conversion trackers. Trackers are inbuilt into ads and also available as standalone solutions. Their tracker page classifies by purpose: Impression Trackers, Click Trackers, Engagement Trackers, Conversion Trackers.

**Google Campaign Manager 360 (CM360)** treats trackers as "Floodlight activities" organized into groups. Impression and click tags are generated per placement. Trackers are scoped per advertiser with type-based filtering.

**RedTrack / Voluum / PeerClick** provide dedicated tracker management interfaces with full CRUD, bulk operations, and filtering by tracker type, status, and associated campaigns.

### Expected Behavior and UX

| Element | Expected Implementation | Complexity | Notes |
|---------|------------------------|------------|-------|
| Top-level sidebar entry | "Trackers" with Crosshair icon between Campaigns and Analytics | LOW | Add to `platformNavItems` array, new route `/trackers` |
| Tracker type taxonomy | Expand from `pixel`/`script` to `Conversion`/`Impression`/`Click` (purpose-based categories) | LOW | New enum or text values on `tracker_configs.tracker_type`. Note: this is a schema change -- v1 has `pixel`/`script` which is delivery mechanism, not purpose. v2 adds purpose-based categorization. |
| Table layout | Full-width table with columns: Name, URL (truncated), Type (badge), Fire Condition, Created Date, Actions | LOW | Replace the compact list in `TrackerConfigSection` with a proper `DataTable` |
| Filter by type | Dropdown or tabs to filter: All / Conversion / Impression / Click | LOW | Client-side filter on the loaded list |
| Bulk upload via Excel | Parse XLS/XLSX file with columns (Name, URL, Type) and create multiple tracker configs in one operation | MEDIUM | Requires SheetJS (`xlsx` package) for parsing, validation of each row, batch insert API |
| Search | Text search across tracker name and URL | LOW | Client-side filter with debounced input |
| Inline edit | Click tracker row to edit name/URL/type in a dialog | LOW | Reuse existing form pattern from `CampaignFormDialog` |
| Usage indicator | Show count of creatives using each tracker | LOW | Join `creative_trackers` to get count per `tracker_config_id` |

### Dependencies on v1

- Extends `tracker_configs` table (schema change for type taxonomy)
- Extends `TrackerConfigSection` component (extract and promote to standalone page)
- Existing `useTrackerConfigs`, `useCreateTrackerConfig`, `useDeleteTrackerConfig` hooks are reusable
- Needs new `useUpdateTrackerConfig` hook (v1 only has create + delete, no edit)

### Tracker Type Taxonomy Change

The v1 tracker_type column uses delivery mechanism values (`pixel`, `script`). The v2 requirement asks for purpose-based categories (`Conversion`, `Impression`, `Click`). The recommended approach:

- Add a new `tracker_category` column (TEXT, values: `conversion`, `impression`, `click`)
- Keep `tracker_type` for delivery mechanism (`pixel`, `script`)
- Default `tracker_category` to `impression` for existing records
- Filter UI uses `tracker_category`; create form exposes both category and type

---

## Feature Area 2: Campaign Enhancements

### What This Is

Multiple improvements to campaigns: upgrade list from card grid to data table, add metadata fields (advertiser name, flight dates), add per-campaign analytics and placements tabs, and support creative duplication.

### How Ad Platforms Handle This

**Campaign Table Layout (industry standard):**
Every major ad platform (Google Ads, Meta Ads Manager, DV360, Airtory) uses a data table as the primary campaign view -- not cards. Tables provide scannability across many campaigns with sortable columns. Cards work for small counts; tables scale.

Typical columns: Campaign Name, Status, Advertiser/Brand, Start Date, End Date, Impressions, Clicks, CTR, Spend, Last Modified. Most platforms support column sorting and inline status indicators.

**Per-Campaign Analytics Tab:**
Airtory provides per-campaign analytics accessible from the campaign detail page -- you can see performance metrics scoped to that specific campaign's creatives. This is a drill-down pattern: global analytics page provides cross-campaign view, campaign detail provides scoped view.

**Placements Tab (Tag Management):**
In CM360, a "placement" represents a specific ad slot on a publisher site, with its own tag. The pattern is: Campaign -> Creatives -> Placements. Each placement has a generated tag. In ScrollToday's context (no publisher model), "Placements" = the set of generated tags/embed codes for each creative in a campaign. This is a tag management view -- a table of creatives with their tag status, copy-tag actions, and tag type (DFP/embed/direct).

**Creative Duplication:**
Meta's Ad Copies API (updated May 2025) allows duplicating ads with the ability to modify creative fields during duplication. The standard UX is: "Duplicate" action on a creative -> copy all template_data, name becomes "[Original Name] (Copy)", status resets to `draft`, new UUID. This is a common pattern across all ad platforms.

### Expected Behavior and UX

#### 2a. Campaign Table Layout

| Element | Expected Implementation | Complexity | Notes |
|---------|------------------------|------------|-------|
| Table view | Replace card grid with shadcn/ui DataTable (TanStack Table) | MEDIUM | Columns: Name, Advertiser, Status, Impressions Served, Creatives, Last Modified |
| Impressions counter | Sum of `impressions_served` from `daily_metrics` for the campaign | LOW | Join or subquery on campaign load; show formatted number |
| Search bar | Filter by campaign name and advertiser name | LOW | Client-side debounced filter |
| Sort columns | Sort by name, status, impressions, last modified | LOW | TanStack Table built-in sorting |
| Row click navigation | Click row to navigate to campaign detail page | LOW | Router navigation on row click |

#### 2b. Campaign Metadata Fields

| Element | Expected Implementation | Complexity | Notes |
|---------|------------------------|------------|-------|
| Advertiser Name field | Text field on campaign form; stored in `campaigns` table | LOW | New column `advertiser_name TEXT` -- note: this is distinct from the `advertisers.name` (account name). This is the brand/client name for the campaign. |
| Start Date / End Date | Date picker fields on campaign form | LOW | New columns `start_date DATE`, `end_date DATE` -- nullable, informational only (v1 does not auto-start/stop campaigns by date) |
| Display in table | Show in campaigns table columns | LOW | Already part of table layout work |

#### 2c. Per-Campaign Analytics Tab

| Element | Expected Implementation | Complexity | Notes |
|---------|------------------------|------------|-------|
| Tab UI on campaign detail | Add Tabs component: "Creatives" (existing grid) and "Analytics" (new) | MEDIUM | Use shadcn/ui Tabs. Creatives tab shows existing creative grid. Analytics tab shows scoped dashboard. |
| Scoped KPI cards | Same KPI cards as global analytics but filtered to campaign_id | LOW | Reuse `KpiCards` component with campaign-scoped data |
| Scoped time-series chart | Same chart but filtered to campaign_id | LOW | Reuse `MetricsChart` component |
| Scoped metrics table | Per-creative breakdown within the campaign | LOW | Reuse `MetricsTable` with campaign filter |
| Date range selector | Same date range control as global analytics | LOW | Reuse `DateRangeSelect` |

#### 2d. Per-Campaign Placements Tab

| Element | Expected Implementation | Complexity | Notes |
|---------|------------------------|------------|-------|
| Placements tab | Third tab on campaign detail: table of all creatives with tag management | MEDIUM | Table columns: Creative Name, Format, Size, Status, Tag Status (generated/not), Actions |
| Tag copy actions | One-click copy for DFP tag, embed tag, direct tag per creative | LOW | Reuse existing `TagExportDialog` or inline copy buttons |
| Bulk tag download | Download all campaign tags as a single text/CSV file | LOW | Concatenate tags for all creatives, trigger download |
| Tag preview | Show rendered tag snippet inline or in expandable row | LOW | Code block with syntax highlighting |

#### 2e. Creative Duplication

| Element | Expected Implementation | Complexity | Notes |
|---------|------------------------|------------|-------|
| Duplicate button | "Duplicate" action in creative card menu and detail page | LOW | New API: copy creative row, reset status to `draft`, append " (Copy)" to name, new UUID |
| Duplicate within campaign | Duplicated creative stays in the same campaign | LOW | Copy `campaign_id` from source |
| Confirmation | No confirmation needed -- instant action with toast "Creative duplicated" | LOW | Standard UX: duplicate is non-destructive, no confirmation required |

### Dependencies on v1

- `campaigns` table needs new columns: `advertiser_name`, `start_date`, `end_date`
- `CampaignFormDialog` needs expanded form with new fields
- `campaign-list.tsx` replaced with table component
- `campaign-detail-page.tsx` refactored from flat layout to tabbed layout
- Analytics reusable components (`KpiCards`, `MetricsChart`, `MetricsTable`) need to accept campaign filter
- New `duplicateCreative` API function and `useDuplicateCreative` hook

---

## Feature Area 3: Analytics Enhancements

### What This Is

Extend the existing analytics dashboard with hourly granularity, lifetime totals, creative share pie chart, platform/device breakdown, and chart image export.

### How Ad Platforms Handle This

**Hourly Breakdown:**
Google Ad Manager supports "Hour" as a reporting dimension. The pattern is: when the date range is a single day or "Today", show hourly granularity on the chart. When the range spans multiple days, show daily granularity. This is standard progressive resolution -- zoom in for detail, zoom out for trends.

**Lifetime Totals:**
Most platforms show an "All Time" or "Lifetime" summary section alongside period-specific data. This is typically a row of large-format KPI numbers at the top of the page showing cumulative totals since account creation. Separate from period-filtered KPIs.

**Creative Share Pie/Donut Chart:**
Common pattern: show impression distribution across creatives as a pie or donut chart. Top 5-7 creatives shown individually, remainder grouped as "Other". Airtory and DV360 both provide creative-level breakdowns. The donut variant with a center label ("Total Impressions") is the standard modern approach.

**Platform/Device Breakdown:**
Google Analytics and all ad platforms segment by device type: Desktop, Mobile, Tablet. The standard visualization is either a horizontal bar chart or a donut chart. ScrollToday's `ad_events.extra_data` JSONB field stores device info from the ad SDK's identity/context layer (DATA-04, completed in Phase 8). The device_type is already captured -- it just needs to be surfaced in the dashboard.

### Expected Behavior and UX

| Element | Expected Implementation | Complexity | Notes |
|---------|------------------------|------------|-------|
| Hourly breakdown chart | When date range = single day or "Today", show 24 data points (hours 0-23). When multi-day, show daily (existing). | MEDIUM | Requires new query: aggregate by hour from `ad_events` (not daily_metrics which is daily). Create `rollup_hourly_metrics` function or query raw events for single-day view. |
| Lifetime totals section | New section above period-filtered KPIs showing all-time cumulative totals | LOW | Query `daily_metrics` without date filter (`SUM` across all dates for advertiser). Display as large-format numbers in a distinct card row. |
| Pie/donut chart by creative share | Donut chart showing impression distribution by creative | MEDIUM | Aggregate `daily_metrics` by `creative_id` within date range. Top 7 creatives + "Other" bucket. Use Recharts `PieChart` with `innerRadius` for donut. |
| Platform breakdown (Desktop/Mobile/Tablet) | Donut or bar chart showing device type distribution | MEDIUM | Requires querying `ad_events.extra_data` for device_type field. May need new rollup column or separate aggregation query. |
| PNG download per chart | Button on each chart to download as PNG image | LOW | Use `recharts-to-png` (wraps html2canvas) or direct html2canvas on chart container ref. |
| XLS export of full analytics | Button to download complete analytics report as XLSX | MEDIUM | Use SheetJS (`xlsx` package). Export KPIs, daily/hourly data, creative breakdown, and device breakdown as separate sheets in one workbook. |

### Dependencies on v1

- `daily_metrics` table stores daily granularity only -- hourly breakdown needs either a new `hourly_metrics` table/function or direct query against `ad_events` (slower but avoids new rollup complexity)
- `ad_events.extra_data` already captures device info from Phase 8 ad SDK -- needs extraction query
- Recharts is already installed and used for `MetricsChart`
- New packages needed: `xlsx` (SheetJS) for XLS export, `recharts-to-png` or `html2canvas` for PNG export
- `analytics-types.ts` needs new types: `HourlyDataPoint`, `CreativeShareData`, `DeviceBreakdownData`
- `analytics-api.ts` needs new query functions

### Hourly Data Strategy

Two approaches, recommendation first:

1. **Query raw `ad_events` for single-day hourly view (RECOMMENDED):** When user selects a single day, query `ad_events` with `date_trunc('hour', event_timestamp)` grouping. This is acceptable performance for single-day queries on a partitioned table. Avoids new rollup infrastructure.

2. **Create `hourly_metrics` rollup table:** Pre-aggregate hourly. Adds storage and rollup complexity. Only justified at high event volumes (100k+ events/day per advertiser). Premature for v2.

---

## Feature Area 4: Custom Reports

### What This Is

A dedicated `/reports` page where users can create, save, and re-run named reports with configurable metrics, date ranges, data resolution, report types, and XLS export.

### How Ad Platforms Handle This

**Google Ad Manager** is the gold standard for report builders in ad tech:
- Users select dimensions (Time, Creative, Campaign, Placement) and metrics (Impressions, Clicks, CTR, etc.)
- Date range with presets and custom range
- Resolution: Hourly, Daily, Weekly, Monthly
- Reports can be saved with a name for re-use
- Reports can be scheduled (daily/weekly/monthly auto-run)
- Export formats: CSV, XLS, XLSX, Google Sheets
- Up to 10 dimensions and metrics per report

**Airtory** provides campaign-level reports with breakdowns by creative and format type. Less customizable than GAM but simpler.

**ReportGarden / Reporting Ninja** provide white-label report builders for agencies with drag-and-drop metric selection, templates, and multi-format export.

### Expected Behavior and UX

| Element | Expected Implementation | Complexity | Notes |
|---------|------------------------|------------|-------|
| Reports page | New top-level sidebar entry `/reports` with FileSpreadsheet icon | LOW | Route + page component |
| Saved reports list | Table showing saved reports: Name, Report Type, Date Range, Resolution, Created, Last Run, Actions | LOW | New `saved_reports` table in database |
| Create report form | Multi-step or single-page form: Name, Report Type, Metrics, Date Range, Resolution | MEDIUM | Form with checkboxes for metrics, dropdowns for type/resolution |
| Report types | Display, Standard Banner, Tracker, Placement -- filter which data dimensions are available | MEDIUM | Each type scopes the available metrics and dimensions differently |
| Metric selection | Checkboxes: Impressions, Viewable Impressions, Clicks, CTR, Engagements, Dwell Time, Video Plays, Video Completes | LOW | Maps to columns in `daily_metrics` table |
| Data resolution | Radio/dropdown: Hourly, Daily | LOW | Hourly uses `ad_events` query, Daily uses `daily_metrics` |
| Report preview | Table showing report results after "Run" | MEDIUM | Dynamic column rendering based on selected metrics |
| XLS export | Download report as XLSX with formatting | MEDIUM | SheetJS with header styling, column widths, number formatting |
| Save for re-use | Save report configuration (not results) with a name | LOW | Insert into `saved_reports` table with JSONB config column |
| Re-run saved report | Click saved report to re-run with current data | LOW | Load config, execute query, display results |

### Report Types Breakdown

| Report Type | Dimensions | Typical Metrics | Data Source |
|-------------|-----------|-----------------|-------------|
| Display (All) | Date, Creative, Campaign | All metrics | `daily_metrics` |
| Standard Banner | Date, Creative (filtered to standard formats) | Impressions, Clicks, CTR | `daily_metrics` WHERE creative format IN standard formats |
| Tracker | Date, Tracker Config, Fire Condition | Fire count per tracker | `creative_trackers` + `ad_events` with tracker event data |
| Placement | Date, Creative, Campaign | Impressions, Clicks per tag/placement | `daily_metrics` grouped by creative (each creative = one placement in v1) |

### Dependencies on v1

- New database table: `saved_reports` (id, advertiser_id, name, report_type, config JSONB, created_at, updated_at)
- RLS policies matching existing advertiser-scoped pattern
- Reuses existing `daily_metrics` query infrastructure
- Tracker reports may need additional data from `creative_trackers` joined with `ad_events`
- SheetJS (`xlsx`) package (shared with analytics XLS export)

---

## Feature Area 5: Billing Enhancements

### What This Is

Extend the billing page with spend/consumption summaries broken down by creative type, a per-creative performance table with pagination, date filtering, and download capability.

### How Ad Platforms Handle This

**Prepaid credit platforms** (Airtory model: CPM-based, no monthly commitment) show:
- Credit balance (already in v1)
- Consumption summary: how credits were spent, broken down by creative type/format
- Per-creative spend: table showing each creative, impressions served, credits consumed
- Date range filter: see spending for a specific period
- Download: export spending report for accounting/invoicing

**Standard billing dashboard pattern:**
1. Balance card (exists)
2. Spend summary cards (new): total spent, avg daily spend, projected depletion
3. Spend by creative type: bar or pie chart showing which ad formats consumed the most credits
4. Per-creative table: paginated table with Creative Name, Format, Impressions, Credits Used, CTR, Status
5. Date filter: period selector matching analytics date ranges
6. Download: CSV or XLS of spend data

### Expected Behavior and UX

| Element | Expected Implementation | Complexity | Notes |
|---------|------------------------|------------|-------|
| Spend/consumption summary | Card row: Total Spent (credits), Avg Daily Spend, Active Creatives, Projected Depletion Date | MEDIUM | Derive from `daily_metrics` impressions (1 impression = 1 credit consumed). Sum impressions_served = credits spent. |
| Spend by creative type chart | Bar or pie chart: credits consumed grouped by `format_id` family (Interactive, Animated, Standard) | MEDIUM | Aggregate `daily_metrics` by creative -> join creatives table for format_id -> group by format family |
| Per-creative performance table | Paginated table: Creative Name, Format, Campaign, Impressions (= Credits Used), Clicks, CTR, Status | MEDIUM | Join `daily_metrics` with `creatives`, aggregate per creative, paginate client-side or server-side |
| Pagination | 10-20 rows per page with page controls | LOW | TanStack Table with pagination state |
| Date range filter | Same date range presets as analytics page | LOW | Reuse `DateRangeSelect` component |
| Download spend report | Download as CSV or XLS | LOW | Reuse SheetJS export utility |

### Credit Accounting Note

In ScrollToday's prepaid model, 1 impression = 1 credit. Therefore:
- `impressions_served` from `daily_metrics` = credits consumed
- Total spend = SUM(impressions_served) for the period
- No separate "spend" tracking is needed -- impressions ARE the spend metric
- This simplifies the billing enhancement significantly: it is essentially an analytics view filtered to consumption metrics

### Dependencies on v1

- No new tables needed -- all data derivable from `daily_metrics` + `creatives` joins
- Extends `billing-page.tsx` with new sections
- Reuses `DateRangeSelect` from analytics
- Needs TanStack Table for paginated creative table (same as campaigns table)
- SheetJS for XLS export (shared dependency)

---

## Feature Area 6: Guide/Help Page

### What This Is

A `/guide` page accessible from the sidebar that provides categorized help content about using the platform.

### How Ad Platforms Handle This

**ad:personam DSP** structures their help center into 9 categories with 61 articles:
1. General (1 article) - platform overview
2. Ad Creatives (17 articles) - format specs, tracking implementation
3. Advertiser Setup (8 articles) - account config, pixel setup
4. Billing & Payments (4 articles) - credit management, payment methods
5. Data Marketplace (12 articles) - audience targeting
6. Setup Campaigns (9 articles) - per-channel guides
7. Supply (3 articles) - inventory selection
8. Reporting (5 articles) - dashboard and analytics
9. Troubleshooting (2 articles) - common issues

**Airtory** uses a Zendesk-powered knowledge base at docs.airtory.com organized around: Airtory Ads (main), Studio Guide, Campaign Guide, Reporting Guide.

**Common pattern for self-serve ad platforms:**
- Getting Started (onboarding flow, first ad creation)
- Creating Ads (template selection, editor, customization)
- Campaign Management (creating campaigns, assigning creatives, status lifecycle)
- Ad Serving (tags, embed codes, DFP integration)
- Trackers (setting up tracking, fire conditions)
- Analytics (reading dashboards, metrics glossary, exporting data)
- Billing (purchasing credits, understanding consumption)
- FAQ / Troubleshooting (common issues)

### Expected Behavior and UX

| Element | Expected Implementation | Complexity | Notes |
|---------|------------------------|------------|-------|
| Sidebar entry | "Guide" with BookOpen icon, below Billing in sidebar | LOW | New route `/guide` |
| Category-based layout | Accordion or card grid of help categories | LOW | Static content page -- no database, just JSX/MDX |
| Content approach | Hardcoded content in components, not CMS | LOW | For an invite-only platform with <100 users, a CMS is overkill. Static JSX content is appropriate. Upgrade to CMS later if needed. |
| Search | Client-side search across all help content | LOW | Filter displayed sections by search query |
| Categories (recommended) | Getting Started, Creating Ads, Campaign Management, Ad Tags & Serving, Trackers, Analytics & Reports, Billing & Credits, FAQ | LOW | 8 categories, 3-5 articles per category |
| Article format | Title, body text, optional screenshot/image, step-by-step instructions | LOW | Use shadcn/ui Accordion for collapsible Q&A or Card layout for category browsing |
| Contact support link | Email link or contact form reference at bottom | LOW | Simple mailto link or placeholder |

### Content Volume Estimate

| Category | Estimated Articles | Content Type |
|----------|-------------------|--------------|
| Getting Started | 3-4 | Onboarding walkthrough, first ad guide |
| Creating Ads | 4-5 | Template selection, editor usage, preview, save |
| Campaign Management | 3-4 | Campaign creation, creative assignment, status management |
| Ad Tags & Serving | 3-4 | Tag types, DFP setup, embed codes, testing |
| Trackers | 2-3 | Tracker setup, fire conditions, bulk upload |
| Analytics & Reports | 3-4 | Dashboard guide, metrics glossary, export |
| Billing & Credits | 2-3 | Credit purchase, consumption, transaction history |
| FAQ | 4-5 | Common questions, troubleshooting |
| **Total** | **24-32 articles** | Static JSX content |

### Dependencies on v1

- No database changes
- New sidebar entry + route
- Standalone feature module (`features/guide/`)
- No external dependencies beyond existing UI components

---

## Table Stakes vs. Differentiators vs. Anti-Features

### Table Stakes (Users Expect These in v2)

Features that close gaps versus Airtory and make the platform feel complete.

| Feature | Why Expected | Complexity | Priority |
|---------|--------------|------------|----------|
| Campaign table layout | Every ad platform uses tables for campaign lists; cards do not scale past 10 campaigns | MEDIUM | P1 |
| Campaign search | Users with 5+ campaigns need to find specific ones quickly | LOW | P1 |
| Per-campaign analytics | Airtory scopes analytics per campaign; users expect this drill-down | MEDIUM | P1 |
| Creative duplication | Standard in every ad builder; users expect to clone and iterate on creatives | LOW | P1 |
| Lifetime analytics totals | Users want cumulative metrics, not just period-specific | LOW | P1 |
| XLS export (analytics + reports) | CSV exists in v1; XLS is the expected format for business reporting and accounting | MEDIUM | P1 |
| Guide/Help page | Self-serve platforms must be self-documenting; no support team at ScrollToday's scale | LOW | P1 |
| Dedicated Tracker page | Trackers buried in campaign detail are undiscoverable; need top-level access | LOW | P1 |

### Differentiators (Set ScrollToday Apart)

Features that go beyond closing gaps and create actual preference.

| Feature | Value Proposition | Complexity | Priority |
|---------|-------------------|------------|----------|
| Hourly analytics breakdown | Shows intraday performance trends; most lightweight ad platforms only offer daily | MEDIUM | P1 |
| Custom Reports with saved configs | Enables repeatable reporting workflows; uncommon in self-serve platforms at this price point | MEDIUM | P2 |
| Bulk tracker upload via Excel | Agencies managing many trackers can import their sheet instead of manual entry one-by-one | MEDIUM | P2 |
| Per-creative spend table in Billing | Directly connects spend to creative performance; most platforms separate billing from analytics | MEDIUM | P2 |
| Platform/device breakdown | Shows Desktop vs Mobile vs Tablet distribution; actionable for creative optimization | MEDIUM | P2 |
| Creative share pie/donut chart | Visual breakdown of which creatives drive the most impressions | MEDIUM | P2 |
| PNG chart download | Quick screenshot for stakeholder presentations without manual screenshotting | LOW | P2 |
| Placements tab (tag management) | Centralizes all tags for a campaign in one view; streamlines publisher operations | MEDIUM | P2 |

### Anti-Features (Do NOT Build in v2)

Features that might seem natural but add complexity without proportional value.

| Anti-Feature | Why It Seems Good | Why Avoid in v2 | Alternative |
|--------------|-------------------|-----------------|-------------|
| Scheduled reports (auto-run daily/weekly) | GAM has it, feels professional | Requires cron/scheduler infrastructure, email delivery, retry logic -- heavy for <100 users | Users re-run saved reports manually; add scheduling in v3 when user volume justifies it |
| Real-time analytics (WebSocket streaming) | "Real-time" sounds impressive on marketing page | Massive infrastructure overhead (WebSocket server, event streaming, client state sync). Refresh-based is fine for v2 scale. | Keep refresh-on-load pattern; add 30s auto-refresh toggle if needed |
| Multi-sheet custom dashboards | Some platforms allow users to create their own dashboard layouts | Dashboard builder is a product in itself (drag-and-drop, widget library, layout persistence). Way beyond v2 scope. | Provide good defaults in the analytics page and flexible custom reports |
| Campaign scheduling (auto-start/stop by date) | Start/End date fields suggest automation | Date-based auto-start/stop requires scheduling infrastructure (cron, timezone handling, state transitions). v2 adds dates as informational metadata only. | Show dates as informational. Users manually activate/pause. Add automation in v3. |
| Tracker firing analytics | "Which trackers fired how many times?" | Requires capturing tracker fire events server-side, which means modifying the ad SDK to report tracker fires back. Different from ad event tracking. | Show tracker assignment counts (how many creatives use each tracker). Actual fire analytics deferred. |

---

## Feature Dependencies

```
[Dedicated Tracker Page]
    requires -> tracker_configs table (exists)
    requires -> tracker_category column (new migration)
    requires -> sidebar entry + route (new)
    optional -> bulk upload requires SheetJS (xlsx package)

[Campaign Table Layout]
    requires -> campaigns table (exists)
    requires -> TanStack Table component
    requires -> daily_metrics join for impressions counter

[Campaign Metadata Fields]
    requires -> campaigns table schema change (advertiser_name, start_date, end_date)
    requires -> CampaignFormDialog update

[Per-Campaign Analytics Tab]
    requires -> Campaign Detail page (exists)
    requires -> analytics components (KpiCards, MetricsChart, MetricsTable -- exist)
    requires -> analytics API scoped to campaign_id (exists in v1 API)

[Per-Campaign Placements Tab]
    requires -> Campaign Detail page (exists)
    requires -> tag-generator utilities (exist)
    requires -> TagExportDialog (exists)

[Creative Duplication]
    requires -> creatives CRUD API (exists)
    requires -> new duplicateCreative API function

[Hourly Analytics]
    requires -> ad_events table (exists, partitioned)
    requires -> new hourly aggregation query function
    requires -> MetricsChart update for hourly x-axis

[Lifetime Totals]
    requires -> daily_metrics (exists)
    requires -> new unfiltered aggregation query

[Pie/Donut Charts]
    requires -> Recharts PieChart (already available in Recharts package)
    requires -> daily_metrics aggregated by creative_id

[Platform Breakdown]
    requires -> ad_events.extra_data device_type field (captured in Phase 8)
    requires -> new aggregation query on extra_data

[PNG Chart Download]
    requires -> recharts-to-png or html2canvas package (new dependency)

[XLS Export]
    requires -> SheetJS xlsx package (new dependency)
    shared across -> Analytics XLS, Custom Reports XLS, Billing download

[Custom Reports Page]
    requires -> saved_reports table (new migration)
    requires -> daily_metrics query infrastructure (exists)
    requires -> SheetJS for XLS export

[Billing Enhancements]
    requires -> daily_metrics + creatives join (both exist)
    requires -> TanStack Table for pagination (shared with campaigns)
    requires -> DateRangeSelect component (exists)

[Guide/Help Page]
    requires -> nothing (standalone static content)
    no database changes
```

### Shared Dependencies (Build Once, Use Everywhere)

| Dependency | Used By | Notes |
|------------|---------|-------|
| SheetJS (`xlsx`) | Tracker bulk upload, Analytics XLS export, Custom Reports XLS, Billing download | Install once; create shared export utility |
| TanStack Table | Campaign table, Custom Reports results, Billing per-creative table, Tracker table | Install once; create shared DataTable component |
| `recharts-to-png` or `html2canvas` | Analytics PNG download, Custom Reports chart export | Install once; create shared useChartExport hook |
| `DateRangeSelect` component | Analytics, Custom Reports, Billing | Already exists; reuse as-is |

---

## Phase Ordering Recommendation

Based on dependency analysis and value delivery:

**Phase 1: Foundation Enhancements (Campaign Table + Tracker Page + Guide)**
- Campaign table layout + search + metadata fields (immediate UX improvement)
- Dedicated Tracker Management page (elevate buried feature)
- Guide/Help page (standalone, no dependencies)
- Rationale: These are table-stakes improvements that make the platform feel complete. All are relatively low complexity and independent of each other.

**Phase 2: Campaign Detail Enhancements**
- Per-campaign Analytics tab
- Per-campaign Placements tab
- Creative duplication
- Rationale: Depends on Phase 1's campaign table being stable. Extends the campaign detail page.

**Phase 3: Analytics Enhancements**
- Hourly breakdown chart
- Lifetime totals
- Pie/donut by creative share
- Platform breakdown
- PNG download per chart
- XLS export
- Rationale: Requires SheetJS and chart export utilities (shared dependencies). Hourly breakdown needs careful query design.

**Phase 4: Custom Reports + Billing**
- Custom Reports page (saved reports, metric selection, XLS export)
- Billing enhancements (spend summary, per-creative table, date filter, download)
- Rationale: Most complex features that reuse infrastructure built in Phase 3 (SheetJS, TanStack Table, date range components).

---

## Complexity Summary

| Feature Area | Estimated Effort | New DB Tables | New Packages | Key Risk |
|-------------|-----------------|---------------|--------------|----------|
| Tracker Management Page | MEDIUM | 0 (schema change only) | xlsx (for bulk upload) | Tracker type taxonomy migration |
| Campaign Enhancements | MEDIUM-HIGH | 0 (schema changes) | @tanstack/react-table | Campaign table is a big UI refactor |
| Analytics Enhancements | HIGH | 0 | xlsx, recharts-to-png | Hourly query performance on ad_events |
| Custom Reports | HIGH | 1 (saved_reports) | None (shares xlsx) | Report type scoping logic complexity |
| Billing Enhancements | MEDIUM | 0 | None (shares xlsx + TanStack Table) | Accurate credit-to-impression mapping |
| Guide/Help Page | LOW | 0 | None | Content writing effort, not code |

---

## Sources

- Airtory Ad Trackers features: https://www.airtory.com/trackers (HIGH confidence -- official)
- Airtory campaign and analytics features: https://www.airtory.com/brands (HIGH confidence -- official)
- Google Ad Manager reporting overview: https://support.google.com/admanager/answer/2671992?hl=en (HIGH confidence -- official)
- Google Ad Manager report dimensions: https://support.google.com/admanager/table/7531695?hl=en (HIGH confidence -- official)
- Google Ad Manager export formats: https://support.google.com/admanager/answer/2643321?hl=en (HIGH confidence -- official)
- Google CM360 placement tags: https://support.google.com/campaignmanager/answer/2826636?hl=en (HIGH confidence -- official)
- Meta Ad Copies API duplication update (May 2025): https://web.swipeinsight.app/posts/change-creative-fields-when-duplicating-ads-using-ad-copies-api-17078 (MEDIUM confidence -- verified third-party report)
- ad:personam help center structure: https://www.adpersonam.io/help/ (HIGH confidence -- official)
- Airtory knowledge base: https://docs.airtory.com/ (HIGH confidence -- official)
- SheetJS (xlsx) React integration: https://docs.sheetjs.com/docs/demos/frontend/react/ (HIGH confidence -- official docs)
- recharts-to-png for chart image export: https://github.com/brammitch/recharts-to-png (MEDIUM confidence -- open source, 200+ stars)
- Dashboard design principles: https://www.uxpin.com/studio/blog/dashboard-design-principles/ (MEDIUM confidence -- industry best practices)
- Ad tag concepts: https://www.adbutler.com/blog/article/what-is-an-ad-tag (MEDIUM confidence -- industry reference)
- RedTrack tracker management: https://www.redtrack.io/ (MEDIUM confidence -- competitor reference)
- Display advertising CTR benchmarks: https://focus-digital.co/average-display-ad-ctr-2025-benchmarks/ (MEDIUM confidence -- industry data)

---

*Feature research for: ScrollToday v2.0 Platform Parity & Enhancements*
*Researched: 2026-02-25*
