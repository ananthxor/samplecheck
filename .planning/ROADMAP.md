# Roadmap: ScrollToday

## Overview

ScrollToday goes from zero to a functional self-service ad platform across 10 phases. The journey starts with Supabase infrastructure and authentication, builds the creative layer (template library, ad editor, interactive/animated/standard formats), then layers on campaign management, ad serving, billing, and analytics. Each phase delivers a coherent capability that can be verified independently. The interactive ad formats -- ScrollToday's core differentiator -- are split into three phases (interactive, animated/video, standard/native) so each format category gets focused implementation and testing against the renderer interface pattern established in the template library phase.

## v1.0 Phases (Complete)

<details>
<summary>v1.0 Core Platform (Phases 1-10) - SHIPPED 2026-02-24</summary>

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Data Schema** - Supabase setup, database schema, storage, and project scaffolding
- [x] **Phase 2: Authentication & Admin** - Invite-only auth system with super admin account management
- [x] **Phase 3: Dashboard & Navigation Shell** - Application shell with routing, sidebar, dashboard layout, and search
- [x] **Phase 4: Template Library & Ad Editor** - Template browsing, creative customization, preview, and save-to-library workflow
- [x] **Phase 5: Interactive Ad Formats** - Seven interactive format renderers (carousel, cube, scratch, flipcard, quiz, slider, accordion)
- [x] **Phase 6: Animated, Video, Standard & Native Formats** - Animated banners, countdown timers, video formats, static banners, multi-frame, and native ads
- [x] **Phase 7: Campaign Management & Tag Export** - Campaign CRUD, creative assignment, ad lifecycle, and tag/embed code generation
- [x] **Phase 8: Ad Serving Infrastructure** - Serve endpoint, ad SDK, event ingestion, cachebuster tracking, viewability, and credit gate
- [x] **Phase 9: Billing & Credit System** - Stripe prepaid credit packs, credit ledger, balance display, low-balance warnings, and transaction history
- [x] **Phase 10: Analytics & Reporting** - Analytics rollup pipeline, dashboard with charts, time-series data, CSV export, and near-real-time refresh (completed 2026-02-24)

### Phase 1: Foundation & Data Schema
**Goal**: A working Supabase-backed project with the complete lean schema, storage buckets, and development environment ready for all subsequent phases
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-05, DATA-07, DATA-09, DATA-10, DATA-11
**Success Criteria** (what must be TRUE):
  1. Supabase project is provisioned with PostgreSQL database containing all core tables (advertisers, campaigns, creatives, ad_events, daily_metrics) and the schema is queryable
  2. The ad_events table is partitioned monthly and accepts inserts with all defined event types and request_id linking
  3. Row-level security policies enforce that an advertiser can only read/write their own data
  4. Supabase Storage bucket exists for creative assets and files can be uploaded and retrieved via CDN URL
  5. React + TypeScript frontend project builds and runs locally with Supabase client configured
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md -- Supabase project setup, complete database schema migration with RLS, storage bucket, and environment config
- [x] 01-02-PLAN.md -- pnpm monorepo scaffolding with React + Vite 6 + Tailwind CSS 4 frontend and Supabase client wiring

### Phase 2: Authentication & Admin
**Goal**: Verified advertisers can log in to accounts created by a super admin, with session persistence and password management
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06
**Success Criteria** (what must be TRUE):
  1. Super admin can create a new advertiser account by providing email and initial password, and the account appears in the admin user list
  2. User can log in with admin-provided email and password and is prompted to change password on first login
  3. User session persists across browser refresh without requiring re-login
  4. Super admin can view all user accounts and reset any user's password
  5. User can change their own password from account settings at any time
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md -- Supabase Edge Functions for admin user management (create, list, reset-password)
- [x] 02-02-PLAN.md -- Client-side auth system (AuthProvider, login, change-password, protected routes)
- [x] 02-03-PLAN.md -- Admin user management UI (user list, create/reset dialogs, settings page)

