# Phase 7: Campaign Management & Tag Export - Research

**Researched:** 2026-02-23
**Domain:** Campaign CRUD, ad lifecycle state machine, DFP/GAM tag export, embeddable ad tags, third-party tracker configuration
**Confidence:** HIGH

## Summary

Phase 7 builds campaign management UI, ad lifecycle status transitions, tag export functionality, and third-party tracker configuration on top of a mature codebase. The existing `campaigns` table (already created in Phase 1 migration), `creatives.campaign_id` FK, RLS policies, and typed Supabase client provide a solid foundation. The primary new work is: (1) campaigns CRUD UI mirroring the established creatives API/hooks/page pattern, (2) a status lifecycle state machine with allowed transitions, (3) tag generation logic for DFP/GAM and direct embed formats, (4) a new `tracker_configs` table with RLS for third-party tracker integration (DATA-08), and (5) copy-to-clipboard UX following the existing `ShareDialog` pattern.

This phase is ~90% frontend work with one database migration (tracker tables). No new Edge Functions are needed -- all operations go through the Supabase client with existing RLS policies. The campaigns table already has full CRUD RLS policies for both super_admin and advertiser roles. The tag export is purely client-side string generation (no backend serving endpoint -- that is Phase 8).

**Primary recommendation:** Follow the established feature module pattern (`features/campaigns/`) with API layer, React Query hooks, and page components. Tag export is a client-side utility that generates HTML/JS strings from creative data. Third-party trackers need one new migration for the `tracker_configs` and `creative_trackers` tables.

## Standard Stack

### Core (Already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2 | Database CRUD, typed queries | Already configured with `Database` types |
| @tanstack/react-query | ^5 | Server state management | Established pattern for creatives CRUD |
| react-hook-form | ^7.71.1 | Form state management | Already used in editor forms |
| @hookform/resolvers | ^5.2.2 | Zod validation integration | Already in deps |
| zod | ^4.3.6 | Schema validation | Already used for template configs |
| sonner | ^2.0.7 | Toast notifications | Established pattern throughout app |
| lucide-react | ^0.575.0 | Icons | Consistent across all UI |
| react-router | ^7.13.0 | Routing | Lazy-loaded route pattern in router.tsx |
| radix-ui | ^1.4.3 | Primitives (dialog, select, dropdown, tabs) | shadcn/ui already configured |

### Supporting (Already in project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| class-variance-authority | ^0.7.1 | Variant-based component styling | Badge status variants |
| tailwind-merge | ^3 | Merge Tailwind classes | Component composition |

### New Dependencies Needed
None. The existing stack covers all requirements for this phase.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Client-side tag generation | Server-side Edge Function | Client-side is simpler, no latency, tag is deterministic from creative data. Server-side only needed if tags require signed URLs or auth tokens -- defer to Phase 8 |
| Copy-to-clipboard via navigator.clipboard | clipboard.js library | navigator.clipboard API is already used successfully in ShareDialog and CreateUserDialog -- no library needed |
| DataTable component (TanStack Table) | Simple table/card list | Cards are the established pattern for creatives. Campaigns list is small enough that a simple card/list approach works. Defer DataTable to analytics (Phase 10) if needed |

## Architecture Patterns

### Recommended Project Structure
```
apps/web/src/features/campaigns/
├── api/
│   └── campaigns-api.ts          # Supabase CRUD (campaigns + creative assignment)
├── hooks/
│   └── use-campaigns.ts          # React Query wrappers
├── components/
│   ├── campaign-list.tsx          # Campaign card grid with status filters
│   ├── campaign-card.tsx          # Individual campaign card
│   ├── campaign-form-dialog.tsx   # Create/edit campaign dialog
│   ├── campaign-detail.tsx        # Campaign detail view with assigned creatives
│   ├── assign-creatives-dialog.tsx # Multi-select dialog to assign creatives
│   ├── status-badge.tsx           # Status badge with lifecycle transitions
│   └── tag-export-dialog.tsx      # DFP/GAM tag + embed code copy dialogs
├── lib/
│   ├── tag-generator.ts           # DFP/GAM tag and embed code generation
│   ├── status-machine.ts          # Allowed status transitions
│   └── tracker-types.ts           # Third-party tracker types and schemas
└── pages/
    └── campaigns-page.tsx         # Route component: list + detail views

apps/web/src/features/campaigns/
├── api/
│   └── trackers-api.ts            # Tracker CRUD operations
├── hooks/
│   └── use-trackers.ts            # React Query hooks for trackers
```

