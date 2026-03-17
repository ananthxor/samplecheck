---
phase: 01-foundation-data-schema
plan: 02
subsystem: frontend
tags: [react, typescript, vite, tailwindcss, pnpm, monorepo, supabase-js, tanstack-query, shadcn-ui]

# Dependency graph
requires:
  - phase: 01-foundation-data-schema/01
    provides: "Supabase project with 6 tables, TypeScript database types, and environment config"
provides:
  - "pnpm monorepo with 3 workspace packages (web, shared, ad-sdk)"
  - "React 19 + TypeScript + Vite 6 frontend app with hot reload"
  - "Tailwind CSS 4 styling with @tailwindcss/vite plugin"
  - "shadcn/ui configuration (New York style, cn() utility, components.json)"
  - "Supabase client singleton with typed Database generic"
  - "TanStack Query (React Query v5) provider with default options"
  - "Shared package exporting Database types and domain constants"
  - "Ad-SDK placeholder package for Phase 8"
  - "Production build pipeline (tsc + vite build)"
affects: [03-auth, 04-creative-editor, 07-campaign-management, 08-ad-serving, 09-billing, 10-analytics]

# Tech tracking
tech-stack:
  added: [react-19, react-dom-19, vite-6, tailwindcss-4, "@tailwindcss/vite", "@vitejs/plugin-react", typescript-5.7, "@supabase/supabase-js-2", "@tanstack/react-query-5", clsx, tailwind-merge, pnpm-10, shadcn-ui]
  patterns: [pnpm-monorepo, workspace-protocol, vite-path-aliases, env-dir-monorepo-root, supabase-typed-client, query-client-provider, cn-utility]

key-files:
  created:
    - pnpm-workspace.yaml
    - package.json
    - apps/web/package.json
    - apps/web/index.html
    - apps/web/vite.config.ts
    - apps/web/tsconfig.json
    - apps/web/tsconfig.app.json
    - apps/web/tsconfig.node.json
    - apps/web/src/main.tsx
    - apps/web/src/App.tsx
    - apps/web/src/index.css
    - apps/web/src/vite-env.d.ts
    - apps/web/src/lib/supabase.ts
    - apps/web/src/lib/utils.ts
    - apps/web/components.json
    - packages/shared/package.json
    - packages/shared/tsconfig.json
    - packages/shared/src/index.ts
    - packages/shared/src/database.types.ts
    - packages/shared/src/constants.ts
    - packages/ad-sdk/package.json
    - packages/ad-sdk/tsconfig.json
    - packages/ad-sdk/src/index.ts
    - pnpm-lock.yaml
  modified: []

key-decisions:
  - "Vite 6 instead of Vite 7 (plan specified v7 but v6.4.1 is latest stable; v7 not yet released)"
  - "Used pnpm onlyBuiltDependencies for esbuild to avoid interactive approve-builds prompt"
  - "shadcn/ui initialized manually (components.json + cn utility) to avoid interactive CLI prompts"
  - "database.types.ts moved from project root to packages/shared/src/ as planned"

patterns-established:
  - "Monorepo import pattern: workspace packages referenced via @scrolltoday/shared (workspace:*)"
  - "Path alias pattern: '@/' maps to './src/' in web app for clean imports"
  - "Environment config: envDir='../../' in vite.config.ts reads .env from monorepo root"
  - "Supabase client pattern: typed createClient<Database> singleton in lib/supabase.ts"
  - "State management: TanStack Query for server state, 5-minute stale time default"
  - "CSS utility pattern: cn() from clsx + tailwind-merge for conditional class merging"
  - "Component config: shadcn/ui New York style with CSS variables and @/ aliases"

requirements-completed: [DATA-01, DATA-05]

# Metrics
duration: 10min
completed: 2026-02-19
---

# Phase 1 Plan 2: Frontend Scaffold Summary

