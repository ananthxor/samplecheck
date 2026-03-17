# Project Research Summary

**Project:** ScrollToday v2.0 — Platform Enhancements
**Domain:** Self-service digital ad platform (analytics, campaign management, billing, tracker management)
**Researched:** 2026-02-25
**Confidence:** HIGH

## Executive Summary

ScrollToday v2.0 is an enhancement milestone that elevates an existing React 19 + Supabase ad platform from a functional MVP to a competitive self-serve tool. The work spans six feature areas: a dedicated Tracker Management page, Campaign enhancements (table view, metadata fields, per-campaign analytics and placements tabs, creative duplication), Analytics enhancements (hourly breakdown, lifetime metrics, creative share pie chart, platform/device breakdown, PNG/XLS export), a Custom Reports page (saved named reports, XLS export), Billing enhancements (spend summary, per-creative table, date filter, download), and a Guide/Help page. The recommended approach is to build against the existing stack with only four new npm dependencies — SheetJS for Excel I/O, html-to-image for chart PNG export, react-day-picker and date-fns for the calendar date range picker. Every other capability — tables, pagination, charts, forms, validation — is already present in the project.

The core architecture principle is: centralize analytics query logic in `features/analytics/` and reuse it everywhere. Campaign analytics tabs, custom reports, and billing spend summaries all delegate to the existing `fetchDailyMetrics` and analytics API rather than duplicating query patterns. The `daily_metrics` table is the correct source for all period-scoped analytics; raw `ad_events` is accessed only for the hourly drill-down via a new SECURITY DEFINER PostgreSQL function with explicit timestamp-range bounds for partition pruning. Custom reports store filter definitions as JSONB in a new `saved_reports` table and execute against existing analytics API functions at query time, never pre-computing results. Only four database migrations are needed across all six feature areas.

The most consequential risks are: partition-pruning failures on the `ad_events` table that will turn sub-second hourly queries into 5-10 second scans (mitigate with explicit `event_timestamp >= X AND event_timestamp < Y` in WHERE clauses and SECURITY DEFINER functions); browser tab crashes on Excel export for large datasets (mitigate with a 10,000-row hard cap and CSV fallback); destructive ALTER TABLE locking on the campaigns table (mitigate with NULL-default columns only, a `lock_timeout` guard, and a separate backfill transaction); and NULL `campaign_id` rows silently disappearing from per-campaign analytics breakdowns (mitigate by explicitly handling NULLs as an "Unassigned" category from the first PR that touches campaign-level analytics).

---

## Key Findings

### Recommended Stack

The existing stack (React 19, Recharts 3.7, Supabase, shadcn/ui, React Query, React Hook Form + Zod) handles all v2.0 features without replacement. Only four new npm packages are needed, plus two shadcn/ui copy-paste components.

**New npm dependencies (install once, use everywhere):**
- **SheetJS (`xlsx`) 0.20.3** — Excel read/write for analytics export, custom reports export, billing download, and bulk tracker upload. Install via CDN tarball (`cdn.sheetjs.com`), NOT the npm registry (stuck at 0.18.5 with known CVEs). Lazy-load via dynamic `import()` since it is ~200KB gzipped.
- **html-to-image ^1.11.13** — DOM-to-PNG for chart export. SVG-native approach that works correctly with Recharts' SVG output. Preferred over html2canvas (stale, canvas-based, poor SVG handling) and recharts-to-png (wrapper with uncertain Recharts v3 compatibility). Small at ~15KB.
- **react-day-picker ^9.x** — Calendar date range UI. Required peer dependency of shadcn/ui Calendar; needed for the custom report builder's arbitrary date range selection.
- **date-fns ^4.1.0** — Required peer dependency of react-day-picker. Tree-shakeable; coexists safely with the existing native Date arithmetic in `analytics-types.ts`. Do NOT refactor existing native Date code.

**New shadcn/ui components (copy-paste, no additional npm):** Calendar, Pagination, Popover.