### Pattern 1: Feature Module with API → Hooks → Components
**What:** Mirrors the established `features/creatives/` pattern exactly.
**When to use:** Every new feature domain.
**Example:**
```typescript
// campaigns-api.ts — follows creatives-api.ts pattern
import { supabase } from '@/lib/supabase'
import type { Tables, Insertable, Updatable } from '@scrolltoday/shared'

export async function fetchCampaigns(): Promise<Tables<'campaigns'>[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

// use-campaigns.ts — follows use-creatives.ts pattern
export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: fetchCampaigns,
  })
}
```

### Pattern 2: Status Lifecycle State Machine
**What:** A pure function defining which status transitions are allowed, preventing invalid state changes.
**When to use:** CAMP-04 requires Draft -> Active -> Paused -> Archived lifecycle.
**Example:**
```typescript
// status-machine.ts
import type { Enums } from '@scrolltoday/shared'

type CreativeStatus = Enums<'creative_status'>
type CampaignStatus = Enums<'campaign_status'>

const CREATIVE_TRANSITIONS: Record<CreativeStatus, CreativeStatus[]> = {
  draft: ['active'],
  active: ['paused'],
  paused: ['active', 'archived'],
  archived: [], // terminal state
}

export function getAvailableTransitions(current: CreativeStatus): CreativeStatus[] {
  return CREATIVE_TRANSITIONS[current] ?? []
}

export function canTransitionTo(from: CreativeStatus, to: CreativeStatus): boolean {
  return CREATIVE_TRANSITIONS[from]?.includes(to) ?? false
}
```

### Pattern 3: Tag Generation as Pure Functions
**What:** DFP/GAM tags and embed codes generated from creative data with no side effects.
**When to use:** SERV-05 and SERV-06 tag export.
**Example:**
```typescript
// tag-generator.ts
interface TagGeneratorInput {
  creativeId: string
  creativeName: string
  width: number
  height: number
  formatId: string
  serveBaseUrl: string // e.g., window.location.origin or configurable
}

export function generateDfpTag(input: TagGeneratorInput): string {
  const { creativeId, width, height, serveBaseUrl } = input
  // DFP/GAM third-party tag format with standard macros
  return `<script type="text/javascript">
var defined_vars = {
  clickTag: "%%CLICK_URL_UNESC%%",
  cacheBuster: "%%CACHEBUSTER%%"
};
</script>
<script type="text/javascript" src="${serveBaseUrl}/serve/${creativeId}?cb=%%CACHEBUSTER%%&click=%%CLICK_URL_ESC%%&w=${width}&h=${height}"></script>`
}

export function generateEmbedTag(input: TagGeneratorInput): string {
  const { creativeId, width, height, serveBaseUrl } = input
  return `<div id="st-ad-${creativeId}" style="width:${width}px;height:${height}px;">
  <script>
    (function(){
      var s=document.createElement('script');
      s.async=true;
      s.src='${serveBaseUrl}/serve/${creativeId}?w=${width}&h=${height}&cb='+Date.now();
      document.getElementById('st-ad-${creativeId}').appendChild(s);
    })();
  </script>
</div>`
}
```

### Pattern 4: Copy-to-Clipboard with Feedback
**What:** navigator.clipboard.writeText with visual feedback following existing ShareDialog pattern.
**When to use:** Tag export copy buttons.
**Example:**
```typescript
// Already established in share-dialog.tsx and create-user-dialog.tsx
const [copied, setCopied] = useState(false)

async function handleCopy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  } catch {
    toast.error('Failed to copy to clipboard')
  }
}
```

