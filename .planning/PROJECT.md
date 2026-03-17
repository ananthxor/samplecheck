# ScrollToday

## What This Is

An interactive-first self-service digital advertising platform where direct advertisers can create ad creatives from curated templates, customize them, serve ads through self-hosted infrastructure or export tags for third-party ad servers, and track rich engagement analytics. Competing in the same space as Airtory but leading with interactive ad formats and a frictionless freemium-to-prepaid monetization model.

## Core Value

Advertisers can build and launch interactive, engagement-driven ad creatives in minutes — no design skills, no code, no upfront cost to start.

## Current Milestone: v2.0 — Platform Parity & Enhancements

**Goal:** Close feature gaps vs. Airtory and improve platform usability — dedicated Tracker management, campaign enhancements, analytics improvements, custom reports, billing enhancements, and a Guide page.

**Target features:**
- Dedicated Tracker Management page (top-level sidebar)
- Campaign enhancements (table view, search, advertiser/flight date fields, per-campaign analytics + placements tabs, creative duplicate)
- Analytics enhancements (hourly chart, lifetime metrics, pie/platform charts, PNG/XLS export)
- Custom Reports page (named saved reports, metric selection, XLS export)
- Billing enhancements (spend summary by type, per-creative performance table, date filter, download)
- Guide/Help page with categorized topics

## Requirements

### Validated

✓ Template-based ad builder with customization (text, images, redirect URLs) — v1.0
✓ 20 curated templates across 14 formats (7 interactive, 4 animated/video, 3 standard/native) — v1.0
✓ Self-hosted ad serving + tag/script export for third-party ad servers (DFP/GAM) — v1.0
✓ Rich engagement analytics dashboard (impressions, clicks, CTR, dwell time, viewability) — v1.0
✓ Prepaid impression credit system (free to create, pay to serve) with Stripe — v1.0
✓ Impression credit tiers (50k / 200k / 1M) with low-balance warnings — v1.0
✓ User authentication (invite-only, email/password) with super admin management — v1.0
✓ Campaign management with creative assignment and ad lifecycle — v1.0
✓ Cachebuster-based event tracking for ad interactions — v1.0

### Active

- [ ] Campaign table layout with Name, Advertiser, Last Modified, Impressions served
- [ ] Campaign search (by name and advertiser)
- [ ] Campaign Advertiser Name + Start/End date fields
- [ ] Per-campaign Analytics tab inside campaign detail
- [ ] Per-campaign Placements tab inside campaign detail
- [ ] Creative duplication within a campaign
- [ ] Dedicated Trackers page (top-level sidebar) with full CRUD + bulk Excel upload
- [ ] Hourly breakdown chart + lifetime totals section in Analytics
- [ ] Pie/donut by creative + platform breakdown chart in Analytics
- [ ] PNG download per chart + XLS export of full analytics report
- [ ] Custom Reports page (named reports, metric selection, date range, XLS export)
- [ ] Billing spend/consumption summary + per-creative performance table + date filter + download
- [ ] Guide/Help page accessible from sidebar

### Out of Scope

- Agency accounts / multi-tenant hierarchy — adds complexity, defer until core works
- Multi-user accounts with roles/permissions — single user per account for v1
- Publisher-facing features — requires ad network infrastructure and revenue share model
- Full canvas/WYSIWYG ad editor — template customization only for v1
- Real-time streaming analytics — refresh-based is sufficient
- Platform Suite integrations (Audio, ADCTV, Social Display) — future scope with partners
- Footer content pages (Help & Support, Showcase, Creative Policy, Privacy Policy) — placeholder links for v1, content later
- OAuth/social login — email/password sufficient for v1

## Context

- **Competitive landscape:** Primary competitor is Airtory (500+ templates, $2.25M funding, 24 employees, CPM-based freemium model). ScrollToday differentiates by being interactive-first — fewer templates but higher quality interactive creatives.
- **Positioning:** Interactive-first ad platform. While offering all ad types (static, animated, standard banners), the brand leads with rich interactive formats (swipeable, playable, quizzes, polls, scratch-to-reveal) that drive engagement over raw impressions.
- **Ad type hierarchy:** Ad Type → Format → Templates/creatives. 14 formats across interactive, animated, video, standard, and native categories. Each template has predefined sizes (some responsive).
- **Monetization model:** Free to create and preview ads (zero friction onboarding). Prepaid impression credit packs to serve. Revenue collected before infrastructure cost incurred.
- **Target users:** Direct advertisers — brands and businesses creating and running their own digital ad campaigns. Invite-only: admin creates accounts after verifying advertisers.
- **Ad serving:** Dual approach — self-hosted serving with CDN for assets, plus exportable ad tags for programmatic via third-party ad servers (DFP/GAM).
- **Tracking:** Event-driven immutable ad_events table. All events from a single ad exposure share a request_id for full interaction sequence reconstruction. Cachebusters on tracking pixels. Event types: impression_served, impression_viewable, engagement, click, video_play/pause/complete, expand, collapse, close.
- **Data architecture:** Supabase for v1 (PostgreSQL + Auth + Storage + Edge Functions). Lean schema: advertisers, campaigns, creatives, ad_events, daily metrics rollups. No publisher/placement tables in v1. Monthly partitioning on ad_events. RLS for multi-tenant isolation. JSONB extra_data for creative-specific payloads. Append-only credit ledger for billing. Migration to AWS/custom infrastructure planned for scale.
- **Third-party trackers:** Tracker config tables with URL templates and macros. Creative-tracker mappings with fire conditions (on_load, on_viewable, on_click, on_engagement).

## Constraints

- **Tech stack**: React + TypeScript frontend, Supabase backend (PostgreSQL + Auth + Storage)
- **Template count**: Starting with 20 curated templates across 14 formats
- **Single-user accounts**: No team/permission system in v1 (admin-created accounts only)
- **No timeline pressure**: No specific launch deadline
- **Supabase for v1**: Plan for eventual migration to AWS/custom infrastructure at scale

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Interactive-first positioning | Differentiates from Airtory's volume play; interactive ads command premium CPMs | — Pending |
| Prepaid impression credits (not pay-as-you-go) | Startup-safe: revenue before cost, no invoicing, no bad debt. Free creation removes friction | — Pending |
| Template customization only (no canvas editor) | Faster to ship, sufficient for v1, full editor is massive scope | — Pending |
| Direct advertisers only (no publishers) | Publishers require ad network infrastructure and revenue share — different business model | — Pending |
| Single user per account | Simplifies auth for v1; multi-user with roles can be added later | — Pending |
| React + TypeScript | User preference; strong ecosystem for complex UI applications | — Pending |
| Near-real-time analytics (refresh-based) | Simpler than WebSocket streaming; matches Airtory's current behavior | — Pending |
| Supabase for v1 backend | Fast to market with built-in auth, PostgreSQL, storage; migrate to AWS at scale | — Pending |
| Invite-only accounts (admin-created) | Quality control, prevents abuse of free creation, controlled growth | — Pending |
| Event-driven ad_events with request_id | Immutable audit trail, full funnel reconstruction, single table simplicity | — Pending |
| Lean schema (no publisher tables in v1) | Direct advertisers only; publisher features add when that business model activates | — Pending |

---
*Last updated: 2026-02-25 after v2.0 milestone start*
