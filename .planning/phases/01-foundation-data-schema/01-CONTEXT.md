# Phase 1: Foundation & Data Schema - Context

**Gathered:** 2026-02-18
**Updated:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up the Supabase-backed infrastructure, database schema with core tables needed for the immediate phases, storage buckets for creative assets, and scaffold the React + TypeScript frontend project. This phase delivers the foundation everything else builds on — no UI, no features, just working infrastructure and schema.

</domain>

<decisions>
## Implementation Decisions

### Supabase Project Setup
- Starting from scratch — no existing Supabase account or project
- Supabase Cloud only for development (no local Docker/CLI setup)
- Two environments: dev + prod (separate Supabase projects)
- Region: Claude's discretion (consider Mumbai for Indian dev proximity, or US if targeting US advertisers)

### Schema Scope Strategy
- **Incremental per phase** — Phase 1 creates only the tables it can verify against its success criteria. Later phases add their own domain tables via Supabase migrations.
- Phase 1 tables: advertisers, creatives, ad_events, daily_metrics (campaigns table: Claude decides whether to include — it's referenced in success criteria and creatives may need the FK)
- **Deferred to later phases:** credit_ledger (Phase 9: Billing), trackers/creative_trackers (Phase 7: Campaign Management)
- No publisher/placement tables in v1 (lean schema)
- Rationale: Avoids premature schema decisions for tables that can't be verified yet; each phase owns its migrations

### Database Table Design
- Project Details doc (MongoDB-style models) used as **inspiration** — reference fields and relationships, but Claude redesigns for PostgreSQL/Supabase best practices (normalized tables, proper FKs, UUIDs)
- Claude derives all columns, types, and relationships from v1 requirements — no specific field mandates from user
- ad_events table: monthly partitioned, request_id linking, all event types, JSONB extra_data
- schema_version field on creative records from first commit (prevent schema lock-in pitfall)
- RLS policies for multi-tenant advertiser data isolation
- Super admin: Claude decides implementation (role flag vs separate table)
- Seed data: Claude decides (practical for dev testing)

### Frontend Project Structure
- Monorepo vs single app: Claude decides (research suggested monorepo with web app + ad SDK + shared types)
- Package manager: Claude decides (research suggested pnpm for monorepo efficiency)
- UI component library: Claude decides (research suggested shadcn/ui + Tailwind CSS 4)
- Folder structure: Claude decides (feature-based vs type-based)
- Build tool: Vite 6 (from research)
- State management: Zustand 5 for editor state, TanStack Query 5 for server state (from research)

### Storage & CDN
- Supabase Storage vs AWS S3: Claude decides for v1 (Supabase Storage simpler, aligns with cloud-only approach)
- Asset upload flow: Claude decides (editor-only upload vs separate asset library)
- File size and format restrictions: Claude sets sensible defaults
- Bucket structure and organization: Claude decides
- CDN configuration for creative asset delivery

### Claude's Discretion
- Naming convention (snake_case vs camelCase — Claude picks PostgreSQL-appropriate standard)
- Exact column types and relationships for all tables
- Whether campaigns table belongs in Phase 1 or Phase 7
- Index strategy for ad_events and other high-query tables
- Super admin storage approach (role flag or separate table)
- Seed data inclusion and structure
- Region selection for Supabase projects
- All frontend structure decisions (monorepo, package manager, UI library, folder structure)
- All storage decisions (provider, upload flow, limits, bucket structure)

</decisions>

<specifics>
## Specific Ideas

- User provided a detailed ad tracking schema document (Project Details.ini) with MongoDB-style models across campaigns, creatives, placements, analytics — use as reference for field names and relationships, but adapt to PostgreSQL normalized form
- Event types from schema: impression_served, impression_viewable, engagement, click, video_play, video_pause, video_complete, expand, collapse, close
- Request ID system: all events from single ad exposure share a request_id for full funnel reconstruction
- Append-only credit ledger pattern (balance = SUM(amount), never mutable balance field) — from research pitfalls, but credit_ledger table itself deferred to Phase 9

</specifics>

<deferred>
## Deferred Ideas

- credit_ledger table — Phase 9 (Billing & Credit System)
- trackers / creative_trackers tables — Phase 7 (Campaign Management & Tag Export)
- Third-party tracker URL templates and fire conditions — Phase 7
- Publisher/placement tables — v2

</deferred>

---

*Phase: 01-foundation-data-schema*
*Context gathered: 2026-02-18*
*Context updated: 2026-02-19*