### Anti-Patterns to Avoid
- **Don't create a separate serve endpoint in this phase:** Phase 7 generates tag *strings*. The actual serve endpoint is Phase 8. Tags should reference a placeholder base URL that will become real in Phase 8.
- **Don't build drag-and-drop creative assignment:** A simple multi-select dialog is sufficient for v1. Drag-and-drop adds complexity with no user value at this stage.
- **Don't add campaign scheduling (start/end dates):** This is explicitly a v2 feature (ADVT-03). The phase only needs status lifecycle management.
- **Don't create a junction table for campaign-creative many-to-many:** The existing `creatives.campaign_id` FK already supports one-campaign-per-creative assignment. This is sufficient for v1.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form state management | Custom form state with useState | react-hook-form + zod resolver | Already in deps, handles validation, dirty tracking, error messages |
| Server state caching | Manual state + fetch | @tanstack/react-query | Established pattern, handles refetch, invalidation, loading/error states |
| Status badge variants | Custom CSS per status | Badge component with variant map | Already implemented in creative-card.tsx with STATUS_VARIANT pattern |
| Dialog/modal UI | Custom modal implementation | shadcn/ui Dialog component | Already used in ShareDialog, consistent with design system |
| Toast notifications | Custom notification system | sonner | Already configured, used throughout app |
| Clipboard copy | clipboard.js or manual fallback | navigator.clipboard.writeText | Already proven in ShareDialog and CreateUserDialog, modern API |

**Key insight:** This phase adds no new libraries. Every UI pattern needed is already established in the codebase. The planner should reference existing implementations as templates for new components.

## Common Pitfalls

### Pitfall 1: Campaign Status vs Creative Status Confusion
**What goes wrong:** The two enums have different values (`campaign_status` has 'completed', `creative_status` has 'archived') and different transition rules.
**Why it happens:** Both are status lifecycles with overlapping names. Developers may apply creative status logic to campaigns or vice versa.
**How to avoid:** Keep status machines in separate, clearly named functions. The DB enforces the enum at the column level, so wrong values will fail at insert/update time. Add TypeScript type annotations using `Enums<'creative_status'>` and `Enums<'campaign_status'>` from shared types.
**Warning signs:** TypeScript errors about incompatible string literal types, or DB errors about invalid enum values.

### Pitfall 2: Stale Campaign List After Creative Assignment
**What goes wrong:** User assigns a creative to a campaign, but the campaign detail view still shows the old creative list.
**Why it happens:** React Query cache for the campaign's creatives is not invalidated after the creative update.
**How to avoid:** When updating `creatives.campaign_id`, invalidate both `['campaigns']` and `['creatives']` query keys. The existing `useUpdateCreative` hook already invalidates `['creatives']`, but campaign-specific queries need invalidation too.
**Warning signs:** Data appearing stale after assignment operations.

### Pitfall 3: DFP Tag Macros Are Case-Sensitive
**What goes wrong:** Tag macros like `%%CLICK_URL_ESC%%` don't get replaced by Google Ad Manager.
**Why it happens:** Macro names must be EXACTLY as documented -- all caps, double percent delimiters.
**How to avoid:** Use constant strings for all macro names. Test by visual inspection that `%%` delimiters and names match the official list.
**Warning signs:** Tags showing literal `%%MACRO%%` text instead of expanded values when tested in DFP.

### Pitfall 4: Serve URL Placeholder Must Be Configurable
**What goes wrong:** Tags are generated with `localhost:5173` URLs in development, which are invalid in production.
**Why it happens:** Hardcoding `window.location.origin` as the serve base URL.
**How to avoid:** Use an environment variable `VITE_SERVE_BASE_URL` (or similar) for the serve endpoint base URL. In development it points to localhost. In production it points to the actual serve domain. The tag generator function takes `serveBaseUrl` as a parameter, not hardcoded.
**Warning signs:** Tags working in dev but not in production, or tags referencing the wrong domain.