### Phase 3: Dashboard & Navigation Shell
**Goal**: Users land on a functional dashboard with navigation to all platform sections, ad type browsing cards, and search
**Depends on**: Phase 2
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05
**Success Criteria** (what must be TRUE):
  1. After login, user sees a dashboard with ad type cards they can click to browse templates for that type
  2. Sidebar navigation provides access to all platform sections (dashboard, creatives, campaigns, analytics, billing, settings)
  3. Search bar returns results across ad formats and platform sections
  4. Platform Suite section displays placeholder cards for future products (Audio, ADCTV, Social Display)
  5. Footer displays placeholder links for support, showcase, and policy pages
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md -- Application shell: shadcn/ui components, collapsible sidebar navigation, header, footer, router refactor, existing page refactoring
- [x] 03-02-PLAN.md -- Dashboard page: ad type cards, Platform Suite section, command palette search dialog

### Phase 4: Template Library & Ad Editor
**Goal**: Users can browse templates, customize a creative with their own content, preview it, save it to their library, and share a preview link
**Depends on**: Phase 3
**Requirements**: TMPL-01, TMPL-02, TMPL-03, TMPL-04, TMPL-05, TMPL-06, TMPL-07, CAMP-01
**Success Criteria** (what must be TRUE):
  1. User can browse 20 curated templates organized by ad type and format hierarchy, and select any template to see it rendered with default values
  2. User can customize template text, images, and redirect URL, and see changes reflected in a live preview
  3. User can toggle between desktop and mobile preview of their creative
  4. User can save a customized creative to their My Creatives library and see it listed there with status and thumbnail
  5. User can generate a shareable preview link for any saved creative that opens in a new browser without requiring login
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md -- Template data foundation: 20 templates with typed config schemas, template browsing page with filters
- [x] 04-02-PLAN.md -- Ad editor: split-pane layout with live iframe preview, creatives CRUD API, save workflow
- [x] 04-03-PLAN.md -- My Creatives library, shareable preview links, public preview page, dual-mode /creatives route

### Phase 5: Interactive Ad Formats
**Goal**: All seven interactive format renderers are implemented, each as an isolated renderer conforming to the ad-type-agnostic builder interface
**Depends on**: Phase 4
**Requirements**: INTV-01, INTV-02, INTV-03, INTV-04, INTV-05, INTV-06, INTV-07
**Success Criteria** (what must be TRUE):
  1. User can create a swipeable carousel ad by adding product cards, and the preview responds to swipe/click gestures
  2. User can create a scratch-to-reveal ad where the preview overlay responds to mouse/touch scratch gestures to reveal content underneath
  3. User can create a quiz/poll ad where the preview captures answer selections and shows a result
  4. User can create flipcard, 3D cube carousel, swipe-to-reveal slider, and accordion ads, each with working interaction in preview
  5. Each interactive format can be saved, loaded from My Creatives, and rendered identically after reload
**Plans**: 2 plans

Plans:
- [x] 05-01-PLAN.md -- Carousel, flipcard, and accordion interactive renderers with CSS styles and swipe/click/expand interactions
- [x] 05-02-PLAN.md -- Cube, scratch-to-reveal, before-after slider, and quiz/poll renderers completing all 7 interactive formats

### Phase 6: Animated, Video, Standard & Native Formats
**Goal**: All animated, video, standard, and native format renderers are implemented, completing the full 14-format template library
**Depends on**: Phase 4
**Requirements**: ANIM-01, ANIM-02, ANIM-03, ANIM-04, STND-01, STND-02, STND-03
**Success Criteria** (what must be TRUE):
  1. User can create an animated banner with GSAP/CSS animation sequences that plays correctly in preview
  2. User can create a countdown timer ad that displays a live countdown in preview
  3. User can create video ads (video with end card, click-to-play) where video plays in preview and CTA/end card appears at completion
  4. User can create static banner, multi-frame rotating banner, and in-feed native ad format, each rendering correctly in preview
  5. All seven formats can be saved, loaded from My Creatives, and rendered identically after reload
**Plans**: 3 plans

Plans:
- [x] 06-01-PLAN.md -- Animated banner (CSS @keyframes entrance animations) and countdown timer (live ticking digits) renderers
- [x] 06-02-PLAN.md -- Video infrastructure (iframe autoplay, video cleanup) and video-endcard + click-to-play renderers
- [x] 06-03-PLAN.md -- Standard/native format polish: static-banner hover, multi-frame dot indicators, in-feed Sponsored badge

