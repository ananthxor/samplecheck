# Domain Pitfalls: ScrollToday v2.0 Feature Additions

**Domain:** Feature additions to existing React + TypeScript + Supabase ad platform
**Researched:** 2026-02-25
**Confidence:** HIGH for database/query pitfalls (verified against codebase schema and official PostgreSQL docs). MEDIUM for client-side library pitfalls (verified via official docs and issue trackers). LOW for custom reports patterns (limited Supabase-specific sources).

---

## Critical Pitfalls

Mistakes that cause data corruption, rewrites, or production outages.

---

### Pitfall 1: Hourly Analytics Queries Bypassing Partition Pruning

**What goes wrong:**
Adding hourly breakdowns to the analytics dashboard requires querying `ad_events` (the partitioned table) with `date_trunc('hour', event_timestamp)` in the SELECT clause. The query planner sees the `date_trunc()` function call and loses the ability to prune partitions, scanning ALL monthly partitions instead of just the target month. A query that should touch one partition (e.g., `ad_events_2026_02`) ends up scanning 6+ partitions. On a table with millions of rows, this turns a 200ms query into a 5-10 second query.

**Why it happens:**
PostgreSQL partition pruning works by comparing WHERE clause conditions against partition boundaries. It understands `WHERE event_timestamp >= '2026-02-01' AND event_timestamp < '2026-03-01'` and prunes correctly. But `date_trunc()` in the GROUP BY does not inform the partition pruner -- it is evaluated after scanning, not before. The existing `rollup_today_metrics()` function already demonstrates the correct pattern (explicit timestamp range in WHERE clause), but developers extending analytics may not follow the same pattern.

**Consequences:**
- Analytics page load time degrades from under 1s to 5-10s
- RLS policy (`advertiser_id = get_user_advertiser_id()`) executes per-row across all scanned partitions, compounding the slowdown
- Supabase connection pool saturation under concurrent analytics queries
- Users abandon the analytics page

**Prevention:**
1. ALWAYS include explicit `event_timestamp >= X AND event_timestamp < Y` in every query that touches `ad_events`, even when also using `date_trunc()` for grouping
2. Create a dedicated `hourly_metrics` rollup table (analogous to existing `daily_metrics`) rather than querying raw events at dashboard time
3. If querying raw events is required, use a SECURITY DEFINER function (like the existing `rollup_today_metrics`) to bypass per-row RLS overhead
4. Run `EXPLAIN ANALYZE` on every new analytics query and verify "Partitions pruned" appears in the plan

**Detection:**
- `EXPLAIN ANALYZE` shows "Seq Scan on ad_events_2026_02, ad_events_2026_03, ..." (multiple partitions) when only one is expected
- Supabase Dashboard > Reports > Slowest queries shows analytics-related queries
- Analytics page shows loading spinner for more than 2 seconds

**Phase to address:** Hourly analytics feature -- must design the rollup strategy BEFORE building the UI.