### Pitfall 5: Tracker URL Validation
**What goes wrong:** Users enter invalid tracker URLs that break ad rendering or cause network errors.
**Why it happens:** Tracker URLs may contain macro placeholders (e.g., `[timestamp]`, `${CACHEBUSTER}`) that fail URL validation.
**How to avoid:** Use permissive URL validation that allows macro placeholders. Validate the URL structure (starts with http/https) but don't reject URLs with `%%`, `${}`, `[]` macro syntax. Document supported macro substitutions.
**Warning signs:** Valid tracker URLs being rejected by form validation.

### Pitfall 6: RLS Already Handles Authorization
**What goes wrong:** Developer adds manual advertiser_id checks in the API layer, duplicating RLS logic.
**Why it happens:** Not trusting that RLS policies are working.
**How to avoid:** The existing RLS policies on `campaigns` already enforce that users can only CRUD their own campaigns. The `creatives` table also has RLS. Supabase client queries automatically filter by the authenticated user's advertiser_id. No additional auth checks needed in the API layer -- just like `creatives-api.ts` doesn't check advertiser_id.
**Warning signs:** Redundant `.eq('advertiser_id', ...)` filters in API calls (not needed with RLS).

## Code Examples

### Campaign CRUD API (follows creatives-api.ts)
```typescript
// Source: Existing pattern from apps/web/src/features/creatives/api/creatives-api.ts
import { supabase } from '@/lib/supabase'
import type { Tables, Insertable, Updatable } from '@scrolltoday/shared'

export async function fetchCampaigns(): Promise<Tables<'campaigns'>[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function fetchCampaignById(id: string): Promise<Tables<'campaigns'>> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createCampaign(
  campaign: Insertable<'campaigns'>
): Promise<Tables<'campaigns'>> {
  const { data, error } = await supabase
    .from('campaigns')
    .insert(campaign)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateCampaign(
  id: string,
  updates: Updatable<'campaigns'>
): Promise<Tables<'campaigns'>> {
  const { data, error } = await supabase
    .from('campaigns')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteCampaign(id: string): Promise<void> {
  const { error } = await supabase.from('campaigns').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
```

### Fetch Creatives by Campaign (with join)
```typescript
// Source: Supabase JS client pattern for filtered queries
export async function fetchCreativesByCampaign(
  campaignId: string
): Promise<Tables<'creatives'>[]> {
  const { data, error } = await supabase
    .from('creatives')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function fetchUnassignedCreatives(): Promise<Tables<'creatives'>[]> {
  const { data, error } = await supabase
    .from('creatives')
    .select('*')
    .is('campaign_id', null)
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}
```

### Assign Creative to Campaign
```typescript
// Source: Pattern from creatives-api.ts updateCreative
export async function assignCreativeToCampaign(
  creativeId: string,
  campaignId: string | null
): Promise<Tables<'creatives'>> {
  const { data, error } = await supabase
    .from('creatives')
    .update({ campaign_id: campaignId })
    .eq('id', creativeId)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}
```

### Status Transition with Validation
```typescript
// Source: Domain pattern for ad lifecycle management
export async function updateCreativeStatus(
  creativeId: string,
  newStatus: Enums<'creative_status'>
): Promise<Tables<'creatives'>> {
  // First fetch current status to validate transition
  const { data: current, error: fetchError } = await supabase
    .from('creatives')
    .select('status')
    .eq('id', creativeId)
    .single()
  if (fetchError) throw new Error(fetchError.message)

  if (!canTransitionTo(current.status as Enums<'creative_status'>, newStatus)) {
    throw new Error(
      `Cannot transition from ${current.status} to ${newStatus}`
    )
  }

  const { data, error } = await supabase
    .from('creatives')
    .update({ status: newStatus })
    .eq('id', creativeId)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}
```