**What NOT to add:** `file-saver` (unmaintained, native Blob + anchor click already used in `csv-export.ts`), TanStack Table for single-table cases (manual `useState` + `Array.slice()` is sufficient for billing; only introduce TanStack Table if campaign table requires server-side pagination), `@mdx-js/react` (help page is static TSX), `jspdf` (no PDF requirement), `moment`/`dayjs` (date-fns covers the need).

**Estimated total bundle size impact:** ~220KB gzipped. SheetJS dominates at ~200KB but is lazy-loaded via dynamic import, keeping it out of the initial bundle.

See full rationale: `.planning/research/STACK.md`

---

### Expected Features

**Must have — table stakes that close gaps vs. Airtory (P1):**
- Campaign table layout with search and sort — every ad platform uses tables; card grids break at 10+ campaigns
- Campaign metadata fields: advertiser name (via join to `advertisers.name`, not denormalized), start date, end date — informational only, no auto-start/stop scheduling in v2
- Per-campaign analytics tab — Airtory and all major platforms provide this drill-down; its absence creates analytics trust gaps
- Creative duplication — standard in every ad builder; users iterate by cloning
- Dedicated Tracker Management page at `/trackers` — trackers buried in campaign detail are undiscoverable
- Lifetime analytics totals — cumulative metrics are expected alongside period-specific KPIs
- XLS export for analytics and reports — CSV exists in v1; XLS is the expected format for business reporting
- Guide/Help page at `/guide` — self-serve platforms must be self-documenting at this user scale

**Should have — differentiators that create preference (P2):**
- Hourly analytics breakdown — intraday performance trends; uncommon in lightweight ad platforms at this price point
- Custom Reports page with saved configurations — repeatable reporting workflows; rare in self-serve tier
- Bulk tracker upload via Excel — agencies can import entire tracker sheets instead of manual one-by-one entry
- Per-creative spend table in Billing — connects spend directly to creative performance
- Platform/device breakdown chart — Desktop/Mobile/Tablet distribution (conditional on `track-event` Edge Function storing `device_type` in `ad_events.extra_data`)
- Creative share pie/donut chart — visual impression distribution across creatives
- PNG chart download — quick stakeholder-ready screenshots without manual screenshotting
- Per-campaign Placements tab — centralized tag management view within a campaign

**Defer to v3+ (anti-features for v2 scope):**
- Scheduled/auto-run reports — requires cron + email infrastructure; not justified at current user scale
- Real-time analytics streaming — WebSocket infrastructure overhead; refresh-on-load is appropriate for v2 scale
- Campaign auto-start/stop by date — requires scheduling infrastructure; start/end dates are informational in v2
- Tracker firing analytics (actual fire counts) — requires ad SDK modification to report tracker fires server-side
- Multi-sheet custom dashboards — a product in itself; way beyond v2 scope

See full analysis: `.planning/research/FEATURES.md`

---

### Architecture Approach

All v2.0 features integrate against the existing architecture with three targeted new elements: two new PostgreSQL functions (`fetch_hourly_metrics`, `fetch_lifetime_totals`), one new table (`saved_reports`), and two schema changes (campaigns `start_date`/`end_date`, conditionally `daily_metrics.device_type`). The central design rule is that `features/analytics/` owns all analytics query functions and chart components; every other feature imports from there rather than creating parallel query paths.

**Component boundaries:**
1. `features/analytics/` — owns data fetching from `daily_metrics` / `ad_events`, all chart components (MetricsChart, KpiCards, new PieChart, new HourlyChart), aggregation logic, and export utilities. Enhanced with `fetchHourlyMetrics` and `fetchLifetimeTotals` functions.
2. `features/campaigns/` — Campaign CRUD, creative assignment, tracker management page (extracted from `TrackerConfigSection`); imports analytics components for the per-campaign tab without recreating them.
3. `features/billing/` — Extended with spend summary derived from `daily_metrics + creatives` join; CPM rates as application constants in `billing-api.ts`, not DB columns.
4. `features/reports/` (new directory) — `saved_reports` CRUD, report builder form, report execution delegated to existing analytics API functions. Stores report definitions as JSONB, not resolved parameters.
5. `features/guide/` (new directory) — Static TSX content with shadcn/ui layout components. No database, no external dependencies.