### Phase 7: Campaign Management & Tag Export
**Goal**: Users can organize creatives into campaigns, manage ad lifecycle status, and get embeddable ad tags for serving
**Depends on**: Phase 4
**Requirements**: CAMP-02, CAMP-03, CAMP-04, SERV-05, SERV-06, DATA-08
**Success Criteria** (what must be TRUE):
  1. User can create, edit, and delete campaigns, and assign one or more creatives to a campaign
  2. User can change ad status through the lifecycle: Draft to Active to Paused to Archived
  3. User can copy a DFP/GAM-compatible tag with correct macros for any active creative
  4. User can copy an embeddable ad tag/script for direct placement on any website
  5. Third-party tracker configuration is available with URL templates and fire conditions (on_load, on_viewable, on_click, on_engagement)
**Plans**: 3 plans

Plans:
- [x] 07-01-PLAN.md -- Campaign CRUD API, React Query hooks, status lifecycle machine, campaigns list page with create/edit/delete
- [x] 07-02-PLAN.md -- Tracker database migration, shared types update, tag generator utilities, tracker CRUD API and hooks
- [x] 07-03-PLAN.md -- Campaign detail page with creative assignment, status transitions, tag export dialogs, tracker config UI

### Phase 8: Ad Serving Infrastructure
**Goal**: Active ads are served to end users via tag or embed, with impression/click/engagement tracking, viewability measurement, and atomic credit deduction that stops serving at zero balance
**Depends on**: Phase 7
**Requirements**: SERV-01, SERV-02, SERV-03, SERV-04, SERV-07, DATA-04
**Success Criteria** (what must be TRUE):
  1. Loading an ad tag in a browser renders the correct creative with assets served from CDN
  2. Each ad load generates a unique request_id, fires an impression tracking pixel with cachebuster, and the impression appears in the ad_events table
  3. Clicking the ad tracks the click event with the same request_id and redirects to the correct destination URL
  4. Viewability is tracked per IAB/MRC standard (50% visible for 1 second) and viewable impressions are recorded as events
  5. When an advertiser's credit balance reaches zero, subsequent ad requests return no creative (ads stop serving immediately), verified under concurrent load
**Plans**: 4 plans

Plans:
- [x] 08-01-PLAN.md -- Database migration (credit_balance, rendered_html, deduct function), shared TypeScript types, and tracking utilities
- [x] 08-02-PLAN.md -- Editor rendered_html save flow, track-event and click-redirect Edge Functions
- [x] 08-03-PLAN.md -- serve-ad Edge Function with tracking injection, viewability, credit gate, and anonymous identity
- [x] 08-04-PLAN.md -- Deploy all Edge Functions and end-to-end verification checkpoint

### Phase 9: Billing & Credit System
**Goal**: Advertisers can purchase prepaid impression credit packs via Stripe, see their balance at all times, and receive warnings before credits run out
**Depends on**: Phase 8
**Requirements**: BILL-01, BILL-02, BILL-03, BILL-04, BILL-05, DATA-06
**Success Criteria** (what must be TRUE):
  1. User can purchase impression credit packs (50k / 200k / 1M) through a Stripe checkout flow and see credits added to their balance within seconds
  2. Credit balance is always visible in the application header and updates after purchases and impression consumption
  3. User receives a low-balance warning notification when credits drop below 10% of last purchased pack
  4. User can view transaction history with receipts for all credit purchases
  5. User can create and preview ads without purchasing credits (free to create, pay to serve)
**Plans**: 3 plans

Plans:
- [x] 09-01-PLAN.md -- Database migration (credit_transactions, add_impression_credits, daily_metrics rollup, pg_cron) and Stripe Edge Functions (create-checkout, stripe-webhook)
- [x] 09-02-PLAN.md -- Credit balance badge in app header with 30s polling, billing API layer, low-balance warning toast
- [x] 09-03-PLAN.md -- Billing page with credit pack cards, Stripe Checkout flow, transaction history table, router update

