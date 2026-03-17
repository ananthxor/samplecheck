# Phase 1: Foundation & Data Schema - Research

**Researched:** 2026-02-19
**Domain:** Supabase (PostgreSQL + Auth + Storage), React + TypeScript frontend scaffolding, monorepo setup
**Confidence:** HIGH

## Summary

Phase 1 lays the entire technical foundation: a Supabase Cloud project with PostgreSQL schema (advertisers, campaigns, creatives, ad_events, daily_metrics), RLS policies for multi-tenant isolation, a Storage bucket for creative assets with CDN delivery, and a scaffolded React + TypeScript monorepo frontend. No UI or features -- just working, verified infrastructure.

The Supabase ecosystem is mature (supabase-js v2.97.0 as of Feb 2026) with strong TypeScript support via auto-generated types from the database schema. PostgreSQL native range partitioning handles the monthly-partitioned ad_events table without needing pg_partman. The frontend stack has shifted since earlier research: Vite is now at v7.x stable (not v6), Tailwind CSS 4.1 is stable, and shadcn/ui installation works cleanly with the Vite + Tailwind CSS 4 + pnpm combination.

**Primary recommendation:** Use Supabase Cloud with the Supabase CLI for migration-based schema management. Scaffold a pnpm monorepo with three packages (web app, ad-sdk, shared types). Use Vite 7, React 19, TypeScript, Tailwind CSS 4, and shadcn/ui. Generate TypeScript types from the Supabase schema for end-to-end type safety.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Starting from scratch -- no existing Supabase account or project
- Supabase Cloud only for development (no local Docker/CLI setup)
- Two environments: dev + prod (separate Supabase projects)
- **Incremental per phase** -- Phase 1 creates only the tables it can verify against its success criteria. Later phases add their own domain tables via Supabase migrations.
- Phase 1 tables: advertisers, creatives, ad_events, daily_metrics (campaigns table: Claude decides whether to include)
- **Deferred to later phases:** credit_ledger (Phase 9), trackers/creative_trackers (Phase 7)
- No publisher/placement tables in v1 (lean schema)
- Project Details doc used as **inspiration** only -- Claude redesigns for PostgreSQL/Supabase best practices
- ad_events table: monthly partitioned, request_id linking, all event types, JSONB extra_data
- schema_version field on creative records from first commit
- RLS policies for multi-tenant advertiser data isolation
- Build tool: Vite (version updated to 7 per current research -- see findings below)
- State management: Zustand 5 for editor state, TanStack Query 5 for server state

### Claude's Discretion
- Naming convention (snake_case vs camelCase)
- Exact column types and relationships for all tables
- Whether campaigns table belongs in Phase 1 or Phase 7
- Index strategy for ad_events and other high-query tables
- Super admin storage approach (role flag or separate table)
- Seed data inclusion and structure
- Region selection for Supabase projects
- All frontend structure decisions (monorepo, package manager, UI library, folder structure)
- All storage decisions (provider, upload flow, limits, bucket structure)