**Data flow:** `ad_events` → existing cron rollup → `daily_metrics` → analytics page, campaign analytics tab, billing spend summary, custom reports. Hourly queries bypass the daily rollup and hit `ad_events` directly via `fetch_hourly_metrics()`, scoped to a single day's partition using the existing `idx_ad_events_advertiser_timestamp` index.

**Migrations required (ordered by priority):**
- P0: `_add_campaign_dates.sql` — ALTER campaigns ADD `start_date DATE`, `end_date DATE` with NULL defaults + constraint + index
- P0: `_hourly_metrics_fn.sql` — CREATE FUNCTION `fetch_hourly_metrics` (SECURITY DEFINER, explicit timestamp range bounds)
- P1: `_lifetime_totals_fn.sql` — CREATE FUNCTION `fetch_lifetime_totals` (could be client-side initially)
- P1: `_saved_reports_table.sql` — CREATE TABLE `saved_reports` + RLS matching existing advertiser-scoped pattern + trigger + index
- P2 (deferred): `_daily_metrics_device_type.sql` — ADD `device_type` column, rebuild unique index, update both rollup functions — only after confirming `track-event` stores device info

**Features requiring NO migrations:** Creative/campaign pie chart, per-campaign analytics tab, tracker management page, billing spend summary, guide/help page.

See full architecture: `.planning/research/ARCHITECTURE.md`

---

### Critical Pitfalls

1. **Hourly query partition scan** — `date_trunc()` in GROUP BY does not prune partitions; without explicit `WHERE event_timestamp >= X AND event_timestamp < Y`, the query scans all monthly partitions and degrades from <200ms to 5-10s. Always include explicit timestamp bounds in WHERE, use SECURITY DEFINER functions matching `rollup_today_metrics` pattern, and run `EXPLAIN ANALYZE` to verify "Partitions pruned" before any hourly analytics PR ships.

2. **NULL `campaign_id` disappears from analytics breakdowns** — Creatives can exist unassigned to a campaign; Supabase `.eq('campaign_id', value)` generates `= NULL` which matches nothing. Use `.is('campaign_id', null)` for null comparisons; surface these rows as "Unassigned" in all campaign-grouped views; verify `SUM(per-campaign totals) + unassigned total === overall total` as a reconciliation check.

3. **ALTER TABLE locking on `campaigns`** — Adding columns with volatile defaults (e.g., `DEFAULT now()`) rewrites the entire table under ACCESS EXCLUSIVE lock, causing a cascade of query timeouts. Use `DEFAULT NULL` only; add `SET lock_timeout = '5s'` in the migration script; backfill data in a separate transaction after the ALTER.

4. **Excel export browser tab crash** — SheetJS builds the entire workbook in memory before serializing. At 5,000+ rows with 10+ metric columns, tabs crash silently with no user-facing error. Enforce a 10,000-row hard limit; fall back to CSV with a toast notification for oversized exports; consider server-side XLSX generation in a Supabase Edge Function for the fallback path.

5. **Chart PNG blank or broken image** — `html2canvas` does not handle SVG elements or CSS custom properties (`hsl(var(--primary))`) correctly. Use `html-to-image` instead; resolve CSS variables via `getComputedStyle()` before capture; set explicit pixel dimensions on the chart container (not percentage-based); always pass `backgroundColor: '#ffffff'` to avoid transparent-looks-blank output. Test in Chrome, Firefox, and Safari before shipping.

See full pitfall analysis: `.planning/research/PITFALLS.md`

---

## Implications for Roadmap

