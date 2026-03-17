# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-25)

**Core value:** Advertisers can build and launch interactive, engagement-driven ad creatives in minutes -- no design skills, no code, no upfront cost to start.
**Current focus:** Milestone v2.0 -- ALL PHASES COMPLETE (including Phase 16)

## Current Position

Phase: 16 of 16 (Creatives Revamp) -- COMPLETE
Plan: 2 of 2 -- all plans complete
Status: Phase 16 complete. All v2.0 phases finished (14 core + 15 + 16).
Last activity: 2026-03-07 -- Plan 16-02 complete, verification passed 5/5, human approved

Progress: [####################] v1.0 complete, v2.0 complete

## Performance Metrics

**Velocity (v1.0):**
- Total plans completed: 25
- Average duration: ~7 min
- Total execution time: ~2.5 hours

**By Phase (v1.0):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 Foundation | 2/2 | ~35 min | ~18 min |
| 02 Authentication | 3/3 | ~26 min | ~9 min |
| 03 Dashboard Shell | 2/2 | ~15 min | ~8 min |
| 04 Template Library | 3/3 | ~28 min | ~9 min |
| 05 Interactive Ads | 2/2 | ~5 min | ~3 min |
| 06 Animated/Video/Std/Native | 3/3 | ~8 min | ~3 min |
| 07 Campaign Mgmt & Tag Export | 3/3 | ~9 min | ~3 min |
| 08 Ad Serving Infrastructure | 4/4 | ~23 min | ~6 min |
| 09 Billing & Credit System | 3/3 | ~12 min | ~4 min |
| 10 Analytics & Reporting | 2/2 | ~12 min | ~6 min |

*Updated after each plan completion*

**By Phase (v2.0):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 11 Foundation Enhancements | 4/4 | ~12 min | ~3 min |
| 12 Campaign Detail Enhancements | 2/2 | ~5 min | ~3 min |
| 13 Analytics Enhancements | 3/3 | ~11 min | ~4 min |
| 14 Custom Reports & Billing | 4/4 | ~9 min | ~2 min |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [v2.0 Roadmap]: 4 phases (11-14) derived from 26 requirements across 6 categories
- [v2.0 Roadmap]: TRK-04 (bulk tracker upload) deferred to Phase 14 (requires SheetJS installed in Phase 13)
- [v2.0 Roadmap]: ANLYT-11 (platform breakdown) conditional on device_type availability in tracking pipeline
- [v2.0 Roadmap]: Phases 12 and 13 can execute in parallel after Phase 11 (both depend on Foundation Enhancements)
- [11-01]: Fixed shadcn components.json resolvedPaths to prevent misplaced file output
- [11-01]: Tracker category defaults to 'impression' for backward compatibility with existing rows
- [11-02]: Used getColumns factory function pattern for TanStack Table column definitions with action callbacks
- [11-02]: Global filter with includesString for cross-column search on campaign name and advertiser
- [11-03]: Client-side category filter tabs with Button variant toggle for tracker filtering
- [11-03]: Added /trackers route and sidebar nav item (Rule 2 deviation for page reachability)
- [11-04]: Separated guide content data from page component for easy content updates
- [11-04]: Used Accordion type="multiple" so users can open several topics at once
- [12-01]: Lifted datePreset state to campaign detail page to survive tab switches
- [12-01]: Reused Phase 10 analytics components for campaign-scoped analytics view
- [12-01]: Used HTML table with Tailwind for placements table (consistent with project patterns)
- [12-02]: Spread-and-omit pattern for creative duplication (omit id/created_at/updated_at/preview_token)
- [12-02]: Triple cache invalidation on duplicate (campaign-creatives + campaigns + creatives)
- [12-02]: Duplicate button available for all creative statuses (no restrictions)
- [13-01]: Device breakdown RPC scoped to impression_served events only for KPI consistency
- [13-01]: SheetJS 0.20.3 from CDN tarball (npm registry 0.18.5 is stale/unmaintained)
- [13-01]: generate_series(0,23) LEFT JOIN for guaranteed 24-row hourly zero-fill
- [13-02]: ChartDownloadButton syncs external chartRef to useGenerateImage internal ref for PNG export
- [13-02]: fetchLifetimeMetrics uses 100k row safety cap with no date bounds for all-time aggregation
- [13-02]: CreativePieChart uses fixed 9-color palette cycling through chart CSS variables
- [13-03]: ExportButton calls exportToXls which internally falls back to CSV when rows exceed 1M (XLSX_ROW_LIMIT)
- [13-03]: MetricsChart uses local ref fallback when chartRef prop is undefined for standalone usage
- [13-03]: CsvExportButton preserved for backward compatibility in campaign detail tabs
- [14-01]: Reused handle_updated_at() trigger function from Phase 1 (no redefinition in migration)
- [14-01]: JSONB metrics column with default array for flexible metric selection storage
- [14-02]: Four billing buckets (Creatives, Static, Videos, Trackers) -- Trackers always shows zero since tracker_configs have no daily_metrics rows, but bucket shown per BILL-06 success criterion
- [14-02]: Client-side aggregation from raw daily_metrics rows for simplicity (no RPC needed)
- [14-02]: Reused DateRangeSelect and getDateRange from analytics module for consistency
- [14-03]: Reused existing trackerConfigSchema from tracker-types.ts for row validation (no schema duplication)
- [14-03]: Direct Supabase insert for bulk import rather than individual mutation calls (single batch operation)
- [14-04]: Re-exported analytics exportToXls as exportReportXls for code reuse without duplication
- [14-04]: useState-based form in builder dialog (no react-hook-form -- checkboxes simpler with direct state)
- [14-04]: safeReportData guard prevents rendering stale KPI cards when no report is actively re-running
- [16-01]: mt-0 wrapper on CreativesNewPage to override cr-root margin-top:84px (no fixed top-nav in app shell)
- [16-01]: Dropped &format= query param from search dialog links (old branching logic removed)
- [16-02]: pickCategory expects cat.id not cat.key -- two-step lookup required (find by key, pass id)
- [16-02]: Mount-only useEffect with [] deps and eslint-disable for one-time initialization from props
- [16-02]: Video slug has no matching fmtData category -- undefined fallback opens step 0 (correct behavior)

### Pending Todos

- Creatives save/reload fidelity rework (deferred from Phase 6 verification)

### Blockers/Concerns

- GSAP license compliance needs legal review before production launch
- GAM tag format must be validated against real GAM sandbox account before launch
- Docker Desktop not available on dev machine -- limits supabase CLI features (gen types, local dev)
- ANLYT-11: RESOLVED -- device_type confirmed present in ad_events.extra_data (track-event Edge Function stores it via normalizeDevice())

## Session Continuity

Last session: 2026-03-07
Stopped at: Plan 16-02 complete (category pre-selection via URL param). Phase 16 plans 01-02 done.
Resume file: None