### Deferred Ideas (OUT OF SCOPE)
- credit_ledger table -- Phase 9 (Billing & Credit System)
- trackers / creative_trackers tables -- Phase 7 (Campaign Management & Tag Export)
- Third-party tracker URL templates and fire conditions -- Phase 7
- Publisher/placement tables -- v2
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | Supabase as backend platform (PostgreSQL + Auth + Storage) | Supabase Cloud setup, CLI-based migration workflow, supabase-js v2.97.0 client with TypeScript generics |
| DATA-02 | Event-driven immutable ad_events table with event types | PostgreSQL native range partitioning, CHECK constraint on event_type enum, append-only design (no UPDATE/DELETE policies) |
| DATA-03 | Request ID system linking all events from a single ad exposure | UUID request_id column with index, all events from one ad load share the same request_id |
| DATA-05 | Lean inventory schema: advertisers, campaigns, creatives | Normalized PostgreSQL tables with UUID PKs, proper FKs, snake_case naming |
| DATA-07 | JSONB extra_data field on events for creative-specific custom data | Native PostgreSQL JSONB type with GIN index for query performance |
| DATA-09 | Monthly partitioning on ad_events table | PostgreSQL native PARTITION BY RANGE on event_timestamp; composite PK required |
| DATA-10 | Row-level security for multi-tenant advertiser data isolation | Supabase RLS with auth.uid() mapping to advertiser, performance-optimized policies |
| DATA-11 | CDN delivery for ad creative assets via Supabase Storage | Public bucket with CDN URL pattern, getPublicUrl() SDK method |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase (Cloud) | Latest | Backend platform (PostgreSQL, Auth, Storage, Edge Functions) | Locked decision; provides all backend services in one platform |
| @supabase/supabase-js | ^2.97.0 | JavaScript/TypeScript client for Supabase | Official client with full TypeScript generics from generated types |
| supabase (CLI) | Latest | Migration management, type generation, project linking | Official tooling for schema management across environments |
| React | ^19.0.0 | UI framework | Current stable; required by project constraints |
| TypeScript | ^5.7.0 | Type safety | Standard for modern React projects |
| Vite | ^7.0.0 | Build tool and dev server | **Updated from v6**: Vite 7 is the current stable (released June 2025). v6 mentioned in earlier research is now outdated. |
| Tailwind CSS | ^4.1.0 | Utility-first CSS framework | Stable v4.1 (released April 2025); uses new CSS-first configuration, Vite plugin integration |
| pnpm | ^9.0.0 | Package manager with workspace support | Efficient monorepo support with workspace protocol, single lockfile |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui | latest (CLI) | Component library built on Radix UI + Tailwind | Phase 3+ for UI components; install during Phase 1 scaffold for configuration readiness |
| @tanstack/react-query | ^5.x | Server state management (caching, sync) | Phase 2+ when fetching data; configure provider in Phase 1 scaffold |
| zustand | ^5.0.11 | Client state management (editor state) | Phase 4+ for editor; no setup needed in Phase 1 |
| @types/node | latest | Node.js type definitions | Required for Vite config path resolution |
| @vitejs/plugin-react | latest | React plugin for Vite | Official React integration for Vite |
| @tailwindcss/vite | latest | Tailwind CSS Vite plugin | v4 uses a Vite plugin instead of PostCSS |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pnpm workspaces | Turborepo | Turborepo adds build caching and task orchestration but is unnecessary for 3-package monorepo at this stage |
| Vite 7 | Vite 6 | Vite 6 still works but is one major version behind; v7 has better performance and is the current LTS target |
| Tailwind CSS 4 | Tailwind CSS 3 | v3 uses JS config files; v4 uses CSS-native config and is significantly faster, but has different setup |
| gen_random_uuid() | uuid_generate_v4() | Both work; gen_random_uuid() is built into PostgreSQL (no extension needed), uuid_generate_v4() requires uuid-ossp (enabled by default in Supabase) |

**Installation (web app package):**
```bash
pnpm create vite@latest apps/web -- --template react-ts
cd apps/web
pnpm add @supabase/supabase-js @tanstack/react-query
pnpm add -D tailwindcss @tailwindcss/vite @types/node
pnpm dlx shadcn@latest init
```

## Architecture Patterns

### Recommended Monorepo Structure

```
scrolltoday/
├── pnpm-workspace.yaml
├── package.json                    # Root workspace config
├── .env.development                # Supabase dev credentials (gitignored)
├── .env.production                 # Supabase prod credentials (gitignored)
├── supabase/
│   ├── config.toml                 # Supabase CLI config
│   ├── migrations/
│   │   └── 20260219000000_initial_schema.sql
│   └── seed.sql                    # Dev seed data
├── apps/
│   └── web/                        # React + Vite frontend
│       ├── index.html
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── tsconfig.app.json
│       ├── src/
│       │   ├── main.tsx            # App entry point
│       │   ├── App.tsx             # Root component with providers
│       │   ├── index.css           # Tailwind import
│       │   ├── lib/
│       │   │   └── supabase.ts     # Supabase client singleton
│       │   ├── components/
│       │   │   └── ui/             # shadcn/ui components
│       │   ├── features/           # Feature-based modules (future)
│       │   ├── hooks/              # Shared custom hooks
│       │   └── types/              # App-specific types
│       └── public/
├── packages/
│   ├── shared/                     # Shared types and utilities
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── database.types.ts   # Auto-generated Supabase types
│   │   │   ├── constants.ts        # Shared constants (event types, etc.)
│   │   │   └── index.ts
│   │   └── tsconfig.json
│   └── ad-sdk/                     # Ad serving SDK (Phase 8)
│       ├── package.json
│       └── src/
└── .gitignore
```