### Phase 10: Analytics & Reporting
**Goal**: Advertisers see rich engagement analytics on a dashboard that updates on page refresh, with charts, time-series breakdowns, and CSV export
**Depends on**: Phase 8
**Requirements**: ANLYT-01, ANLYT-02, ANLYT-03, ANLYT-04, ANLYT-05, ANLYT-06, ANLYT-07
**Success Criteria** (what must be TRUE):
  1. Analytics dashboard displays impressions, clicks, CTR, and dwell time per creative and per campaign
  2. Dashboard shows time-series charts with configurable date ranges
  3. Refreshing the page loads the latest analytics data (near-real-time, not stale)
  4. User can export analytics data to CSV for any creative, campaign, or date range
  5. Raw ad_events are aggregated into pre-computed daily rollup tables, and the dashboard reads exclusively from rollups (never queries raw events directly)
**Plans**: 2 plans

Plans:
- [x] 10-01-PLAN.md -- Database migration (rollup_today_metrics function, composite index), Recharts + shadcn chart install, analytics data layer (API, hooks, types, CSV utility)
- [x] 10-02-PLAN.md -- Analytics dashboard UI (KPI cards, time-series chart, metrics table, date range selector, filters, CSV export) and router wiring

</details>

---

## v2.0 Phases (Platform Parity & Enhancements)

v2.0 closes feature gaps vs. Airtory and improves platform usability across campaign management, tracker management, analytics, custom reports, billing, and help. Four phases (11-14) deliver 26 requirements, ordered by dependency: shared infrastructure before consumers, zero-migration frontend work before schema changes, table-stakes features before differentiators.

- [x] **Phase 11: Foundation Enhancements** - Campaign table with search, campaign date fields, dedicated tracker page with CRUD, and guide/help page (completed 2026-02-25)
- [x] **Phase 12: Campaign Detail Enhancements** - Per-campaign analytics tab, placements tab, and creative duplication (completed 2026-02-25)
- [x] **Phase 13: Analytics Enhancements** - Hourly breakdown, lifetime totals, pie/donut chart, platform breakdown, PNG chart download, and XLS export (completed 2026-02-25)
- [x] **Phase 14: Custom Reports & Billing Enhancements** - Saved report builder with XLS export, billing spend summary with per-creative table, and bulk tracker upload (completed 2026-02-27)

## v2.0 Phase Details

### Phase 11: Foundation Enhancements
**Goal**: Users can manage campaigns in a professional table layout with search and date metadata, access all tracker configurations from a dedicated top-level page, and find platform guidance on a help page
**Depends on**: Phase 10 (v1.0 complete)
**Requirements**: CAMP-05, CAMP-06, CAMP-07, TRK-01, TRK-02, TRK-03, HELP-01, HELP-02
**Success Criteria** (what must be TRUE):
  1. User sees campaigns in a table with Name, Advertiser, Last Modified, and impressions served columns, and can sort by any column
  2. User can search campaigns by typing a name or advertiser and see the table filter in real time
  3. User can set Advertiser Name, Start Date, and End Date when creating or editing a campaign, and these values persist after save
  4. User can navigate to a Trackers page from the sidebar, see all tracker configurations listed, filter by category (Conversion, Impression, Click), search by name, and create/edit/delete trackers
  5. User can navigate to a Guide page from the sidebar and browse categorized help topics covering Getting Started, Ad Formats, Campaigns, Trackers, Billing & Credits, and Analytics
**Plans**: 4 plans

Plans:
- [x] 11-01-PLAN.md -- Database migration (campaign dates, tracker category), dependency installation, shared type updates
- [x] 11-02-PLAN.md -- Campaign data table with sorting, search, impressions column, and extended form with date fields
- [x] 11-03-PLAN.md -- Dedicated trackers page with category filter tabs, name search, and full CRUD
- [x] 11-04-PLAN.md -- Guide page with categorized help topics, sidebar/search/router updates for all new routes

### Phase 12: Campaign Detail Enhancements
**Goal**: Users can drill into any campaign to see its analytics, copy ad tags for all its creatives, and duplicate creatives without rebuilding from scratch
**Depends on**: Phase 11
**Requirements**: CAMP-08, CAMP-09, CAMP-10
**Success Criteria** (what must be TRUE):
  1. User can open a campaign and switch to an Analytics tab that shows impressions, clicks, and CTR scoped to that campaign's creatives with a date range selector
  2. User can open a campaign and switch to a Placements tab that lists all assigned creatives with one-click copy buttons for DFP and embed tags
  3. User can duplicate any creative within a campaign, see the copy appear immediately in the creative list with a "(Copy)" suffix, and edit it independently of the original