### DFP/GAM Tag Generation
```typescript
// Source: Google Ad Manager Help - Macros (support.google.com/admanager/answer/2376981)
// Source: monetizemore.com/blog/google-ad-manager-macros-every-publisher-needs-to-know/

/**
 * Standard GAM macros used in third-party ad tags:
 * - %%CLICK_URL_ESC%%    : Escaped click tracking URL (use in URL parameters)
 * - %%CLICK_URL_UNESC%%  : Unescaped click tracking URL (use at start of href)
 * - %%CACHEBUSTER%%      : Random number to prevent browser caching
 * - %%WIDTH%%            : Ad unit width
 * - %%HEIGHT%%           : Ad unit height
 * - %%VIEW_URL_UNESC%%   : Viewability tracking URL
 * - %%SITE%%             : Publisher domain
 *
 * All macros are CASE-SENSITIVE and use %% delimiters.
 */

export function generateDfpTag(input: {
  creativeId: string
  width: number
  height: number
  serveBaseUrl: string
}): string {
  const { creativeId, width, height, serveBaseUrl } = input
  return `<!-- ScrollToday Ad Tag - DFP/GAM Compatible -->
<ins class="scrolltoday-ad"
  data-creative-id="${creativeId}"
  data-width="${width}"
  data-height="${height}"
  style="display:inline-block;width:${width}px;height:${height}px;">
</ins>
<script type="text/javascript"
  src="${serveBaseUrl}/serve/ad.js?id=${creativeId}&w=${width}&h=${height}&cb=%%CACHEBUSTER%%&click=%%CLICK_URL_ESC%%">
</script>`
}

export function generateEmbedTag(input: {
  creativeId: string
  width: number
  height: number
  serveBaseUrl: string
}): string {
  const { creativeId, width, height, serveBaseUrl } = input
  return `<!-- ScrollToday Ad - Direct Embed -->
<div id="st-ad-${creativeId}" style="width:${width}px;height:${height}px;overflow:hidden;">
  <script>
    (function(){
      var d=document,s=d.createElement('script');
      s.async=true;
      s.src='${serveBaseUrl}/serve/ad.js?id=${creativeId}&w=${width}&h=${height}&cb='+Date.now();
      d.getElementById('st-ad-${creativeId}').appendChild(s);
    })();
  </script>
  <noscript>
    <a href="${serveBaseUrl}/serve/fallback?id=${creativeId}">
      <img src="${serveBaseUrl}/serve/fallback?id=${creativeId}&w=${width}&h=${height}" width="${width}" height="${height}" alt="Ad" />
    </a>
  </noscript>
</div>`
}
```

### Third-Party Tracker Database Schema
```sql
-- Source: DATA-08 requirement, ad tech tracker patterns

-- Tracker configurations per advertiser
CREATE TABLE public.tracker_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  advertiser_id UUID NOT NULL REFERENCES public.advertisers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tracker_url TEXT NOT NULL,
  tracker_type TEXT NOT NULL CHECK (tracker_type IN ('pixel', 'script')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Creative-tracker mappings with fire conditions
CREATE TABLE public.creative_trackers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creative_id UUID NOT NULL REFERENCES public.creatives(id) ON DELETE CASCADE,
  tracker_config_id UUID NOT NULL REFERENCES public.tracker_configs(id) ON DELETE CASCADE,
  fire_condition TEXT NOT NULL CHECK (fire_condition IN ('on_load', 'on_viewable', 'on_click', 'on_engagement')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(creative_id, tracker_config_id, fire_condition)
);

-- Indexes
CREATE INDEX idx_tracker_configs_advertiser ON public.tracker_configs (advertiser_id);
CREATE INDEX idx_creative_trackers_creative ON public.creative_trackers (creative_id);
CREATE INDEX idx_creative_trackers_config ON public.creative_trackers (tracker_config_id);

-- RLS
ALTER TABLE public.tracker_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_trackers ENABLE ROW LEVEL SECURITY;

-- Tracker configs: advertiser sees own, super admin sees all
CREATE POLICY "Super admin full access to tracker_configs"
ON public.tracker_configs FOR ALL TO authenticated
USING ((SELECT public.is_super_admin()))
WITH CHECK ((SELECT public.is_super_admin()));

CREATE POLICY "Users can manage own tracker_configs"
ON public.tracker_configs FOR ALL TO authenticated
USING (advertiser_id = (SELECT public.get_user_advertiser_id()))
WITH CHECK (advertiser_id = (SELECT public.get_user_advertiser_id()));

-- Creative trackers: access through creative ownership (creative_id FK + RLS on creatives)
CREATE POLICY "Super admin full access to creative_trackers"
ON public.creative_trackers FOR ALL TO authenticated
USING ((SELECT public.is_super_admin()))
WITH CHECK ((SELECT public.is_super_admin()));

CREATE POLICY "Users can manage own creative_trackers"
ON public.creative_trackers FOR ALL TO authenticated
USING (
  creative_id IN (
    SELECT id FROM public.creatives
    WHERE advertiser_id = (SELECT public.get_user_advertiser_id())
  )
)
WITH CHECK (
  creative_id IN (
    SELECT id FROM public.creatives
    WHERE advertiser_id = (SELECT public.get_user_advertiser_id())
  )
);

-- Updated_at triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tracker_configs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

### Router Integration
```typescript
// Source: Existing router.tsx pattern
// Replace the placeholder with lazy-loaded page
{
  path: '/campaigns',
  lazy: async () => {
    const { default: Component } = await import(
      '@/features/campaigns/pages/campaigns-page'
    )
    return { Component }
  },
},
{
  path: '/campaigns/:id',
  lazy: async () => {
    const { default: Component } = await import(
      '@/features/campaigns/pages/campaign-detail-page'
    )
    return { Component }
  },
},
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Synchronous script ad tags | Async script tags with container div | ~2018+ | Modern tags load asynchronously to not block page render |
| iframe-only ad tags | Script-based with fallback noscript | ~2020+ | Script tags allow richer interaction, noscript provides fallback |
| DFP `%%CLICK_URL_UNESC%%` only | Multiple escaping levels (ESC, ESC_ESC, UNESC) | Ongoing | Different ad server chains require different encoding levels |
| Manual cachebuster timestamps | `%%CACHEBUSTER%%` macro populated by ad server | Standard | Ad servers replace the macro, ensuring unique values per impression |
| Per-creative tracker embedding | Configurable tracker configs with fire conditions | Standard | Separates tracker management from creative authoring |