Based on combined research, four phases are recommended. Phase ordering is driven by: (a) the dependency graph — shared infrastructure before consumers; (b) migration risk — zero-migration frontend work before schema changes; and (c) value density — P1 table-stakes features before P2 differentiators.

### Phase 1: Foundation Enhancements

**Rationale:** These are table-stakes features that close the most visible UX gaps. The campaign table refactor and tracker page can ship as frontend-dominant work with only one lightweight migration (two nullable date columns). The Guide/Help page has zero dependencies. Building the campaign table's URL-synced pagination state correctly in Phase 1 prevents the state-loss regression (Pitfall 8) before more complex campaign features are built on top in Phase 2. Bulk tracker Excel upload is intentionally deferred to Phase 3 (when SheetJS is installed) — the tracker page ships without it and still delivers full P1 value.

**Delivers:** Campaign table view at `/campaigns` with search, sort, and URL-synced pagination; campaign form expanded with start/end date fields; Dedicated Tracker Management page at `/trackers` with type filter, search, inline edit, and usage count column; Guide/Help page at `/guide` with 8 categories (~24-32 articles) of static TSX content.

**Features addressed:** Campaign table layout, campaign search, campaign metadata fields (start/end date), tracker management page, guide/help page.

**Migrations:** `_add_campaign_dates.sql` — NULL defaults only; `lock_timeout = '5s'` guard; regenerate Supabase TypeScript types immediately after.

**Pitfalls to avoid:** Pitfall 3 (ALTER TABLE locking — NULL defaults, separate backfill), Pitfall 8 (campaign table URL state sync — use `useSearchParams` from day one, before pagination is added), Pitfall 11 (type sync — regenerate types immediately after migration).

**Research flag:** Standard patterns — no additional research needed. Campaign table with shadcn/ui + URL search params is well-documented; tracker page is a component extraction from existing `TrackerConfigSection`.

---

### Phase 2: Campaign Detail Enhancements

**Rationale:** Extends the campaign detail page with the per-campaign analytics tab (which reuses existing analytics components with zero new query logic — `fetchDailyMetrics` already accepts `campaignId` filter) and the placements tab (which reuses existing tag export utilities). Creative duplication is a single API function. These features build on the stable campaign list from Phase 1 and require no migrations.

**Delivers:** Per-campaign Analytics tab on campaign detail — scoped KPI cards, time-series chart, metrics table, date range selector, all filtered to `campaign_id`; Per-campaign Placements tab — creative table with one-click tag copy actions (DFP/embed/direct), bulk tag download; Creative duplication from card menu and detail page with toast confirmation.

**Features addressed:** Per-campaign analytics tab, per-campaign placements tab, creative duplication.

**Migrations:** None. `daily_metrics.campaign_id` index already exists; tag export utilities already exist.

**Pitfalls to avoid:** Pitfall 2 (NULL campaign_id — the analytics tab must surface "Unassigned" creatives from the first implementation; use `.is()` not `.eq()` for null comparisons; add reconciliation check). Cross-feature component import is the correct pattern here: `campaign-detail-page.tsx` imports `KpiCards`, `MetricsChart`, `DateRangeSelect` from `features/analytics/components/` — do NOT recreate these components.

**Research flag:** Standard patterns. The NULL campaign_id case is the only non-obvious concern and is fully addressed in Pitfall 2.

---

### Phase 3: Analytics Enhancements

**Rationale:** This is the highest-complexity single phase due to the hourly query design risk (Pitfall 1). Installing SheetJS here also establishes the shared XLS export utility that Phase 4 (Custom Reports and Billing) reuses. html-to-image is installed and wired here for chart PNG export. The creative share pie chart requires zero schema changes and zero new packages (Recharts PieChart is already available in the installed Recharts package). Lifetime totals requires one lightweight new PostgreSQL function. Platform/device breakdown is conditionally scoped: if `track-event` already stores `device_type` in `extra_data`, build it here; if not, defer to Phase 4 as a separate sub-task after the tracking pipeline is instrumented.