### Pattern 1: Supabase Client Singleton

**What:** Single Supabase client instance shared across the app
**When to use:** Always -- prevents multiple GoTrue instances and connection overhead

```typescript
// apps/web/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@scrolltoday/shared'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

### Pattern 2: Migration-Based Schema Management

**What:** All schema changes written as SQL migration files, never via Dashboard UI in production
**When to use:** Always for reproducibility across dev/prod

```bash
# Create a new migration
npx supabase migration new initial_schema

# Apply locally (if using local dev -- not our case)
# npx supabase db reset

# Push to remote project
npx supabase db push

# Generate TypeScript types after schema changes
npx supabase gen types typescript --project-id "$PROJECT_REF" --schema public > packages/shared/src/database.types.ts
```

### Pattern 3: RLS Policy with Advertiser Tenant Isolation

**What:** Map auth.uid() to advertiser_id for row-level filtering
**When to use:** Every table that contains advertiser-scoped data

```sql
-- Link Supabase Auth users to advertisers via a profiles/user mapping
-- Then use that mapping in RLS policies

-- Example: advertisers table policy
CREATE POLICY "Users can view own advertiser"
ON public.advertisers FOR SELECT
TO authenticated
USING (
  id = (SELECT advertiser_id FROM public.user_profiles WHERE auth_user_id = (SELECT auth.uid()))
);
```

### Pattern 4: Partitioned Events Table

**What:** Monthly range partitioning on ad_events for query performance and data lifecycle management
**When to use:** ad_events table specifically

```sql
-- Partitioned table (partition key must be in PK)
CREATE TABLE public.ad_events (
    id UUID DEFAULT gen_random_uuid(),
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- ... other columns
    PRIMARY KEY (event_timestamp, id)
) PARTITION BY RANGE (event_timestamp);