**Deprecated/outdated:**
- Synchronous ad tags (`document.write`-based) -- blocked by most modern browsers, avoid entirely
- Flash-based ad creatives -- irrelevant, all formats are HTML5/JS
- Google "DFP" branding -- now called "Google Ad Manager (GAM)" but macro format unchanged

## Open Questions

1. **Serve endpoint URL format for Phase 8**
   - What we know: Tags need to reference a serve URL. Phase 8 will create the actual endpoint.
   - What's unclear: Whether serve will be a Supabase Edge Function (`/functions/v1/serve`) or a separate domain/CDN endpoint.
   - Recommendation: Use `VITE_SERVE_BASE_URL` env variable. Default to `${window.location.origin}` for now. Tags will be regenerated when serve infrastructure is finalized in Phase 8. The tag generator should be a pure function taking `serveBaseUrl` as parameter.

2. **Campaign-to-creative relationship cardinality**
   - What we know: Current schema has `creatives.campaign_id` as nullable FK to campaigns. This means one creative can belong to at most one campaign.
   - What's unclear: Whether a creative should be assignable to multiple campaigns.
   - Recommendation: Keep the current 1:N relationship (one campaign has many creatives, one creative belongs to one campaign). This matches the existing FK. If many-to-many is needed later, a junction table can be added. The UI should support removing a creative from its campaign (setting `campaign_id` to null) and reassigning to a different campaign.

3. **What constitutes an "active" creative for tag export**
   - What we know: Success criteria say tags are only available for "active" creatives. The `creative_status` enum has: draft, active, paused, archived.
   - What's unclear: Whether paused creatives should still show their tags (read-only) or hide them entirely.
   - Recommendation: Show tag export button only for creatives with `status = 'active'`. For paused creatives, show the tag but with a warning that serving is paused. Draft and archived creatives should not show tags.

4. **Database types regeneration**
   - What we know: New tables (`tracker_configs`, `creative_trackers`) need TypeScript types in `packages/shared/src/database.types.ts`.
   - What's unclear: Whether `supabase gen types` is available in the current dev environment.
   - Recommendation: Manually add the new table types to `database.types.ts` following the existing pattern. This was the approach taken in Phase 1.

