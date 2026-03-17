# Requirements: ScrollToday

**Defined:** 2026-02-18
**Core Value:** Advertisers can build and launch interactive, engagement-driven ad creatives in minutes -- no design skills, no code, no upfront cost to start.

## v1 Requirements (Milestone v1.0 — Completed 2026-02-24)

Requirements for initial release. All mapped to phases 1–10.

### Authentication & Admin

- [x] **AUTH-01**: Super admin can create user accounts for verified advertisers
- [x] **AUTH-02**: Super admin can view and manage all user accounts
- [x] **AUTH-03**: User can log in with email/password provided by admin
- [x] **AUTH-04**: User session persists across browser refresh
- [x] **AUTH-05**: User can change password on first login and anytime after
- [x] **AUTH-06**: Super admin can reset a user's password

### Template Library & Ad Editor

- [x] **TMPL-01**: User can browse templates by ad type and format hierarchy
- [x] **TMPL-02**: User can select a template and see it with default values
- [x] **TMPL-03**: User can customize template text, images, and redirect URL
- [x] **TMPL-04**: User can preview creative in desktop and mobile views
- [x] **TMPL-05**: User can save customized creative to their library
- [x] **TMPL-06**: User can generate a shareable preview link for a saved creative
- [x] **TMPL-07**: 20 curated templates available across 14 formats with predefined sizes

### Interactive Ad Formats

- [x] **INTV-01**: Swipeable carousel format (swipe through product cards)
- [x] **INTV-02**: 3D cube carousel format (rotating cube with content faces)
- [x] **INTV-03**: Scratch-to-reveal format (scratch overlay to reveal content)
- [x] **INTV-04**: Flipcard format (tap to flip and reveal other side)
- [x] **INTV-05**: Quiz/Poll format (answer questions, get result)
- [x] **INTV-06**: Swipe to reveal / before-after slider format
- [x] **INTV-07**: Click to expand/collapse accordion format

### Animated & Video Formats

- [x] **ANIM-01**: Animated banner format (CSS animation sequences)
- [x] **ANIM-02**: Countdown timer format (urgency-driven animated ad)
- [x] **ANIM-03**: Video with end card format (video plays, CTA at end)
- [x] **ANIM-04**: Click-to-play video format (thumbnail expands to video)

### Standard & Native Formats

- [x] **STND-01**: Static banner format (image + text + CTA)
- [x] **STND-02**: Multi-frame banner format (auto-rotating frames)
- [x] **STND-03**: In-feed native ad format (blends with publisher content)

### Ad Serving & Tag Export

- [x] **SERV-01**: Ad creative assets served from CDN
- [x] **SERV-02**: Impression tracking via cachebuster-based pixel with request_id linking
- [x] **SERV-03**: Click tracking with redirect URL handling
- [x] **SERV-04**: Ads stop serving immediately when impression credits hit zero (atomic credit deduction)
- [x] **SERV-05**: Tag export for DFP/GAM with correct macros
- [x] **SERV-06**: Embeddable ad tag/script for direct publisher placement
- [x] **SERV-07**: Viewability tracking (IAB/MRC standard: 50% visible for 1 second)

### Analytics & Tracking

- [x] **ANLYT-01**: Impressions count per creative and campaign
- [x] **ANLYT-02**: Click count and CTR per creative and campaign
- [x] **ANLYT-03**: Dwell time / engagement time per creative
- [x] **ANLYT-04**: Analytics dashboard with charts and time-series data
- [x] **ANLYT-05**: Analytics refresh on page reload (near-real-time)
- [x] **ANLYT-06**: CSV export of analytics data
- [x] **ANLYT-07**: Event-driven tracking with single ad_events table and request_id linking for full interaction sequence reconstruction

### Billing & Credits

- [x] **BILL-01**: Prepaid impression credit packs via Stripe (50k / 200k / 1M)
- [x] **BILL-02**: Credit balance always visible in header
- [x] **BILL-03**: Transaction history with receipts
- [x] **BILL-04**: Low-balance warning at 10% remaining
- [x] **BILL-05**: Free to create and preview ads without purchasing credits

### Campaign Management

- [x] **CAMP-01**: User can view all saved creatives in My Creatives library
- [x] **CAMP-02**: User can create, edit, and delete campaigns
- [x] **CAMP-03**: User can assign creatives to campaigns
- [x] **CAMP-04**: Ad status lifecycle: Draft -> Active -> Paused -> Archived

### Dashboard & UI

- [x] **UI-01**: Dashboard with ad type cards for browsing
- [x] **UI-02**: Sidebar navigation to all platform sections
- [x] **UI-03**: Footer with placeholder links (support, showcase, policies)
- [x] **UI-04**: Search functionality across ad formats and platform sections
- [x] **UI-05**: Platform Suite section with placeholder cards (Audio, ADCTV, Social Display)