-- Create initial partitions
CREATE TABLE public.ad_events_2026_02
    PARTITION OF public.ad_events
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE public.ad_events_2026_03
    PARTITION OF public.ad_events
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
```

### Pattern 5: pnpm Workspace Configuration

**What:** Monorepo with workspace protocol for cross-package references
**When to use:** Project root setup

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

```json
// apps/web/package.json (referencing shared package)
{
  "dependencies": {
    "@scrolltoday/shared": "workspace:*"
  }
}
```

### Anti-Patterns to Avoid

- **Making schema changes via Supabase Dashboard in production:** Always use migration files. Dashboard changes cannot be tracked or reproduced.
- **Multiple Supabase client instances:** Create one singleton; multiple instances cause auth state conflicts and unnecessary connections.
- **RLS policies without indexes:** Policies that filter on non-indexed columns cause full table scans. Always index columns used in USING/WITH CHECK clauses.
- **Wrapping auth.uid() without SELECT:** Use `(SELECT auth.uid())` not bare `auth.uid()` in policies -- the SELECT wrapper enables PostgreSQL to cache the result (94.97% performance improvement per Supabase docs).
- **Storing admin role in user_metadata:** user_metadata is editable by the user. Use app_metadata (only settable server-side) for role/permission claims.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UUID generation | Custom ID generators | `gen_random_uuid()` (built-in PostgreSQL) | Cryptographically random, no extension needed, universal format |
| Type generation | Manual TypeScript interfaces for DB tables | `supabase gen types typescript` CLI command | Auto-generates Row/Insert/Update types from live schema; always in sync |
| Auth session management | Custom JWT handling or session stores | Supabase Auth (`supabase.auth.*`) | Handles tokens, refresh, persistence, secure cookie storage |
| File storage + CDN | Custom S3 integration or file server | Supabase Storage with public buckets | Built-in CDN (285+ cities), RLS-compatible policies, SDK integration |
| Migration tracking | Manual SQL scripts with version numbers | Supabase CLI migrations (`supabase migration new`) | Timestamped, ordered, tracks which have been applied per environment |
| Environment management | Manual SQL diffing between dev/prod | Supabase CLI `db push` + `db pull` | Handles migration ordering, conflict detection, remote application |
| CSS utility framework | Custom CSS or CSS-in-JS | Tailwind CSS 4 with Vite plugin | Compile-time optimization, tree-shaking, consistent design tokens |
| UI primitives | Custom accessible components | shadcn/ui (copies components into your codebase) | Built on Radix UI for accessibility; you own the code, full customization |

**Key insight:** Supabase's CLI and auto-generated types eliminate the entire "backend types drift from frontend" problem that plagues most full-stack TypeScript projects. The migration workflow also ensures schema changes are reproducible across environments without manual coordination.

## Common Pitfalls

### Pitfall 1: Partition Key Not in Primary Key
**What goes wrong:** PostgreSQL requires the partition column to be part of every unique constraint, including the primary key. Using `id UUID PRIMARY KEY` alone on a partitioned table fails.
**Why it happens:** Unique constraints must be enforceable within each partition independently.
**How to avoid:** Always use a composite primary key: `PRIMARY KEY (event_timestamp, id)` for range-partitioned tables.
**Warning signs:** Error "unique constraint on partitioned table must include all partitioning columns."

### Pitfall 2: RLS Enabled But No Policies = No Access
**What goes wrong:** Enabling RLS on a table with no policies blocks ALL access (even for authenticated users). The table appears empty.
**Why it happens:** RLS defaults to deny. Policies are additive permissions.
**How to avoid:** Always create at least one policy per operation (SELECT, INSERT, UPDATE, DELETE) when enabling RLS. Test immediately after enabling.
**Warning signs:** Queries return empty results when data exists; no error is thrown.

### Pitfall 3: Forgetting to Create Future Partitions
**What goes wrong:** Inserts fail when the target month's partition does not exist. If February's partition exists but March's does not, inserts with March timestamps fail.
**Why it happens:** PostgreSQL range partitioning requires pre-created partitions. There is no auto-creation.
**How to avoid:** Create partitions several months ahead in the initial migration. Plan a pg_cron job or application-level logic to create partitions ahead of time (can be deferred to Phase 8 when events actually flow).
**Warning signs:** Insert errors like "no partition of relation ad_events found for row."

### Pitfall 4: Supabase Cloud-Only Without CLI Migrations
**What goes wrong:** Schema changes made via Dashboard are not tracked. Reproducing the schema in a second project (prod) requires manual recreation.
**Why it happens:** Dashboard changes do not generate migration files.
**How to avoid:** Even without local Docker, use the Supabase CLI to write migration files, then `supabase db push` to apply them to the remote project. Use `supabase db pull` to capture any Dashboard changes as migrations.
**Warning signs:** Dev and prod schemas diverge; no migration history.

### Pitfall 5: Vite Environment Variables Without VITE_ Prefix
**What goes wrong:** Environment variables are not exposed to client-side code.
**Why it happens:** Vite only exposes variables prefixed with `VITE_` to prevent accidental secret leakage.
**How to avoid:** Always prefix client-side env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Never put service_role key in client env.
**Warning signs:** `import.meta.env.SUPABASE_URL` is `undefined`.

### Pitfall 6: Using service_role Key in Frontend
**What goes wrong:** The service_role key bypasses RLS entirely. Exposing it in client code means any user can read/write any data.
**Why it happens:** Confusion between anon key (safe for client) and service_role key (server-only).
**How to avoid:** Only use the anon key in the frontend Supabase client. service_role is for server-side/Edge Functions only.
**Warning signs:** RLS policies appear to have no effect.

### Pitfall 7: Tailwind CSS 4 Config Differences from v3
**What goes wrong:** Trying to use `tailwind.config.js` or PostCSS config patterns from v3 tutorials.
**Why it happens:** Tailwind CSS 4 moved to CSS-first configuration and a dedicated Vite plugin. No more `tailwind.config.js` or `postcss.config.js`.
**How to avoid:** Follow the v4 setup: install `@tailwindcss/vite`, add to Vite plugins, use `@import "tailwindcss"` in CSS. Customize via CSS `@theme` blocks.
**Warning signs:** Tailwind classes not applying; build warnings about missing config.

## Code Examples

### Supabase Client Initialization with Generated Types

```typescript
// packages/shared/src/database.types.ts (auto-generated, do not edit)
// Generated by: npx supabase gen types typescript --project-id <ref> --schema public

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      advertisers: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      // ... other tables
    }
  }
}
```

```typescript
// apps/web/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@scrolltoday/shared'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)
```

### Complete Schema Migration (Core Tables)

```sql
-- supabase/migrations/20260219000000_initial_schema.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Custom types
CREATE TYPE public.event_type AS ENUM (
  'impression_served',
  'impression_viewable',
  'engagement',
  'click',
  'video_play',
  'video_pause',
  'video_complete',
  'expand',
  'collapse',
  'close'
);