## Existing Codebase Inventory (Critical for Planning)

### Already exists (DO NOT recreate):
- **`campaigns` table**: Created in initial migration with `id`, `advertiser_id`, `name`, `status`, timestamps
- **`campaign_status` enum**: `'draft' | 'active' | 'paused' | 'completed'`
- **`creative_status` enum**: `'draft' | 'active' | 'paused' | 'archived'`
- **`creatives.campaign_id`** FK: Nullable, references `campaigns(id)`, ON DELETE SET NULL
- **RLS policies on campaigns**: Super admin full access + users manage own (by advertiser_id)
- **RLS policies on creatives**: Already enforce advertiser-scoped access
- **`campaigns` typed in `Database`**: Full Row/Insert/Update types in shared package
- **Campaign constants**: `CAMPAIGN_STATUSES` array and `CampaignStatus` type in shared constants
- **Router placeholder**: `/campaigns` route exists with `SectionPlaceholder` component
- **Sidebar nav item**: "Campaigns" with Megaphone icon already in navigation
- **Seed data**: Test campaign and creative already in seed.sql
- **Helper functions**: `get_user_advertiser_id()`, `is_super_admin()`, `handle_updated_at()` trigger
- **UI components**: Dialog, AlertDialog, Badge, Button, Card, Form, Input, Select, Table, Tabs, Textarea -- all from shadcn/ui

### Must be created:
- **`tracker_configs` table**: New migration for DATA-08
- **`creative_trackers` table**: New migration for DATA-08
- **Database types**: Add tracker table types to `database.types.ts`
- **`features/campaigns/`**: Entire feature module (API, hooks, components, pages)
- **Tag generator utility**: Client-side DFP/GAM and embed code generation
- **Status machine utility**: Transition validation logic
- **Tracker CRUD**: API and UI for managing third-party trackers

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `supabase/migrations/20260219000000_initial_schema.sql` -- campaigns table, RLS policies, enums
- Codebase analysis: `packages/shared/src/database.types.ts` -- TypeScript types for all tables
- Codebase analysis: `apps/web/src/features/creatives/` -- CRUD API pattern, React Query hooks, component patterns
- Codebase analysis: `apps/web/src/features/creatives/components/share-dialog.tsx` -- copy-to-clipboard pattern
- Codebase analysis: `apps/web/src/router.tsx` -- lazy route loading pattern, existing placeholder
- Codebase analysis: `packages/shared/src/constants.ts` -- status enum constants already exported

### Secondary (MEDIUM confidence)
- [Google Ad Manager Macros - MonetizeMore](https://www.monetizemore.com/blog/google-ad-manager-macros-every-publisher-needs-to-know/) -- DFP/GAM macro reference (%%CLICK_URL_ESC%%, %%CACHEBUSTER%%, etc.)
- [Google Ad Manager Macros - Headerbidding.co](https://headerbidding.co/google-ad-manager-macros/) -- Corroborating macro documentation
- [What is an Ad Tag - Epom](https://epom.com/blog/ad-server/what-is-an-ad-tag) -- Ad tag format examples (sync/async/iframe)
- [Understanding Third Party Tracking - Adventive](https://help.adventive.com/en/knowledge/campaigns/understanding-third-party-tracking) -- Tracker fire conditions, event types
- [Third party impression tracking - Google Ad Manager Help](https://support.google.com/admanager/answer/13821066?hl=en) -- Official tracker integration docs

### Tertiary (LOW confidence)
- Tag serve URL format -- placeholder until Phase 8 defines the actual serve endpoint

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new dependencies; all libraries already in use and verified in codebase
- Architecture: HIGH -- Direct extension of established feature module pattern from creatives
- Database: HIGH -- Campaigns table + RLS already exist; tracker tables follow same pattern
- Tag generation: MEDIUM -- DFP macro format verified from multiple sources; serve URL format is placeholder
- Pitfalls: HIGH -- Based on direct codebase analysis and ad tech domain knowledge

**Research date:** 2026-02-23
**Valid until:** 2026-03-23 (stable domain, no fast-moving dependencies)