### Data Schema & Infrastructure

- [x] **DATA-01**: Supabase as backend platform (PostgreSQL + Auth + Storage)
- [x] **DATA-02**: Event-driven immutable ad_events table with full event type set
- [x] **DATA-03**: Request ID system linking all events from a single ad exposure
- [x] **DATA-04**: Identity/context layer: anonymous users with cookie IDs, device normalization
- [x] **DATA-05**: Lean inventory schema: advertisers, campaigns, creatives (no publisher tables)
- [x] **DATA-06**: Pre-aggregated daily metrics rollup tables for fast dashboard performance
- [x] **DATA-07**: JSONB extra_data field on events for creative-specific custom data
- [x] **DATA-08**: Third-party tracker integration tables (tracker_configs, creative_trackers with fire conditions)
- [x] **DATA-09**: Monthly partitioning on ad_events table for query performance
- [x] **DATA-10**: Row-level security (RLS) for multi-tenant advertiser data isolation
- [x] **DATA-11**: CDN delivery for ad creative assets via Supabase Storage

---

## v2 Requirements (Milestone v2.0 — Started 2026-02-25)

Platform parity and enhancements. Phases start at 11.

### Campaign Enhancements (CAMP)

- [x] **CAMP-05**: User can view campaigns in a table layout showing Name, Advertiser, Last Modified, and impressions served
- [x] **CAMP-06**: User can search campaigns by name and by advertiser
- [x] **CAMP-07**: User can set Advertiser Name, Start Date, and End Date when creating or editing a campaign
- [x] **CAMP-08**: User can view per-campaign analytics (impressions, clicks, CTR) in an Analytics tab inside campaign detail
- [x] **CAMP-09**: User can view and copy ad tags for all campaign creatives from a Placements tab inside campaign detail
- [x] **CAMP-10**: User can duplicate a creative within a campaign

### Tracker Management (TRK)

- [x] **TRK-01**: User can access a dedicated Trackers page from the sidebar listing all tracker configurations
- [x] **TRK-02**: User can filter and search trackers by category (Conversion, Impression, Click) and name
- [x] **TRK-03**: User can create a tracker with Name, Category, Type (pixel/script), and URL template
- [x] **TRK-04**: User can bulk upload trackers via Excel with a preview step before committing, and downloadable sample templates per tracker category

### Analytics Enhancements (ANLYT)

- [x] **ANLYT-08**: User can see an hourly breakdown chart for any selected date
- [x] **ANLYT-09**: User can see lifetime totals (all-time impressions, clicks, CTR) as a separate section from date-range metrics
- [x] **ANLYT-10**: User can see a pie/donut chart showing each creative's share of total impressions for the selected date range
- [x] **ANLYT-11**: User can see a platform breakdown chart (Desktop / Mobile / Tablet) if device data is available in tracking pipeline
- [x] **ANLYT-12**: User can download any individual chart as a PNG image
- [x] **ANLYT-13**: User can download the full analytics report as XLS (with row-limit guard and CSV fallback)

### Reports (RPT)

- [x] **RPT-01**: User can create a named report with date range, data resolution (hourly/daily), and selected metrics (Impressions, Clicks, CTR, Viewability %)
- [x] **RPT-02**: User can view and re-run previously saved reports, organized by type (Display / Standard Banner / Tracker / Placement)
- [x] **RPT-03**: User can search saved reports by name
- [x] **RPT-04**: User can export any report as XLS

### Billing Enhancements (BILL)

- [x] **BILL-06**: User can see a consumption summary table showing impressions used and cost by creative type (Creatives, Static, Trackers, Videos) for a selected date range
- [x] **BILL-07**: User can see per-creative performance metrics (impressions, clicks, CTR, cost) in a paginated table on the billing page
- [x] **BILL-08**: User can filter the billing view by date range
- [x] **BILL-09**: User can download a billing statement as XLS

### Guide / Help (HELP)

- [x] **HELP-01**: User can access a Guide/Help page from the sidebar
- [x] **HELP-02**: Guide page shows categorized help topics (Getting Started, Ad Formats, Campaigns, Trackers, Billing & Credits, Analytics)

---

## Future Requirements (v3+)

Deferred. Not in current roadmap.

### Publisher Features

- **PUB-01**: Publisher accounts and dashboard
- **PUB-02**: Publisher/placement tables in schema
- **PUB-03**: Revenue share / payment system for publishers

### Advanced Formats