**Confidence:** HIGH -- verified against the actual schema in `20260219000000_initial_schema.sql` and `20260225000002_analytics_rollup_today.sql`. PostgreSQL partition pruning behavior is well-documented in [official PostgreSQL docs](https://www.postgresql.org/docs/current/ddl-partitioning.html).

---

### Pitfall 2: NULL campaign_id Breaks Per-Campaign Analytics Filtering

**What goes wrong:**
The `daily_metrics` table has a `UNIQUE(metric_date, advertiser_id, campaign_id, creative_id)` constraint. Creatives can exist without a campaign assignment (`campaign_id` is nullable in both `creatives` and `ad_events`). When a user filters analytics by a specific campaign, the Supabase query `.eq('campaign_id', selectedCampaignId)` correctly returns only that campaign's rows. But when displaying "all campaigns" or building per-campaign breakdowns, rows with `campaign_id = NULL` (unassigned creatives) silently disappear from campaign-grouped results because `NULL != NULL` in SQL grouping.

The existing code in `analytics-api.ts` line 32 shows `if (filters?.campaignId) { query = query.eq('campaign_id', filters.campaignId) }` -- when no campaign filter is applied, NULL rows are included in totals but invisible in per-campaign breakdowns.

**Why it happens:**
SQL `GROUP BY campaign_id` treats all NULLs as a single group (which is correct), but frontend code that maps `campaign_id` to a campaign name via a lookup will fail to find a match for NULL, causing those rows to be either dropped or shown as "Unknown". The NULLS NOT DISTINCT fix in migration `20260225000001_billing_tables.sql` already fixed the unique constraint for upserts, but the display/filtering logic in the frontend has not been addressed.

**Consequences:**
- Analytics totals ("All campaigns") and per-campaign sum don't add up -- the NULL-campaign rows are missing from the breakdown
- Users see different total numbers depending on whether they filter by campaign or view all
- Trust in analytics data is undermined

**Prevention:**
1. In the frontend aggregation layer, explicitly handle `campaign_id === null` as an "Unassigned" category in per-campaign breakdowns
2. When the analytics API fetches per-campaign data, always include a separate query or grouping for `campaign_id IS NULL`
3. Add a UI label "Unassigned Creatives" in campaign filter dropdowns and chart legends
4. Add a reconciliation check: `SUM(per_campaign_metrics) + SUM(unassigned_metrics) === total_metrics`
5. Consider requiring campaign assignment before a creative can be activated (business rule change)

**Detection:**
- Sum of per-campaign metrics does not equal the "All" total
- CSV export has rows with empty campaign_id that don't appear in the campaign breakdown chart

**Phase to address:** Per-campaign analytics feature -- the first PR that adds campaign-level breakdowns must handle the NULL case.

**Confidence:** HIGH -- verified against actual schema (`campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL` in creatives table, nullable `campaign_id` in `ad_events` and `daily_metrics`).

---

### Pitfall 3: ALTER TABLE ADD COLUMN on Live campaigns Table with Volatile Defaults

**What goes wrong:**
Adding `advertiser_name`, `start_date`, and `end_date` columns to the `campaigns` table seems trivial. But if any column is added with a volatile default (like `now()` for `start_date`), PostgreSQL rewrites the entire table, holding an ACCESS EXCLUSIVE lock for the duration. On a table with active reads (campaign list page, campaign detail page, analytics filters all query this table), this causes connection timeouts and a brief outage.

**Why it happens:**
Since PostgreSQL 11, adding a column with a CONSTANT default (like `NULL` or a literal string) is near-instant -- the default is stored in the catalog, not written to each row. But a VOLATILE default (e.g., `DEFAULT now()`) forces a full table rewrite. Developers who know "ADD COLUMN with DEFAULT is fast now" miss this distinction.

Additionally, the `campaigns` table has RLS policies, triggers (`set_updated_at`), and indexes (`idx_campaigns_advertiser_id`). Even for constant defaults, the ACCESS EXCLUSIVE lock must still be acquired. If a long-running transaction (like an analytics query or a slow campaign list fetch) holds a lock on the table, the ALTER TABLE will queue behind it, and all subsequent queries queue behind the ALTER TABLE, creating a cascading lockout.

**Consequences:**
- 2-30 second outage for all campaign-related queries (depending on table size and concurrent transactions)
- React Query retries flood the connection pool
- Users see "Failed to load campaigns" errors
- If `start_date DEFAULT now()` is used, every existing campaign gets today's date as start_date -- which is incorrect

**Prevention:**
1. ALWAYS use `DEFAULT NULL` for new columns, never volatile defaults
2. Add columns in a migration with `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS advertiser_name TEXT DEFAULT NULL`
3. Backfill data with a separate UPDATE statement (not in the same transaction as the ALTER)
4. For `start_date` and `end_date`: add as nullable DATE columns, then backfill `start_date` from `created_at` if desired
5. Set `lock_timeout` in the migration: `SET lock_timeout = '5s'` so the migration fails fast instead of causing a cascading lockout
6. Run migrations during low-traffic periods
7. Update the TypeScript types in `@scrolltoday/shared` to include the new columns

**Detection:**
- Migration takes more than 1 second on a non-empty table
- Application logs show connection timeout errors during migration
- Supabase Dashboard shows lock contention

**Phase to address:** Campaign table refactor -- this migration must be the FIRST step, validated on a staging copy of the database before running in production.

**Confidence:** HIGH -- verified against [official PostgreSQL ALTER TABLE docs](https://www.postgresql.org/docs/current/sql-altertable.html) and [Cybertec: ALTER TABLE ADD COLUMN done right](https://www.cybertec-postgresql.com/en/postgresql-alter-table-add-column-done-right/).

---

### Pitfall 4: Excel Export (XLS/XLSX) Crashing Browser Tab on Large Datasets

**What goes wrong:**
The existing CSV export (`csv-export.ts`) works by building a string in memory and creating a Blob. Switching to Excel format (XLSX) using a library like SheetJS requires building an in-memory workbook object, which consumes 3-5x more memory than the equivalent CSV. For an advertiser with 90 days of analytics across 50 creatives (4,500+ rows with multiple metric columns), the browser tab runs out of memory and crashes. The user sees a dead tab with no error message.

**Why it happens:**
SheetJS `XLSX.write()` and `XLSX.writeFile()` build the entire workbook in memory before serializing. The XLSX format is a ZIP archive of XML files -- the library must construct all XML in memory, then ZIP it. Unlike CSV, there is no way to stream XLSX in the browser. Developers test with 50 rows and it works fine; production has 5,000+ rows.

**Consequences:**
- Browser tab crashes silently on large exports
- Users retry repeatedly, each attempt consuming more memory
- No error handling possible (the tab is dead)
- Users lose trust in the export feature

**Prevention:**
1. Use SheetJS (`xlsx` package) but enforce a row limit (10,000 rows max for browser-side XLSX generation)
2. For datasets exceeding the limit, fall back to CSV export with a toast notification: "Dataset too large for Excel format. Downloading as CSV instead."
3. Alternatively, generate XLSX server-side via a Supabase Edge Function using Deno-compatible libraries, then return a download URL
4. Use SheetJS "dense mode" (`dense: true` option) for better memory efficiency -- stores cells in arrays of arrays instead of object maps
5. Show a progress indicator and use `requestIdleCallback` or web workers to avoid blocking the main thread during generation
6. Test with realistic data volumes: 90 days x 50 creatives x 10 metric columns

**Detection:**
- Browser DevTools shows memory spike when clicking "Export Excel"
- Users report "tab became unresponsive" after clicking export
- No error appears in error tracking (Sentry/LogRocket) because the tab crashed before the error handler ran

**Phase to address:** Excel export feature -- implement with row-limit guard from the start. Server-side generation should be the fallback path, not an afterthought.

**Confidence:** MEDIUM -- verified via [SheetJS large dataset docs](https://docs.sheetjs.com/docs/demos/bigdata/stream/) and [SheetJS memory issues on GitHub](https://github.com/SheetJS/sheetjs/issues/798). Exact memory thresholds vary by browser and device.

---

## Moderate Pitfalls

Mistakes that cause significant debugging time, user confusion, or feature rework.

---

### Pitfall 5: Chart PNG Download Producing Blank or Broken Images

**What goes wrong:**
Exporting the Recharts `<AreaChart>` component to PNG requires converting SVG to canvas, then canvas to PNG. The chart currently uses Recharts v3 with SVG rendering inside a `<ResponsiveContainer>`. Using `html2canvas` or `html-to-image` to capture the chart DOM produces one of several failures:
- Blank image (SVG not rendered to canvas correctly)
- Missing fonts (chart axis labels render in Times New Roman instead of the app font)
- Incorrect dimensions (ResponsiveContainer's percentage-based sizing produces a 0x0 capture)
- Missing CSS variables (HSL color values like `hsl(var(--primary))` are not resolved by the capture library)

**Why it happens:**
- SVG elements inside the DOM are not natively supported by canvas `drawImage()` -- they must be serialized to an SVG data URI first
- `html2canvas` does not natively handle SVG elements well (known issue [#95](https://github.com/niklasvh/html2canvas/issues/95))
- CSS custom properties (the chart uses `hsl(var(--primary))` for stroke/fill) are computed at render time but not embedded in the SVG markup -- capture libraries cannot resolve them
- Custom fonts loaded via `@font-face` must be embedded as data URIs in the SVG for the capture to work
- `ResponsiveContainer` uses `width="100%"` which resolves to a pixel value at render time, but the capture library may measure it differently

**Prevention:**
1. Use `html-to-image` (not `html2canvas`) -- it handles SVG elements natively by serializing the DOM to an SVG data URI, which preserves the chart rendering
2. Before capture, resolve CSS custom properties to literal values: replace `hsl(var(--primary))` with the computed `hsl(222, 47%, 51%)` by reading `getComputedStyle()`
3. Set explicit pixel dimensions on the chart container before capture (not percentage-based)
4. For fonts: either embed font data URIs in the SVG or accept system font fallback in exports
5. Add a white background rectangle to the capture -- SVG default background is transparent, producing a PNG with a transparent background that looks blank on white backgrounds
6. Wrap the capture in a try-catch with a user-facing fallback: "PNG export failed. Right-click the chart and choose 'Save image as...' instead."

**Detection:**
- Downloaded PNG is 0 bytes or all white/transparent
- Font rendering in PNG differs from screen
- Colors in PNG are black (default SVG color) instead of the theme color

**Phase to address:** Chart PNG download feature. Test across Chrome, Firefox, and Safari before shipping.

**Confidence:** MEDIUM -- verified via [recharts-to-png](https://github.com/brammitch/recharts-to-png), [html2canvas SVG issues](https://github.com/niklasvh/html2canvas/issues/95), and [html-to-image docs](https://github.com/bubkoo/html-to-image). Cross-browser behavior varies.

---

### Pitfall 6: Bulk Tracker Upload Silently Accepting Malformed Data

**What goes wrong:**
Adding bulk tracker upload (parse an Excel file of tracker URLs) introduces a class of data quality issues that don't exist with the current one-at-a-time form. Common failures:
- Excel dates stored as serial numbers (e.g., `44928` instead of `2023-01-15`) if date columns are included
- Invisible whitespace or BOM characters in tracker URLs that pass the `startsWith('http')` check but produce broken HTTP requests
- Duplicate trackers (same name + URL) that violate no database constraint but create user confusion
- Macro placeholders (`%%CACHEBUSTER%%`) in URLs that contain Excel auto-formatting artifacts (smart quotes, em-dashes)
- The existing Zod schema (`trackerConfigSchema`) validates one tracker at a time -- it does not check for cross-row duplicates or sheet-level issues

**Why it happens:**
Excel silently transforms data: URLs get converted to hyperlinks with different encoding, straight quotes become curly quotes, long URLs get truncated in display (though the underlying value may be intact). Users copy-paste from other systems where the data was already mangled. Client-side validation catches format errors but not semantic errors (duplicate tracker that already exists in the database).

**Consequences:**
- Trackers with invisible bad characters fail silently at fire time (the pixel request 404s)
- Duplicate trackers cause double-counting of third-party impressions
- Users believe upload succeeded because no error was shown, then discover broken tracking days later
- Support tickets that are hard to reproduce ("it worked in the spreadsheet")

**Prevention:**
1. Trim all string values and strip BOM characters before validation
2. Normalize URLs: decode/re-encode, strip trailing whitespace, replace smart quotes with straight quotes
3. Check for duplicates within the upload batch AND against existing `tracker_configs` for the same advertiser
4. Use `read-excel-file` or SheetJS to parse, but validate with Zod (the existing `trackerConfigSchema`) row-by-row
5. Show a preview table with row-level validation status (green/red) before committing the import
6. Limit upload to 500 rows maximum -- this is a tracker config upload, not a data import
7. Return per-row error messages: "Row 7: URL contains non-ASCII characters after domain"
8. Server-side re-validation in a Supabase Edge Function or RPC -- never trust client-only validation for bulk operations

**Detection:**
- Trackers that were uploaded but never fire (0 events after 24 hours of campaign activity)
- URL inspection reveals hidden characters (`\u200B` zero-width space, `\uFEFF` BOM)
- Duplicate tracker names in the tracker_configs table for the same advertiser

**Phase to address:** Bulk tracker upload feature. The preview-before-commit UX is non-negotiable for bulk imports.

**Confidence:** MEDIUM -- verified via [SheetJS issues](https://git.sheetjs.com/sheetjs/sheetjs/issues/3120), [read-excel-file](https://github.com/catamphetamine/read-excel-file), and the existing `trackerConfigSchema` Zod validation in the codebase.

---

### Pitfall 7: Custom Saved Reports Re-Executing Stale or Expensive Queries

**What goes wrong:**
Saving report configurations (date range, filters, metric selections) in the database and allowing users to "re-run" them creates two problems:
1. **Relative date ranges become stale:** A saved report for "Last 30 days" should compute relative to today when re-run, not relative to the day it was saved. If the save stores `{ start: '2026-01-26', end: '2026-02-25' }` (resolved dates), the report shows old data forever.
2. **Expensive queries on re-run:** Saved reports with broad filters (all campaigns, 90-day range) trigger full scans of `daily_metrics`. If 10 users re-run their saved reports simultaneously at 9 AM, the database connection pool (Supabase has a fixed pool size) is saturated.

**Why it happens:**
Developers serialize the resolved query parameters instead of the report definition. The difference: `{ preset: 'last-30d', campaignId: null }` (definition) vs. `{ start: '2026-01-26', end: '2026-02-25', campaignId: null }` (resolved). The first re-computes on each run; the second is frozen in time.

**Consequences:**
- Users open a saved "Last 30 days" report and see data from 3 months ago
- Multiple concurrent report re-runs cause connection pool exhaustion, affecting the entire application
- No query timeout means a single expensive report can block a connection for 30+ seconds

**Prevention:**
1. Store report definitions, not resolved parameters: `{ datePreset: 'last-30d', filters: { campaignId: null } }`. Resolve dates at query time.
2. For custom date ranges, store as `{ dateRange: { type: 'custom', start: '2026-01-01', end: '2026-01-31' } }` -- these are intentionally fixed.
3. Set a `statement_timeout` on report queries (e.g., 10 seconds): `SET statement_timeout = '10s'` in the RPC function
4. Cache report results for 5 minutes using React Query's `staleTime` -- identical re-runs within the window return cached data
5. Limit saved reports per user (20 max) to prevent unbounded storage growth
6. Add a "Last run" timestamp and "Refresh" button to make stale-ness visible

**Detection:**
- Users complain "my saved report shows old data"
- Supabase Dashboard shows connection pool at 100% utilization during business hours
- Slow query log shows identical expensive queries running repeatedly

**Phase to address:** Custom reports feature. The data model (definition vs. resolved params) must be correct from the first save.

**Confidence:** LOW -- no Supabase-specific documentation on saved report patterns. General database patterns are well-established, but the specific interaction with Supabase connection pooling and RLS overhead needs validation.

---

### Pitfall 8: Campaign Table Refactor Losing UI State During Navigation

**What goes wrong:**
Migrating from the current card grid layout (`CampaignList` -> `CampaignCard` components, grid with `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) to a table with pagination, sorting, and URL-synced state introduces state management issues:
1. **Pagination state lost on back-navigation:** User navigates to page 3 of campaigns, clicks into a campaign detail (`/campaigns/:id`), presses back -- the campaign list resets to page 1 because pagination state was in React state, not the URL.
2. **Sort state conflicts with React Query cache:** The campaign list is fetched via `useCampaigns()` with query key `['campaigns']`. Adding sort parameters to the query changes the cache key, but the old unsorted cache still exists, causing a flash of old data.
3. **Breaking the existing campaign detail link pattern:** The current `CampaignCard` links to `/campaigns/:id`. A table row click must do the same, but TanStack Table row selection and row click navigation conflict -- clicking a row to navigate vs. clicking a row to select are ambiguous.

**Why it happens:**
The current `CampaignList` component has zero URL-synced state (no `useSearchParams`). All state is in React `useState`. Moving to a table with pagination and sorting requires URL synchronization, but the existing hook pattern (`useCampaigns()` returning ALL campaigns client-side) does not support server-side pagination.

**Consequences:**
- Users lose their place when navigating back from campaign detail
- Flash of unsorted data on every sort change
- Confusion about click behavior (navigate vs. select) in the table
- Existing React Query cache invalidation patterns (`void queryClient.invalidateQueries({ queryKey: ['campaigns'] })`) break if query keys now include sort/page params

**Prevention:**
1. Sync pagination and sort state to URL search params using `useSearchParams` from react-router: `/campaigns?page=3&sort=name&dir=asc`
2. Include sort/page params in the React Query key: `['campaigns', { page, sort, dir }]`
3. Choose ONE click behavior for table rows: navigate on click, select on checkbox. Do not overload the row click.
4. Keep the existing `fetchCampaignsWithCreativeCount()` function but add optional pagination params. Do NOT create a separate API function that fragments the cache.
5. Use `keepPreviousData: true` in React Query to prevent flash of empty state during page transitions
6. If server-side pagination is added later, change `fetchCampaignsWithCreativeCount()` to accept `{ page, pageSize, sort }` params and use `.range()` in the Supabase query
7. Test the back-navigation flow explicitly: list -> detail -> back -> verify state preserved

**Detection:**
- Manual QA: navigate to page 3, click a campaign, press back -- if you're on page 1, the bug exists
- React Query DevTools shows duplicate cache entries for the same logical query
- Users complain "I keep losing my place in the campaign list"

**Phase to address:** Campaign table refactor. URL state sync must be wired BEFORE adding pagination, not after.

**Confidence:** MEDIUM -- verified against [TanStack Table state management docs](https://tanstack.com/table/v8/docs/framework/react/guide/table-state), [TanStack Table pagination guide](https://tanstack.com/table/v8/docs/guide/pagination), and the actual `use-campaigns.ts` hooks in the codebase.

---

## Minor Pitfalls

Issues that cause developer friction or minor UX regressions.

---

### Pitfall 9: RLS Overhead on Hourly Rollup Function

**What goes wrong:**
The existing `rollup_today_metrics()` function is `SECURITY DEFINER` and uses explicit `WHERE ae.advertiser_id = p_advertiser_id`, bypassing the RLS policy evaluation overhead. If a new hourly rollup function is created WITHOUT `SECURITY DEFINER`, every row scanned in `ad_events` goes through the RLS policy `advertiser_id = (SELECT public.get_user_advertiser_id())`. The function `get_user_advertiser_id()` performs a subquery per policy evaluation, adding 50-100ms overhead on large scans.

**Prevention:**
Follow the same pattern as `rollup_today_metrics()`: use `SECURITY DEFINER`, pass `advertiser_id` as a parameter, and include explicit WHERE clauses. Never let an analytics rollup function run under the caller's RLS context.

**Phase to address:** Hourly analytics rollup function.

**Confidence:** HIGH -- verified against [Supabase RLS Performance Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) and the existing function pattern in `20260225000002_analytics_rollup_today.sql`.

---

### Pitfall 10: Chart PNG Export Font Mismatch Across Operating Systems

**What goes wrong:**
The application likely uses a system font stack or a custom web font. When exporting the chart to PNG, the SVG serialization captures font-family names but not font data. On a Mac using San Francisco as the system font, the exported PNG shows San Francisco. On Windows using Segoe UI, the same chart looks different. If shared in a report, the visual inconsistency looks unprofessional.

**Prevention:**
Either accept system font variance in exports (document this limitation) or embed a specific font (e.g., Inter) as a base64 data URI in the SVG before capture. The latter adds ~100KB to the export process but guarantees consistent rendering.

**Phase to address:** Chart PNG download feature -- decide on font strategy before implementation.

**Confidence:** MEDIUM -- verified via [CSS-Tricks: Using Custom Fonts With SVG](https://css-tricks.com/using-custom-fonts-with-svg-in-an-image-tag/) and [dom-to-image-font-patch](https://www.npmjs.com/package/dom-to-image-font-patch).

---

### Pitfall 11: Shared Type Definitions Out of Sync After Adding Columns

**What goes wrong:**
Adding `advertiser_name`, `start_date`, `end_date` to the `campaigns` table requires updating the TypeScript types in `@scrolltoday/shared`. If the Supabase-generated types are regenerated but the shared package is not rebuilt, the web app's `Tables<'campaigns'>` type still lacks the new columns. Supabase returns the new columns in API responses, but TypeScript code cannot access them without type errors. Developers work around this with `as any` casts.

**Prevention:**
1. After running the migration, immediately regenerate Supabase types: `npx supabase gen types typescript --linked > packages/shared/src/database.types.ts`
2. Rebuild the shared package before working on frontend code
3. Never cast Supabase responses to `any` -- if the type is missing, the type generation step was skipped

**Phase to address:** Campaign column migration -- include type regeneration as a step in the migration checklist.

**Confidence:** HIGH -- verified against the existing pattern where `@scrolltoday/shared` exports `Tables`, `Insertable`, `Updatable` types used throughout the codebase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Severity | Mitigation |
|-------------|---------------|----------|------------|
| Hourly analytics | Partition scan on all months (Pitfall 1) | CRITICAL | Create hourly_metrics rollup table; never query ad_events from the dashboard |
| Hourly analytics | RLS overhead on rollup function (Pitfall 9) | MODERATE | Use SECURITY DEFINER, match existing rollup_today_metrics pattern |
| Excel export | Browser crash on large dataset (Pitfall 4) | CRITICAL | Enforce 10K row limit; fall back to CSV; consider server-side generation |
| Chart PNG download | Blank/broken image (Pitfall 5) | MODERATE | Use html-to-image, not html2canvas; resolve CSS variables before capture |
| Chart PNG download | Font mismatch (Pitfall 10) | MINOR | Decide font embedding strategy upfront |
| Bulk tracker upload | Silent data corruption (Pitfall 6) | MODERATE | Preview-before-commit UX; normalize URLs; check duplicates |
| Custom reports | Stale date ranges (Pitfall 7) | MODERATE | Store report definitions, not resolved parameters |
| Custom reports | Connection pool saturation (Pitfall 7) | MODERATE | Add statement_timeout; use React Query caching |
| Campaign table refactor | State lost on back-navigation (Pitfall 8) | MODERATE | Sync pagination/sort state to URL search params from day one |
| Campaign table refactor | DB migration locks (Pitfall 3) | CRITICAL | Use DEFAULT NULL only; set lock_timeout; backfill separately |
| Per-campaign analytics | NULL campaign_id missing from breakdowns (Pitfall 2) | CRITICAL | Handle NULL as "Unassigned" category; reconciliation check |
| Adding DB columns | TypeScript types out of sync (Pitfall 11) | MINOR | Regenerate types immediately after migration |

---

## Integration Gotchas Specific to This Codebase

| Existing Pattern | New Feature | Gotcha | Fix |
|-----------------|-------------|--------|-----|
| `staleTime: 0` in `useAnalytics()` | Saved reports re-running | Every saved report re-run triggers a fresh fetch AND potentially a `rollup_today_metrics` RPC call if date range includes today | Add `staleTime: 60_000` for saved report queries to prevent rapid re-execution |
| `fetchCampaignsWithCreativeCount()` returns ALL campaigns | Campaign table with pagination | Switching to server-side pagination changes the cache key pattern; all existing `invalidateQueries({ queryKey: ['campaigns'] })` calls (5 occurrences in `use-campaigns.ts`) must be updated to handle the new key structure | Use a wildcard invalidation pattern: `queryKey: ['campaigns']` without exact matching |
| CSV export uses `document.createElement('a')` download pattern | Excel export | Same Blob/download pattern works for XLSX, but the MIME type must be `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, not `text/csv` | Set correct MIME type in the Blob constructor |
| `CampaignCard` component used on campaigns page | Table rows in refactored view | The `CampaignCard` is also referenced in the campaign detail page's creative grid -- do not delete it, only replace its usage on the campaigns listing page | Keep `CampaignCard` for the detail page; create new `CampaignTableRow` for the list |
| RLS policy `advertiser_id = (SELECT public.get_user_advertiser_id())` on daily_metrics | Per-campaign analytics with NULL campaign_id | The `.eq('campaign_id', someValue)` Supabase filter combined with RLS creates a compound filter. When `campaign_id IS NULL`, use `.is('campaign_id', null)` not `.eq('campaign_id', null)` -- the latter generates `= NULL` which matches nothing | Always use `.is()` for null comparisons in Supabase |

---

## "Looks Done But Isn't" Checklist for v2.0 Features

- [ ] **Hourly analytics:** Run `EXPLAIN ANALYZE` on the hourly query and verify partition pruning -- "Partitions pruned" must appear in the plan output
- [ ] **Excel export:** Test with 5,000+ rows of real analytics data on a mid-range laptop -- the tab must not crash or hang for more than 3 seconds
- [ ] **Chart PNG:** Download chart as PNG in Chrome, Firefox, and Safari -- all three must produce a non-blank image with correct colors
- [ ] **Bulk tracker upload:** Upload a sheet with 100 trackers including 3 duplicates, 2 with curly quotes in URLs, and 1 with BOM character -- all issues must surface in the preview, not after import
- [ ] **Saved reports:** Save a "Last 7 days" report, wait 24 hours, re-run it -- the date range must shift forward by 1 day, not show yesterday's range
- [ ] **Campaign table:** Navigate to page 3, click a campaign, press browser back -- you must land on page 3, not page 1
- [ ] **Per-campaign analytics:** Verify that `SUM(per_campaign_totals) + unassigned_total === overall_total` for any date range
- [ ] **DB column migration:** Run `\d campaigns` after migration and verify new columns exist with NULL default, not `now()` or empty string
- [ ] **Type sync:** After migration, verify that `Tables<'campaigns'>` includes `advertiser_name`, `start_date`, `end_date` in TypeScript autocomplete

---

## Sources

### HIGH Confidence
- [PostgreSQL Documentation: Table Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html) -- partition pruning behavior
- [PostgreSQL Documentation: ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html) -- ADD COLUMN locking behavior
- [Cybertec: ALTER TABLE ADD COLUMN done right](https://www.cybertec-postgresql.com/en/postgresql-alter-table-add-column-done-right/) -- constant vs volatile defaults
- [Supabase: RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) -- RLS overhead patterns
- [Supabase: Partitioning Tables](https://supabase.com/docs/guides/database/partitions) -- partition strategies
- [TanStack Table: Pagination Guide](https://tanstack.com/table/v8/docs/guide/pagination) -- server vs client-side pagination
- [TanStack Table: State Management](https://tanstack.com/table/v8/docs/framework/react/guide/table-state) -- controlled state patterns

### MEDIUM Confidence
- [SheetJS: Large Datasets](https://docs.sheetjs.com/docs/demos/bigdata/stream/) -- memory constraints for browser-side XLSX
- [SheetJS: Memory Issues (GitHub #798)](https://github.com/SheetJS/sheetjs/issues/798) -- out-of-memory on large exports
- [html2canvas: SVG Capture Issues (GitHub #95)](https://github.com/niklasvh/html2canvas/issues/95) -- SVG rendering limitations
- [html-to-image (GitHub)](https://github.com/bubkoo/html-to-image) -- alternative to html2canvas for SVG
- [recharts-to-png (GitHub)](https://github.com/brammitch/recharts-to-png) -- Recharts-specific export wrapper
- [CSS-Tricks: Custom Fonts With SVG](https://css-tricks.com/using-custom-fonts-with-svg-in-an-image-tag/) -- font embedding challenges
- [Cybertec: PostgreSQL UNIQUE constraint NULL conflicts](https://www.cybertec-postgresql.com/en/unique-constraint-null-conflicts-with-everything/) -- NULL behavior in unique constraints
- [Supabase: Dynamic Table Partitioning](https://supabase.com/blog/postgres-dynamic-table-partitioning) -- partition management strategies
- [read-excel-file (GitHub)](https://github.com/catamphetamine/read-excel-file) -- Excel parsing with strict schema validation

### LOW Confidence
- [Tinybird: Can I use Supabase for analytics?](https://www.tinybird.co/blog/can-i-use-supabase-for-user-facing-analytics) -- Supabase analytics limitations (vendor blog, potential bias)

---

*Pitfalls research for: ScrollToday v2.0 feature additions*
*Researched: 2026-02-25*
*Supersedes: General platform pitfalls from 2026-02-18 (retained separately)*
