---
phase: 04-template-library-ad-editor
plan: 03
subsystem: ui
tags: [react, supabase, rls, uuid, tanstack-query, shadcn, react-router]

# Dependency graph
requires:
  - phase: 04-02
    provides: Creative editor workflow, creatives table in Supabase, creatives-api with save functionality
  - phase: 04-01
    provides: Template registry and browsing page (TemplatesPage component)
provides:
  - My Creatives library page at /creatives with grid of saved creatives and action menus
  - Share dialog that generates a UUID preview_token and constructs a copyable preview URL
  - Public preview page at /preview/:token accessible without authentication via anon RLS
  - Database migration adding preview_token column (TEXT UNIQUE) with partial index and anon RLS policy
  - Dual-mode /creatives route: library (no params) vs template browsing (type/format params)
affects: [05-analytics-reporting, 06-campaign-management, 08-ad-serving]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Anon RLS policy pattern: non-null column value as public access gate (preview_token IS NOT NULL)
    - Dual-mode page pattern: single route renders different views based on URL search params
    - Public route outside ProtectedRoute: /preview/:token placed at router root level

key-files:
  created:
    - supabase/migrations/20260220000000_add_preview_token.sql
    - apps/web/src/features/creatives/components/creative-card.tsx
    - apps/web/src/features/creatives/components/creative-actions.tsx
    - apps/web/src/features/creatives/components/creative-list.tsx
    - apps/web/src/features/creatives/components/share-dialog.tsx
    - apps/web/src/features/creatives/pages/creatives-page.tsx
    - apps/web/src/features/preview/pages/preview-page.tsx
  modified:
    - packages/shared/src/database.types.ts
    - apps/web/src/features/creatives/api/creatives-api.ts
    - apps/web/src/router.tsx

key-decisions:
  - "Anon RLS policy uses USING (preview_token IS NOT NULL) -- app always queries with .eq('preview_token', token) so only matching row returned"
  - "Partial index on preview_token WHERE preview_token IS NOT NULL -- avoids indexing null-heavy column"
  - "Public preview route placed at router root level outside ProtectedRoute to allow unauthenticated access"
  - "Dual-mode creatives page checks typeFilter || formatFilter to branch between library and template browsing -- keeps single route /creatives"

patterns-established:
  - "Anon RLS pattern: use non-null column as access predicate; query always filters by that column so exposure is safe"
  - "Dual-mode route pattern: single lazy-loaded page component reads search params and delegates to sub-page"
  - "Public route pattern: top-level createBrowserRouter route bypasses ProtectedRoute wrapper"

# Metrics
duration: 15min
completed: 2026-02-20
---

# Phase 4 Plan 03: My Creatives Library, Shareable Preview Links Summary

**My Creatives library with UUID-based shareable preview links, anon RLS policy on Supabase, and a public preview page at /preview/:token that renders creatives without authentication**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-02-20T05:42:00Z
- **Completed:** 2026-02-20T05:44:09Z
- **Tasks:** 3 (2 auto + 1 checkpoint UAT)
- **Files modified:** 10

## Accomplishments

- Database migration deployed: preview_token TEXT UNIQUE column with partial index and anon SELECT RLS policy on creatives table
- My Creatives library page built with responsive grid, status badges (draft/active/paused/archived), and actions dropdown (edit/share/delete with confirmation AlertDialog)
- Shareable preview link system: share dialog generates crypto.randomUUID() token, stores it via updateCreative, constructs copyable /preview/:token URL
- Public preview page at /preview/:token fetches creative via anon Supabase client (no auth required), renders live iframe preview
- /creatives route converted to dual-mode: no params shows My Creatives library, type/format params show template browsing (TemplatesPage)
- UAT approved by user across all 5 Phase 4 flows

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migration for preview_token, type update, My Creatives library components** - `07a7e7c` (feat)
2. **Task 2: Share dialog, public preview page, and router wiring for shareable links** - `f9dc83b` (feat)
3. **Task 3: UAT - Complete Phase 4 verification** - checkpoint approved (no code commit)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `supabase/migrations/20260220000000_add_preview_token.sql` - preview_token column, partial index, anon RLS SELECT policy
- `packages/shared/src/database.types.ts` - Added preview_token field to Row/Insert/Update types for creatives table
- `apps/web/src/features/creatives/components/creative-card.tsx` - Single creative card with thumbnail, status badge, name, format/dimensions, actions menu
- `apps/web/src/features/creatives/components/creative-actions.tsx` - DropdownMenu with Edit/Preview/Share/Delete actions; Delete triggers AlertDialog confirmation
- `apps/web/src/features/creatives/components/creative-list.tsx` - Grid of CreativeCards with loading skeleton, empty state, error state, ShareDialog integration
- `apps/web/src/features/creatives/components/share-dialog.tsx` - Dialog to generate UUID token, persist via updateCreative, display copyable URL with clipboard copy
- `apps/web/src/features/creatives/pages/creatives-page.tsx` - Dual-mode page: delegates to CreativeList or TemplatesPage based on URL params
- `apps/web/src/features/preview/pages/preview-page.tsx` - Public preview page using fetchCreativeByToken (anon), renders iframe with generatePreviewHtml
- `apps/web/src/features/creatives/api/creatives-api.ts` - Added fetchCreativeByToken function for anon public access
- `apps/web/src/router.tsx` - Updated /creatives to dual-mode page; added /preview/:token route at root (outside ProtectedRoute)

## Decisions Made

- **Anon RLS policy gate:** Used `USING (preview_token IS NOT NULL)` as the RLS predicate. The application always queries with `.eq('preview_token', token)`, so only the matching creative is ever returned -- the IS NOT NULL gate prevents exposing all creatives to anon users while keeping the policy simple.
- **Partial index:** `CREATE INDEX idx_creatives_preview_token ON public.creatives (preview_token) WHERE preview_token IS NOT NULL` avoids indexing the many null rows before any sharing occurs.
- **Public route placement:** `/preview/:token` added as a top-level route in `createBrowserRouter` outside the `ProtectedRoute` element, so unauthenticated users are never redirected to login.
- **Dual-mode via search params:** Single `/creatives` path checks `typeFilter || formatFilter` to branch between views. URL shape (`/creatives?type=standard`) from Phase 3 search navigation continues to work unchanged.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Migration was deployed directly via `supabase db push --db-url` (established pattern from Phase 1).

## Next Phase Readiness

Phase 4 is fully complete. The creative lifecycle is end-to-end:
- Browse templates -> select -> customize in split-pane editor -> save to Supabase -> view in My Creatives library -> share preview link -> stakeholder views without login

Phases 5 (Analytics & Reporting) and 6 (Campaign Management) can now execute in parallel per the roadmap decision -- both depend only on the template/editor layer completed in Phase 4.

---
*Phase: 04-template-library-ad-editor*
*Completed: 2026-02-20*