- **ADVF-01**: AMP ad format (strict AMPHTML spec compliance)
- **ADVF-02**: Social ad format export (social platform-specific sizes)
- **ADVF-03**: Playable / mini-game ad format
- **ADVF-04**: One-click format resizing across IAB sizes

### Advanced Features

- **ADVT-01**: Team/multi-user accounts with roles and permissions
- **ADVT-02**: Self-registration with email verification
- **ADVT-03**: Campaign flight date auto-enforcement (auto-activate/pause via cron)
- **ADVT-04**: Video completion rate tracking (25/50/75/100% quartiles)
- **ADVT-05**: Engagement interaction heatmap per creative
- **ADVT-06**: CTR benchmarking vs category averages
- **ADVT-07**: Dynamic Creative Optimization (DCO)
- **ADVT-08**: OAuth/social login
- **ADVT-09**: Agency hierarchy (agency -> client accounts -> users)
- **ADVT-10**: Scheduled report email delivery
- **ADVT-11**: Quick performance stats badge on creative cards

### Infrastructure Migration

- **INFRA-01**: Migration from Supabase to AWS/custom infrastructure
- **INFRA-02**: ClickHouse or dedicated OLAP for analytics at scale
- **INFRA-03**: Real-time streaming analytics (WebSocket-based)

---

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| AI-generated creative content | Generative AI quality for brand-safe ads requires heavy moderation; curated templates solve the same speed problem |
| Real-time bidding / programmatic buying | Entirely different product category (DSP); focus on creative tool + tag export |
| White-label / reseller mode | B2B2C platform complexity; validate direct advertiser model first |
| Audience targeting / segmentation | DSP territory; ScrollToday is creative + serving, not media buying |
| Native social media publishing | Each social API is a separate integration surface; export files instead |
| Landing page builder | Separate product category; redirect URLs link to advertiser's own pages |
| PPT/PowerPoint report export | Niche format; XLS covers reporting needs |
| Scheduled report email delivery | Email infrastructure complexity; deferred to v3 |
| Invalid Impressions / Fallback tracking | Requires ad validation layer changes; deferred to v3 |

---

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

### v1 Requirements (all Complete -- Phase 1-10)

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 through AUTH-06 | Phase 2 | Complete |
| TMPL-01 through TMPL-07 | Phase 4 | Complete |
| INTV-01 through INTV-07 | Phase 5 | Complete |
| ANIM-01 through ANIM-04 | Phase 6 | Complete |
| STND-01 through STND-03 | Phase 6 | Complete |
| SERV-01 through SERV-07 | Phase 7-8 | Complete |
| ANLYT-01 through ANLYT-07 | Phase 10 | Complete |
| BILL-01 through BILL-05 | Phase 9 | Complete |
| CAMP-01 through CAMP-04 | Phase 4, 7 | Complete |
| UI-01 through UI-05 | Phase 3 | Complete |
| DATA-01 through DATA-11 | Phase 1, 8 | Complete |

### v2 Requirements (Pending -- Phases 11-14)

| Requirement | Phase | Status |
|-------------|-------|--------|
| CAMP-05 | Phase 11 | Complete |
| CAMP-06 | Phase 11 | Complete |
| CAMP-07 | Phase 11 | Complete |
| CAMP-08 | Phase 12 | Complete |
| CAMP-09 | Phase 12 | Complete |
| CAMP-10 | Phase 12 | Complete |
| TRK-01 | Phase 11 | Complete |
| TRK-02 | Phase 11 | Complete |
| TRK-03 | Phase 11 | Complete |
| TRK-04 | Phase 14 | Complete |
| ANLYT-08 | Phase 13 | Complete |
| ANLYT-09 | Phase 13 | Complete |
| ANLYT-10 | Phase 13 | Complete |
| ANLYT-11 | Phase 13 | Complete |
| ANLYT-12 | Phase 13 | Complete |
| ANLYT-13 | Phase 13 | Complete |
| RPT-01 | Phase 14 | Complete |
| RPT-02 | Phase 14 | Complete |
| RPT-03 | Phase 14 | Complete |
| RPT-04 | Phase 14 | Complete |
| BILL-06 | Phase 14 | Complete |
| BILL-07 | Phase 14 | Complete |
| BILL-08 | Phase 14 | Complete |
| BILL-09 | Phase 14 | Complete |
| HELP-01 | Phase 11 | Complete |
| HELP-02 | Phase 11 | Complete |

**Coverage:**
- v2 requirements: 26 total
- Mapped to phases: 26/26
- Unmapped: 0

---
*Requirements defined: 2026-02-18*
*Last updated: 2026-02-25 -- v2.0 roadmap created, all 26 requirements mapped to phases 11-14*