**pnpm monorepo with React 19 + Vite 6 + Tailwind CSS 4 web app, typed Supabase client, TanStack Query, and shadcn/ui configuration**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-02-19T09:58:21Z
- **Completed:** 2026-02-19T10:08:24Z
- **Tasks:** 2
- **Files created:** 24

## Accomplishments

- pnpm monorepo with 3 workspace packages (web, shared, ad-sdk) all resolving cross-package imports
- React 19 + TypeScript app with Vite 6 dev server, Tailwind CSS 4 styling, and production build pipeline
- Supabase client singleton with auto-generated Database type generic connecting to remote project
- TanStack Query provider configured with sensible defaults (5-min stale time, 1 retry)
- shadcn/ui configured (New York style, CSS variables, cn() utility ready for component installation)
- Shared package exports Database types and domain constants (EVENT_TYPES, CREATIVE_STATUSES, etc.)
- All TypeScript compilation passes across all 3 packages with strict mode

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold pnpm monorepo with web app, shared package, and ad-sdk placeholder** - `7c5cc47` (feat)
2. **Task 2: Wire Supabase client, verify full-stack connection, and confirm dev server** - `d1bf82b` (feat)

**Plan metadata:** [pending] (docs: complete plan)

## Files Created/Modified

- `pnpm-workspace.yaml` - Workspace config for apps/* and packages/*
- `package.json` - Root monorepo package with dev/build/typecheck scripts and esbuild build approval
- `apps/web/package.json` - Web app with React 19, Supabase, TanStack Query, Tailwind CSS 4
- `apps/web/index.html` - Vite entry HTML pointing to /src/main.tsx
- `apps/web/vite.config.ts` - Vite config with react(), tailwindcss() plugins and @/ path alias
- `apps/web/tsconfig.json` - Project references to tsconfig.app.json and tsconfig.node.json
- `apps/web/tsconfig.app.json` - Strict TypeScript for React with bundler module resolution
- `apps/web/tsconfig.node.json` - TypeScript for vite.config.ts (ES2022 target)
- `apps/web/src/main.tsx` - React 19 createRoot with StrictMode wrapper
- `apps/web/src/App.tsx` - Root component with QueryClientProvider and Supabase connection status
- `apps/web/src/index.css` - Tailwind CSS 4 import
- `apps/web/src/vite-env.d.ts` - Vite environment variable type declarations
- `apps/web/src/lib/supabase.ts` - Supabase client singleton with Database type generic
- `apps/web/src/lib/utils.ts` - shadcn cn() utility (clsx + tailwind-merge)
- `apps/web/components.json` - shadcn/ui configuration (New York style, CSS variables)
- `packages/shared/package.json` - Shared types package
- `packages/shared/tsconfig.json` - TypeScript config for shared package
- `packages/shared/src/index.ts` - Barrel export for Database type and constants
- `packages/shared/src/database.types.ts` - Auto-generated Supabase database types (moved from root)
- `packages/shared/src/constants.ts` - Shared domain constants (EVENT_TYPES, statuses, roles, MIME types)
- `packages/ad-sdk/package.json` - Ad SDK placeholder package
- `packages/ad-sdk/tsconfig.json` - TypeScript config for ad-sdk
- `packages/ad-sdk/src/index.ts` - Ad SDK version placeholder
- `pnpm-lock.yaml` - Lockfile for all workspace dependencies

## Decisions Made

1. **Vite 6 instead of Vite 7** - Plan specified Vite 7, but v6.4.1 is the latest stable release as of this date. Vite 7 has not been released yet. Using v6 ensures stability; upgrading to v7 when available will be trivial.
2. **Manual shadcn/ui setup** - The `pnpm dlx shadcn@latest init` command triggers an interactive CLI prompt that blocks in automated environments. Created `components.json` and `cn()` utility manually instead, which is functionally identical.
3. **pnpm onlyBuiltDependencies** - Added `pnpm.onlyBuiltDependencies: ["esbuild"]` to root package.json to auto-approve esbuild postinstall scripts, avoiding the interactive `pnpm approve-builds` prompt.
4. **database.types.ts moved to packages/shared** - As planned, the root-level file from Plan 01 was moved to `packages/shared/src/database.types.ts` for proper monorepo import resolution.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] pnpm not installed globally**
- **Found during:** Task 1, Step 6 (Install dependencies)
- **Issue:** pnpm was not available in the PATH; corepack enable failed due to EPERM on Windows
- **Fix:** Installed pnpm globally via `npm install -g pnpm`
- **Files modified:** None (system-level change)
- **Verification:** `pnpm --version` returns 10.30.0
- **Committed in:** N/A (tooling)

**2. [Rule 3 - Blocking] esbuild build scripts blocked by pnpm**
- **Found during:** Task 1, Step 6 (Install dependencies)
- **Issue:** pnpm 10 requires explicit approval for postinstall scripts; esbuild was blocked
- **Fix:** Added `pnpm.onlyBuiltDependencies: ["esbuild"]` to root package.json
- **Files modified:** package.json
- **Verification:** `pnpm install` builds esbuild successfully
- **Committed in:** 7c5cc47 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both were tooling/environment blockers resolved with standard fixes. No scope creep.

## Issues Encountered

- Vite 7 not available: Plan referenced Vite 7 which hasn't been released yet. Used Vite 6.4.1 (latest stable) which provides all needed features. Upgrade path will be straightforward.
- Windows EPERM for corepack: `corepack enable` requires admin privileges on Windows to write to Program Files. Used `npm install -g pnpm` as alternative.

## User Setup Required

None - all dependencies install via `pnpm install` from the monorepo root. Environment variables were already configured in Plan 01.

## Next Phase Readiness

- Frontend shell is running at localhost:5173 with hot reload -- ready for UI components in Phase 3
- Supabase client connected with typed Database generic -- ready for auth flows in Phase 2
- TanStack Query provider in place -- ready for data fetching hooks
- shadcn/ui configured -- ready for `pnpm dlx shadcn@latest add button` etc. in Phase 3
- Shared package exports all domain types and constants for cross-package use
- Production build pipeline verified (`pnpm build` produces optimized output)

**No blockers for Phase 2 (Authentication).**

## Self-Check: PASSED

All claimed artifacts verified:

| Artifact | Status |
|----------|--------|
| pnpm-workspace.yaml | FOUND |
| package.json | FOUND |
| pnpm-lock.yaml | FOUND |
| apps/web/package.json | FOUND |
| apps/web/index.html | FOUND |
| apps/web/vite.config.ts | FOUND |
| apps/web/tsconfig.json | FOUND |
| apps/web/tsconfig.app.json | FOUND |
| apps/web/tsconfig.node.json | FOUND |
| apps/web/src/main.tsx | FOUND |
| apps/web/src/App.tsx | FOUND |
| apps/web/src/index.css | FOUND |
| apps/web/src/vite-env.d.ts | FOUND |
| apps/web/src/lib/supabase.ts | FOUND |
| apps/web/src/lib/utils.ts | FOUND |
| apps/web/components.json | FOUND |
| packages/shared/package.json | FOUND |
| packages/shared/tsconfig.json | FOUND |
| packages/shared/src/index.ts | FOUND |
| packages/shared/src/database.types.ts | FOUND |
| packages/shared/src/constants.ts | FOUND |
| packages/ad-sdk/package.json | FOUND |
| packages/ad-sdk/tsconfig.json | FOUND |
| packages/ad-sdk/src/index.ts | FOUND |
| Commit 7c5cc47 (Task 1) | FOUND |
| Commit d1bf82b (Task 2) | FOUND |
| TypeScript compilation (all packages) | PASSED |
| pnpm dev (Vite server) | PASSED |
| pnpm build (production) | PASSED |

---
*Phase: 01-foundation-data-schema*
*Completed: 2026-02-19*