**Plans**: 2 plans

Plans:
- [ ] 12-01-PLAN.md -- Tabbed campaign detail layout (Creatives/Analytics/Placements), analytics tab with campaign-scoped KPIs and chart, placements tab with inline tag copy
- [ ] 12-02-PLAN.md -- Creative duplication API, mutation hook, and duplicate button on creative cards

### Phase 13: Analytics Enhancements
**Goal**: Users get deeper analytics insight with hourly drill-downs, lifetime totals, visual breakdowns by creative and platform, and can export charts as images or the full report as Excel
**Depends on**: Phase 11
**Requirements**: ANLYT-08, ANLYT-09, ANLYT-10, ANLYT-11, ANLYT-12, ANLYT-13
**Success Criteria** (what must be TRUE):
  1. User can select any single date and see an hourly breakdown chart (24-hour X-axis) showing impressions and clicks per hour
  2. User can see a lifetime totals section (all-time impressions, clicks, CTR) displayed separately above the date-range-filtered metrics
  3. User can see a pie/donut chart showing each creative's share of total impressions for the selected date range
  4. User can see a platform breakdown chart (Desktop / Mobile / Tablet) if device data is available in the tracking pipeline (conditional on device_type being stored in ad_events)
  5. User can click a download button on any chart to save it as a PNG image, and can export the full analytics report as an XLS workbook (with CSV fallback for large datasets)
**Plans**: 3 plans

Plans:
- [x] 13-01-PLAN.md -- Supabase migration (fetch_hourly_metrics + fetch_device_breakdown RPCs), recharts-to-png and SheetJS 0.20.3 installation
- [x] 13-02-PLAN.md -- Analytics data layer extensions (types, API, hooks) and five new chart components (HourlyChart, CreativePieChart, PlatformChart, LifetimeKpiCards, ChartDownloadButton)
- [x] 13-03-PLAN.md -- XLS export utility, ExportButton, analytics page assembly, MetricsChart PNG download, and human verification

### Phase 14: Custom Reports & Billing Enhancements
**Goal**: Users can build, save, and re-run named reports with custom metrics and date ranges, see billing consumption breakdowns by creative type and per-creative performance, and bulk-upload trackers via Excel
**Depends on**: Phase 13
**Requirements**: RPT-01, RPT-02, RPT-03, RPT-04, BILL-06, BILL-07, BILL-08, BILL-09, TRK-04
**Success Criteria** (what must be TRUE):
  1. User can create a named report by selecting a date range, data resolution (hourly/daily), and specific metrics (Impressions, Clicks, CTR, Viewability %), and save it for later re-use
  2. User can view previously saved reports organized by type, search them by name, and re-run any saved report to get fresh data
  3. User can export any report as an XLS file
  4. User can see a billing consumption summary showing impressions used and cost broken down by creative type (Creatives, Static, Trackers, Videos) for a selected date range, and can see per-creative performance metrics (impressions, clicks, CTR, cost) in a paginated table
  5. User can bulk upload trackers via an Excel file with a preview step before committing, using downloadable sample templates per tracker category
**Plans**: 4 plans

Plans:
- [ ] 14-01-PLAN.md -- saved_reports Supabase migration (table + indexes + RLS + updated_at trigger)
- [ ] 14-02-PLAN.md -- Billing consumption data layer + UI: 3-bucket summary cards, paginated per-creative table, date filter, XLS export
- [ ] 14-03-PLAN.md -- Tracker bulk upload: Excel parse + Zod validation + preview dialog + sample template download
- [ ] 14-04-PLAN.md -- Custom reports feature: API + hooks + builder dialog + saved reports list + /reports page + router + sidebar