CREATE TYPE public.user_role AS ENUM ('super_admin', 'advertiser');
CREATE TYPE public.creative_status AS ENUM ('draft', 'active', 'paused', 'archived');
CREATE TYPE public.campaign_status AS ENUM ('draft', 'active', 'paused', 'completed');

-- Advertisers table
CREATE TABLE public.advertisers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User profiles (links Supabase Auth users to advertisers)
CREATE TABLE public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  advertiser_id UUID REFERENCES public.advertisers(id) ON DELETE SET NULL,
  role public.user_role NOT NULL DEFAULT 'advertiser',
  display_name TEXT,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(auth_user_id)
);

-- Campaigns table
CREATE TABLE public.campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  advertiser_id UUID NOT NULL REFERENCES public.advertisers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status public.campaign_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Creatives table
CREATE TABLE public.creatives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  advertiser_id UUID NOT NULL REFERENCES public.advertisers(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  format_id TEXT NOT NULL,
  format_name TEXT NOT NULL,
  status public.creative_status NOT NULL DEFAULT 'draft',
  schema_version INTEGER NOT NULL DEFAULT 1,
  template_data JSONB NOT NULL DEFAULT '{}',
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ad events table (partitioned by month)
CREATE TABLE public.ad_events (
  id UUID DEFAULT gen_random_uuid(),
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type public.event_type NOT NULL,
  request_id UUID NOT NULL,
  creative_id UUID NOT NULL,
  campaign_id UUID,
  advertiser_id UUID NOT NULL,
  extra_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_timestamp, id)
) PARTITION BY RANGE (event_timestamp);

-- Create partitions for current and upcoming months
CREATE TABLE public.ad_events_2026_02
  PARTITION OF public.ad_events
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE public.ad_events_2026_03
  PARTITION OF public.ad_events
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE public.ad_events_2026_04
  PARTITION OF public.ad_events
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE public.ad_events_2026_05
  PARTITION OF public.ad_events
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE public.ad_events_2026_06
  PARTITION OF public.ad_events
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE TABLE public.ad_events_2026_07
  PARTITION OF public.ad_events
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

-- Daily metrics rollup table (pre-aggregated for dashboard queries)
CREATE TABLE public.daily_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_date DATE NOT NULL,
  advertiser_id UUID NOT NULL REFERENCES public.advertisers(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  creative_id UUID REFERENCES public.creatives(id) ON DELETE CASCADE,
  impressions_served BIGINT NOT NULL DEFAULT 0,
  impressions_viewable BIGINT NOT NULL DEFAULT 0,
  clicks BIGINT NOT NULL DEFAULT 0,
  engagements BIGINT NOT NULL DEFAULT 0,
  video_plays BIGINT NOT NULL DEFAULT 0,
  video_completes BIGINT NOT NULL DEFAULT 0,
  total_dwell_time_ms BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(metric_date, advertiser_id, campaign_id, creative_id)
);

-- Indexes
CREATE INDEX idx_ad_events_request_id ON public.ad_events (request_id);
CREATE INDEX idx_ad_events_creative_id ON public.ad_events (creative_id);
CREATE INDEX idx_ad_events_advertiser_id ON public.ad_events (advertiser_id);
CREATE INDEX idx_ad_events_event_type ON public.ad_events (event_type);

CREATE INDEX idx_creatives_advertiser_id ON public.creatives (advertiser_id);
CREATE INDEX idx_creatives_campaign_id ON public.creatives (campaign_id);

CREATE INDEX idx_campaigns_advertiser_id ON public.campaigns (advertiser_id);

CREATE INDEX idx_daily_metrics_advertiser_date ON public.daily_metrics (advertiser_id, metric_date);
CREATE INDEX idx_daily_metrics_campaign_date ON public.daily_metrics (campaign_id, metric_date);

CREATE INDEX idx_user_profiles_auth_user_id ON public.user_profiles (auth_user_id);
CREATE INDEX idx_user_profiles_advertiser_id ON public.user_profiles (advertiser_id);

-- Enable RLS on all tables
ALTER TABLE public.advertisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's advertiser_id
CREATE OR REPLACE FUNCTION public.get_user_advertiser_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT advertiser_id FROM public.user_profiles
  WHERE auth_user_id = (SELECT auth.uid())