**Delivers:** Hourly breakdown chart — single-day drill-down toggle on existing MetricsChart (24-hour X-axis with `HH:00` labels); Lifetime totals KPI row displayed above period-filtered KPIs; Creative share donut chart (Top 7 + "Other" bucket, Recharts PieChart with innerRadius); Platform/device breakdown chart (conditional); PNG download button on each chart; XLS export of full analytics report (KPIs + time-series + creative breakdown as separate sheets in one workbook).

**Features addressed:** Hourly breakdown, lifetime analytics totals, creative share pie/donut chart, platform/device breakdown, PNG chart download, analytics XLS export.

**New packages installed:** SheetJS `xlsx` 0.20.3 (CDN tarball), `html-to-image` ^1.11.13.

**Migrations:** `_hourly_metrics_fn.sql` (SECURITY DEFINER, explicit timestamp bounds — critical for Pitfall 1 mitigation), `_lifetime_totals_fn.sql`, conditionally `_daily_metrics_device_type.sql`.

**Pitfalls to avoid:** Pitfall 1 (partition pruning — run `EXPLAIN ANALYZE` and verify "Partitions pruned" before any hourly analytics PR merges; this is a hard gate), Pitfall 4 (Excel export — 10K row limit and CSV fallback from day one), Pitfall 5 (PNG export — html-to-image with CSS variable resolution, explicit pixel dimensions, white background), Pitfall 9 (RLS overhead — SECURITY DEFINER on `fetch_hourly_metrics` matching `rollup_today_metrics` pattern).

**Research flag:** Needs deeper phase research. Confirm whether `track-event` Edge Function currently writes `device_type` to `ad_events.extra_data` before scoping device breakdown. Validate the proposed `fetch_hourly_metrics` query with `EXPLAIN ANALYZE` against a realistic data sample before building the UI. Decide the XLS export row-limit threshold and server-side fallback strategy before writing the export utility.

---

### Phase 4: Custom Reports + Billing Enhancements

**Rationale:** Custom Reports is the most architecturally distinct new feature. It is correctly deferred until Phase 3's analytics infrastructure (hourly function, lifetime totals, SheetJS utility) is stable, because reports must offer hourly and lifetime granularity options. Billing enhancements are grouped here because they share SheetJS (already installed in Phase 3), the date range component (already exists), and manual or TanStack Table-based pagination (already established in Phase 1). The `saved_reports` table migration is the only new schema work in this phase.

**Delivers:** Custom Reports page at `/reports` — saved named reports with metric checkboxes, calendar date range picker (react-day-picker via shadcn/ui Calendar), granularity selector (hourly/daily), report preview table with dynamic columns, XLS export, save/re-run workflow with 20-report-per-advertiser limit and "Last run" timestamp; Billing enhancements — spend summary cards (total credits consumed, avg daily spend, projected depletion), spend-by-format bar/donut chart, per-creative paginated performance table, date range filter, XLS/CSV download.

**Features addressed:** Custom Reports (all sub-features), billing spend summary, billing per-creative table, billing date filter, billing download; also: bulk tracker upload via Excel (SheetJS already installed from Phase 3 — add Excel parsing to Tracker Management page from Phase 1).

**New packages installed:** `react-day-picker` ^9.x, `date-fns` ^4.1.0; shadcn/ui Calendar + Popover components.

**Migrations:** `_saved_reports_table.sql` — CREATE TABLE `saved_reports` with JSONB `config` column, RLS matching existing advertiser-scoped pattern, `set_updated_at` trigger, `idx_saved_reports_advertiser` index.