### Phase 15: Ad Tag Bundler & Self-Contained Creative Delivery
**Goal**: Transition from the current iframe-wrapper rendering approach (renderer-shell.ts) to a self-contained Ad Tag Bundler that packages configuration, SDK, and logic into a single distributable payload with granular format-specific tracking.
**Depends on**: Phase 14
**Requirements**: BDL-01, BDL-02, BDL-03, BDL-04, BDL-05, BDL-06
**Success Criteria** (what must be TRUE):
  1. A standalone SDK utility handles viewability, heartbeat, and granular tracking without React context.
  2. The Ad Bundler replaces renderer-shell.ts to pre-compile the JS/CSS/Config into a single self-contained payload.
  3. Interactive formats natively trigger granular engagement tracking via the new SDK.
  4. The `serve-ad` edge function smoothly injects runtime configuration into the payload instead of brittle script tag replacements.
**Plans**: 3 plans

Plans:
- [ ] 15-01-PLAN.md -- Telemetry Engine & Bundler Core in ad-sdk
- [ ] 15-02-PLAN.md -- Refactoring Renderers for Bundler and Granular Tracking
- [ ] 15-03-PLAN.md -- Serve API Refactor and Tag Export Updates

### Phase 16: Creatives Revamp
**Goal**: Replace the old 2-format template grid with the new 498-format 4-step Creatives browser, wired correctly into routing so the dashboard ad-type cards deep-link to the right category and the format selector only appears on the Create New flow
**Depends on**: Phase 15
**Requirements**: CRV-01, CRV-02, CRV-03, CRV-04, CRV-05
**Success Criteria** (what must be TRUE):
  1. Clicking an Ad Type card on the Dashboard (e.g. "Interactive") navigates to `/creatives/new?type=interactive` and the 4-step browser opens with that category pre-selected (step 2: Ad Size), skipping step 1
  2. Navigating to `/creatives` shows the existing Creatives list (not the format browser)
  3. Clicking "Create New" from the Creatives list navigates to `/creatives/new` and shows the full 4-step browser starting at step 1 (Choose Ad Type)
  4. All 498 formats from fmtData.ts are visible and browsable in the correct category hierarchy
  5. The FormatDetails modal opens correctly for any format and shows its fields, tags, and best practices
**Plans**: 2 plans

Plans:
- [x] 16-01-PLAN.md -- Route restructure: restore /creatives list, add /creatives/new with 4-step browser, dashboard card deep-link wiring
- [x] 16-02-PLAN.md -- Category pre-selection: read `?type=` param in CreativesSelector, map dashboard slug → fmtData category, skip to step 2

## Progress

**Execution Order:**
v1.0: 1 -> 2 -> 3 -> 4 -> 5 (and 6 in parallel after 4) -> 7 -> 8 -> 9 (and 10 in parallel after 8)
v2.0: 11 -> 12 (and 13 in parallel after 11) -> 14 -> 15 -> 16

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Data Schema | v1.0 | 2/2 | Complete | 2026-02-19 |
| 2. Authentication & Admin | v1.0 | 3/3 | Complete | 2026-02-19 |
| 3. Dashboard & Navigation Shell | v1.0 | 2/2 | Complete | 2026-02-20 |
| 4. Template Library & Ad Editor | v1.0 | 3/3 | Complete | 2026-02-20 |
| 5. Interactive Ad Formats | v1.0 | 2/2 | Complete | 2026-02-20 |
| 6. Animated, Video, Standard & Native Formats | v1.0 | 3/3 | Complete | 2026-02-23 |
| 7. Campaign Management & Tag Export | v1.0 | 3/3 | Complete | 2026-02-23 |
| 8. Ad Serving Infrastructure | v1.0 | 4/4 | Complete | 2026-02-24 |
| 9. Billing & Credit System | v1.0 | 3/3 | Complete | 2026-02-24 |
| 10. Analytics & Reporting | v1.0 | 2/2 | Complete | 2026-02-24 |
| 11. Foundation Enhancements | v2.0 | 4/4 | Complete | 2026-02-25 |
| 12. Campaign Detail Enhancements | v2.0 | 2/2 | Complete | 2026-02-25 |
| 13. Analytics Enhancements | v2.0 | 3/3 | Complete | 2026-02-25 |
| 14. Custom Reports & Billing | v2.0 | 4/4 | Complete | 2026-02-27 |
| 15. Ad Tag Bundler | v2.0 | 0/3 | Pending | - |
| 16. Creatives Revamp | v2.0 | 2/2 | Complete | 2026-03-07 |