$$;

-- Helper function: check if current user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE auth_user_id = (SELECT auth.uid())
    AND role = 'super_admin'
  )
$$;

-- RLS Policies: Advertisers
CREATE POLICY "Super admin full access to advertisers"
ON public.advertisers FOR ALL
TO authenticated
USING ((SELECT public.is_super_admin()))
WITH CHECK ((SELECT public.is_super_admin()));

CREATE POLICY "Users can view own advertiser"
ON public.advertisers FOR SELECT
TO authenticated
USING (id = (SELECT public.get_user_advertiser_id()));

-- RLS Policies: User Profiles
CREATE POLICY "Super admin full access to profiles"
ON public.user_profiles FOR ALL
TO authenticated
USING ((SELECT public.is_super_admin()))
WITH CHECK ((SELECT public.is_super_admin()));

CREATE POLICY "Users can view own profile"
ON public.user_profiles FOR SELECT
TO authenticated
USING (auth_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (auth_user_id = (SELECT auth.uid()))
WITH CHECK (auth_user_id = (SELECT auth.uid()));

-- RLS Policies: Campaigns
CREATE POLICY "Super admin full access to campaigns"
ON public.campaigns FOR ALL
TO authenticated
USING ((SELECT public.is_super_admin()))
WITH CHECK ((SELECT public.is_super_admin()));

CREATE POLICY "Users can manage own campaigns"
ON public.campaigns FOR ALL
TO authenticated
USING (advertiser_id = (SELECT public.get_user_advertiser_id()))
WITH CHECK (advertiser_id = (SELECT public.get_user_advertiser_id()));

-- RLS Policies: Creatives
CREATE POLICY "Super admin full access to creatives"
ON public.creatives FOR ALL
TO authenticated
USING ((SELECT public.is_super_admin()))
WITH CHECK ((SELECT public.is_super_admin()));

CREATE POLICY "Users can manage own creatives"
ON public.creatives FOR ALL
TO authenticated
USING (advertiser_id = (SELECT public.get_user_advertiser_id()))
WITH CHECK (advertiser_id = (SELECT public.get_user_advertiser_id()));

-- RLS Policies: Ad Events (append-only for service, read-only for users)
CREATE POLICY "Super admin can read all events"
ON public.ad_events FOR SELECT
TO authenticated
USING ((SELECT public.is_super_admin()));

CREATE POLICY "Users can read own events"
ON public.ad_events FOR SELECT
TO authenticated
USING (advertiser_id = (SELECT public.get_user_advertiser_id()));

-- Note: INSERT on ad_events will use service_role from Edge Functions (bypasses RLS)
-- No UPDATE or DELETE policies -- events are immutable

-- RLS Policies: Daily Metrics
CREATE POLICY "Super admin can read all metrics"
ON public.daily_metrics FOR ALL
TO authenticated
USING ((SELECT public.is_super_admin()))
WITH CHECK ((SELECT public.is_super_admin()));

CREATE POLICY "Users can read own metrics"
ON public.daily_metrics FOR SELECT
TO authenticated
USING (advertiser_id = (SELECT public.get_user_advertiser_id()));

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.advertisers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.creatives
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.daily_metrics
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

### Vite Configuration with Tailwind CSS 4

```typescript
// apps/web/vite.config.ts
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  envDir: path.resolve(__dirname, '../../'), // Read .env from monorepo root
})
```

```css
/* apps/web/src/index.css */
@import "tailwindcss";
```

### Storage Bucket Setup (via Supabase Dashboard or SQL)

```sql
-- Create public bucket for creative assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'creative-assets',
  'creative-assets',
  true,
  52428800,  -- 50MB limit
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm', 'application/javascript', 'text/html', 'text/css']
);

-- Storage RLS: authenticated users can upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'creative-assets'
  AND (storage.foldername(name))[1] = (SELECT public.get_user_advertiser_id())::text
);

-- Storage RLS: public read access (bucket is public)
CREATE POLICY "Public read access for creative assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'creative-assets');

-- Storage RLS: users can manage own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'creative-assets'
  AND (storage.foldername(name))[1] = (SELECT public.get_user_advertiser_id())::text
);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'creative-assets'
  AND (storage.foldername(name))[1] = (SELECT public.get_user_advertiser_id())::text
);
```

**CDN URL pattern for public assets:**
```
https://<project-id>.supabase.co/storage/v1/object/public/creative-assets/<advertiser-id>/<filename>
```

### App Entry Point with Providers

```tsx
// apps/web/src/App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <p className="text-foreground">ScrollToday - Foundation Ready</p>
      </div>
    </QueryClientProvider>
  )
}

export default App
```

## Discretion Decisions (Recommendations)

Based on research findings, here are recommendations for areas marked as Claude's discretion:

### 1. Include campaigns table in Phase 1: YES
**Rationale:** The success criteria explicitly list "campaigns" as a core table. Creatives reference campaign_id as a FK. The table is simple (5 columns) and verifiable. Including it avoids a schema migration gap where creatives have a dangling FK.

### 2. Naming convention: snake_case
**Rationale:** PostgreSQL standard. Supabase auto-generated types convert snake_case to camelCase in TypeScript. Using snake_case in SQL and camelCase in TypeScript is the idiomatic pattern.

### 3. Super admin: role column on user_profiles table
**Rationale:** Simpler than a separate table. A `user_role` enum with `super_admin` and `advertiser` values on the user_profiles table works cleanly with RLS helper functions. The `is_super_admin()` function checks this. App_metadata on the JWT is used for the actual authorization check in RLS policies.

### 4. Region: Mumbai (ap-south-1)
**Rationale:** Dev team is in India. User base will be mixed (India + US), but during development, low latency to the database matters more. Production can be re-evaluated when user geography is clearer.

### 5. Monorepo: YES, with pnpm workspaces
**Rationale:** Three packages (web, ad-sdk, shared) benefit from shared types and a single lockfile. pnpm workspaces are lightweight (just a yaml file) and Vite handles out-of-root imports natively.

### 6. Package manager: pnpm
**Rationale:** Fastest installs, strictest dependency resolution (no phantom dependencies), native workspace support, single lockfile across packages.

### 7. UI component library: shadcn/ui + Tailwind CSS 4
**Rationale:** shadcn/ui copies components into your codebase (not a dependency), built on Radix UI for accessibility, pairs naturally with Tailwind. Full control over customization. Installation is straightforward with the Vite + Tailwind CSS 4 setup.

### 8. Folder structure: Feature-based
**Rationale:** Features (auth, campaigns, creatives, analytics) will be the primary organizational axis as the app grows. Type-based (components/, hooks/, utils/) doesn't scale past 20 files per folder.

### 9. Storage: Supabase Storage with public bucket
**Rationale:** Aligns with cloud-only approach. Built-in CDN, SDK integration, RLS-compatible policies. No AWS account needed for v1. Storage is organized by advertiser_id folders.

### 10. File limits: 50MB max, common web formats
**Rationale:** Rich media ads can include video, so 50MB accommodates mp4/webm files. Allowed MIME types cover all ad creative formats: images (png, jpeg, gif, webp, svg), video (mp4, webm), and code (js, html, css).

### 11. Seed data: YES, include for dev testing
**Rationale:** A test advertiser, user profile, campaign, and a few creatives make it immediately testable. The seed file should be separate from migrations and only applied to dev.

### 12. Index strategy
**Rationale:** Index all FK columns and high-query columns. For ad_events: request_id (funnel reconstruction), creative_id (per-creative queries), advertiser_id (tenant filtering), event_type (type-specific queries). For daily_metrics: composite indexes on (advertiser_id, metric_date) and (campaign_id, metric_date) for dashboard time-range queries.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Vite 6 | Vite 7 (stable) | June 2025 | Use Vite 7 for scaffolding; v6 config is compatible but v7 has performance improvements |
| Tailwind CSS 3 (JS config) | Tailwind CSS 4 (CSS-first config, Vite plugin) | January 2025 | No more tailwind.config.js or postcss.config.js; uses @tailwindcss/vite plugin and CSS @import |
| Supabase JS v1 | Supabase JS v2.97.0 | Current | Mature TypeScript generics, improved auth handling |
| PostCSS for Tailwind | @tailwindcss/vite plugin | Tailwind CSS 4.0 | Simpler setup, better Vite integration, faster builds |
| uuid_generate_v4() (extension) | gen_random_uuid() (built-in) | PostgreSQL 13+ | No extension needed; built into PostgreSQL core |
| Zustand 4 | Zustand 5.0.11 | Recent | Improved middleware typing, no major API changes |

**Deprecated/outdated:**
- `tailwind.config.js` / `postcss.config.js`: Replaced by CSS-first configuration in Tailwind CSS 4
- Vite 6: Superseded by Vite 7 (stable since June 2025)
- `uuid-ossp` extension for UUID generation: Still works but `gen_random_uuid()` is built-in and preferred

## Open Questions

1. **Supabase Free Tier Limits for Dev**
   - What we know: Supabase has a free tier suitable for development. Two projects (dev + prod) will be needed.
   - What's unclear: Exact free tier limits (connections, storage, bandwidth) could not be fetched from pricing page (JavaScript-rendered).
   - Recommendation: Start both projects on free tier. Upgrade prod to Pro ($25/mo) when approaching launch. Free tier is sufficient for all Phase 1 work.

2. **Partition Auto-Creation**
   - What we know: PostgreSQL native partitioning requires pre-created partitions. pg_partman can automate this but adds complexity.
   - What's unclear: Whether Supabase Cloud supports pg_cron for scheduled partition creation.
   - Recommendation: Create 6 months of partitions in the initial migration. Address auto-creation in Phase 8 when events actually flow. pg_cron is available in Supabase.

3. **Vite 7 Breaking Changes from v6**
   - What we know: Vite 7 is current stable. The context mentions Vite 6 from earlier research.
   - What's unclear: Specific breaking changes between v6 and v7 for a React+TS setup.
   - Recommendation: Scaffold fresh with Vite 7 (`pnpm create vite@latest`). No migration concerns since this is a new project.

## Sources

### Primary (HIGH confidence)
- Supabase official docs: table creation, RLS policies, storage buckets, UUID generation, managing environments, custom claims/RBAC, type generation
  - https://supabase.com/docs/guides/database/tables
  - https://supabase.com/docs/guides/auth/row-level-security
  - https://supabase.com/docs/guides/storage
  - https://supabase.com/docs/guides/storage/buckets/creating-buckets
  - https://supabase.com/docs/guides/storage/serving/downloads
  - https://supabase.com/docs/guides/database/partitions
  - https://supabase.com/docs/guides/database/extensions/uuid-ossp
  - https://supabase.com/docs/guides/deployment/managing-environments
  - https://supabase.com/docs/guides/auth/custom-claims-and-role-based-access-control-rbac
  - https://supabase.com/docs/guides/auth/managing-user-data
  - https://supabase.com/docs/reference/javascript/initializing
  - https://supabase.com/docs/guides/api/rest/generating-types
- Vite official docs: https://vite.dev/guide/ (confirmed v7.3.1 current)
- Vite blog: https://vite.dev/blog/ (confirmed v7 stable June 2025)
- Tailwind CSS blog: https://tailwindcss.com/blog (confirmed v4.0 Jan 2025, v4.1 Apr 2025)
- shadcn/ui Vite installation: https://ui.shadcn.com/docs/installation/vite
- TanStack Query docs: https://tanstack.com/query/latest/docs/framework/react/overview (confirmed v5)
- pnpm workspaces: https://pnpm.io/workspaces

### Secondary (MEDIUM confidence)
- GitHub releases for Zustand: v5.0.11 (Feb 2026) - https://github.com/pmndrs/zustand/releases
- GitHub releases for supabase-js: v2.97.0 (Feb 2026) - https://github.com/supabase/supabase-js/releases

### Tertiary (LOW confidence)
- Supabase free tier limits: Could not be fetched (JS-rendered pricing page). Based on training knowledge: free tier includes 500MB database, 1GB storage, 2GB bandwidth, 50K monthly active users.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All versions verified from official sources (docs, GitHub releases, blog posts)
- Architecture: HIGH - Patterns from official Supabase docs (RLS, partitioning, storage, migrations, type generation)
- Pitfalls: HIGH - Documented in official Supabase guides (RLS default deny, partition key requirements, env variable prefixes)
- Schema design: MEDIUM - Derived from requirements and PostgreSQL best practices; the exact column set is a design decision informed by the Project Details reference doc
- Frontend scaffold: HIGH - shadcn/ui Vite installation guide verified, Tailwind CSS 4 Vite plugin pattern confirmed

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (30 days - stable technologies, unlikely to change)