**Pitfalls to avoid:** Pitfall 7 (stale saved reports — store report definitions with date presets not resolved date strings; add `statement_timeout` on report RPC; use React Query `staleTime: 60_000` for re-run queries; show "Last run" timestamp to users). Pitfall 4 (XLS row limit — same 10K guard and CSV fallback as Phase 3). Pitfall 6 (bulk tracker upload — preview-before-commit table with row-level validation, URL normalization, duplicate detection against existing `tracker_configs`, 500-row upload limit).

**Research flag:** Validate Supabase connection pool behavior under concurrent `executeReport` RPC calls in staging before production release (Pitfall 7 concurrency has LOW confidence). Confirm CPM rate model (static application constants vs. DB `pricing_tiers` table) with business requirements before implementing `fetchSpendSummary` in `billing-api.ts`.

---

### Phase Ordering Rationale

- **Foundation first:** Phase 1 de-risks both the schema migration (campaigns table) and the UI state management pattern (URL-synced pagination) before either is consumed by more complex features. Guide/Help and the tracker page are low-risk additions with immediate P1 value.
- **Zero-migration features in Phase 2:** Per-campaign analytics tab and placements tab require no migrations and can be developed in parallel with Phase 1 if team capacity allows; sequenced after Phase 1 only to ensure campaign table stability.
- **Analytics infrastructure before consumers:** Phase 3 must precede Phase 4 because Custom Reports needs `fetch_hourly_metrics`, `fetch_lifetime_totals`, and the SheetJS export utility that Phase 3 establishes.
- **SheetJS installed in Phase 3, not Phase 1:** Bulk tracker Excel upload is a P2 differentiator. Deferring SheetJS installation to Phase 3 (when it is needed for the higher-priority analytics XLS export) avoids adding ~200KB to the bundle before the feature that most justifies it.
- **Device breakdown conditionally deferred:** If `track-event` does not store device type, the `_daily_metrics_device_type.sql` migration and device chart are separated into their own Phase 4 sub-task. The rest of Phase 3 is not blocked.
- **Custom Reports last:** It is the most complex new feature, depends on Phase 3 infrastructure, and is the only P2 feature large enough to warrant its own feature directory.

### Research Flags

Phases needing deeper research during planning:
- **Phase 3 (Analytics Enhancements):** Confirm whether `track-event` Edge Function currently writes `device_type` to `ad_events.extra_data` (determines if device breakdown is in scope). Validate `fetch_hourly_metrics` with `EXPLAIN ANALYZE` on a realistic data sample. Decide XLS export row-limit threshold and server-side Edge Function fallback strategy.
- **Phase 4 (Custom Reports + Billing):** Load-test concurrent report re-runs in staging to validate Supabase connection pool behavior. Confirm CPM rate model with business requirements.

Phases with standard, well-documented patterns (can skip `/gsd:research-phase`):
- **Phase 1 (Foundation):** Campaign table with shadcn/ui + URL search params, tracker page as component extraction — established patterns; abundant documentation.
- **Phase 2 (Campaign Detail):** Analytics component reuse, tag copy utilities, creative duplication API — all are simple compositions of existing code.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All four new dependencies verified against official docs and npm. Version compatibility matrix confirmed (React 19, Vite 6, TypeScript 5.7). SheetJS CDN tarball requirement is official and widely adopted. |
| Features | MEDIUM-HIGH | Competitor feature patterns verified via official sites (Airtory, Google Ad Manager, CM360). Feature taxonomy and priority ordering grounded in industry standard UX. Some complexity estimates are from training data cross-verified with codebase analysis. |
| Architecture | HIGH | Based on direct codebase inspection of actual migrations, API layers, component structure, and existing query patterns. Integration recommendations are derived from existing code, not inference. |
| Pitfalls | HIGH (DB/query), MEDIUM (client-side), LOW (custom reports concurrency) | PostgreSQL partition pruning and ALTER TABLE locking verified against official docs and codebase schema. Client-side pitfalls (SheetJS memory, html-to-image SVG) verified via issue trackers and official docs. Custom reports connection pool saturation has no Supabase-specific documentation. |

**Overall confidence: HIGH**

### Gaps to Address

- **Device type in tracking pipeline:** It is unclear whether `track-event` Edge Function currently stores `device_type` in `ad_events.extra_data`. Confirm before planning Phase 3 tasks. If absent, platform/device breakdown requires ad SDK + Edge Function instrumentation first and should be sequenced as a pre-task or deferred to its own sub-phase.
- **CPM rate model:** The billing spend summary uses hardcoded CPM rates as application constants in `billing-api.ts`. This needs business validation before Phase 4 — if per-advertiser or per-format pricing tiers are required, a `pricing_tiers` DB table is needed and must be scoped into Phase 4.
- **Tracker type taxonomy:** FEATURES.md recommends adding a `tracker_category` column (`conversion`, `impression`, `click`) alongside existing `tracker_type` (`pixel`, `script`). ARCHITECTURE.md confirms the tracker page requires no schema changes. Resolution: the tracker page ships in Phase 1 without the taxonomy change; the `tracker_category` column migration is a low-risk Phase 1 optional enhancement to add to the plan.
- **TanStack Table decision:** FEATURES.md lists TanStack Table as a shared dependency for campaign table and custom reports results table. STACK.md recommends against it for single-table pagination cases. Resolution: evaluate in Phase 1 planning whether campaign table sort/filter requirements justify TanStack Table; if not, use manual shadcn/ui Table throughout to avoid the ~50KB addition.
- **Custom reports concurrency:** Pitfall 7 has LOW confidence on connection pool saturation. Run staging load tests with 10 concurrent `executeReport` RPC calls before Phase 4 ships to production.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `supabase/migrations/`, `apps/web/src/features/` — architecture, schema, and existing pattern verification
- PostgreSQL Documentation: Table Partitioning — partition pruning behavior and `date_trunc` limitations
- PostgreSQL Documentation: ALTER TABLE — ADD COLUMN locking behavior, constant vs. volatile defaults
- Cybertec: ALTER TABLE ADD COLUMN done right — NULL default vs. volatile default implications
- Supabase RLS Performance and Best Practices — per-row RLS overhead, SECURITY DEFINER patterns
- SheetJS official docs (cdn.sheetjs.com) — version, ESM module design, CDN tarball installation requirement
- shadcn/ui official docs — Calendar (react-day-picker dependency), Pagination, Popover component requirements
- html-to-image npm (870K+ weekly downloads, GitHub) — SVG capture approach and TypeScript support
- Airtory official site (airtory.com) — tracker features, campaign analytics patterns, knowledge base structure
- Google Ad Manager support docs — hourly reporting dimension, report builder configuration, placement tag formats
- Google Campaign Manager 360 docs — placement and tag management patterns
- react-day-picker official site (daypicker.dev) — React 19 compatibility, date-fns peer dependency
- date-fns npm — tree-shaking behavior, TypeScript support, version 4 API

### Secondary (MEDIUM confidence)
- SheetJS large dataset docs and GitHub issue #798 — memory constraints for browser-side XLSX at scale
- html2canvas GitHub issue #95 — SVG rendering limitations that motivated html-to-image recommendation
- TanStack Table v8 docs — pagination guide, state management, controlled state patterns
- Meta Ad Copies API docs (May 2025 update) — creative duplication UX patterns
- ad:personam help center structure — guide/help page category organization reference
- RedTrack / Voluum tracker management interfaces — tracker page UX patterns
- ExcelJS GitHub issues #1577 and #810 — browser bundle size and Node.js polyfill problems

### Tertiary (LOW confidence)
- Tinybird blog: Can I use Supabase for analytics? — Supabase analytics limitations at scale. Vendor blog with potential bias; treat directionally only. Validate connection pool behavior in staging rather than relying on this source.

---

*Research completed: 2026-02-25*
*Supersedes: SUMMARY.md from 2026-02-18 (v1 platform research — retained in git history)*
*Ready for roadmap: yes*
