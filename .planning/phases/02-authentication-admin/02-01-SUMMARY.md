---
phase: 02-authentication-admin
plan: 01
subsystem: auth
tags: [supabase, edge-functions, deno, admin-api, service-role, cors]

# Dependency graph
requires:
  - phase: 01-foundation-data-schema
    provides: "user_profiles table with role enum, advertisers table, is_super_admin() function, Supabase project config"
provides:
  - "admin-create-user Edge Function (auth user + advertiser + user_profile atomic creation)"
  - "admin-list-users Edge Function (merged auth + profile + advertiser data)"
  - "admin-reset-password Edge Function (server-side password update)"
  - "Shared CORS headers utility for all Edge Functions"
  - "Shared admin client factory with super_admin verification helper"
affects: [02-authentication-admin, 03-dashboard-navigation-shell]

# Tech tracking
tech-stack:
  added: ["Supabase Edge Functions (Deno runtime)", "@supabase/supabase-js@2 (ESM via esm.sh)"]
  patterns: ["Dual-client pattern (service_role admin + anon caller)", "Shared _shared/ utilities for Edge Functions", "Atomic creation with cleanup on failure"]

key-files:
  created:
    - "supabase/functions/_shared/cors.ts"
    - "supabase/functions/_shared/supabase-admin.ts"
    - "supabase/functions/admin-create-user/index.ts"
    - "supabase/functions/admin-list-users/index.ts"
    - "supabase/functions/admin-reset-password/index.ts"
  modified: []

key-decisions:
  - "Dual-client pattern: service_role client for admin ops, anon+JWT client for caller verification -- prevents JWT overriding service_role"
  - "Deployment deferred: --use-api deployment requires SUPABASE_ACCESS_TOKEN which was not available; functions ready to deploy"

patterns-established:
  - "Edge Function structure: OPTIONS handler + verifySuperAdmin + business logic + corsHeaders on all responses"
  - "Atomic creation with cleanup: if downstream inserts fail, delete upstream records (auth user, advertiser)"
  - "Shared utilities in supabase/functions/_shared/ imported via relative path"

# Metrics
duration: 8min
completed: 2026-02-19
---

# Phase 2 Plan 1: Admin Edge Functions Summary

**Three Supabase Edge Functions for admin user management (create, list, reset-password) with shared CORS and dual-client super_admin verification**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-02-19
- **Completed:** 2026-02-19
- **Tasks:** 2 (1 fully completed, 1 deferred due to auth gate)
- **Files created:** 5

## Accomplishments
- Created shared CORS headers utility and admin client factory with super_admin verification
- Built admin-create-user Edge Function with atomic user+advertiser+profile creation and cleanup on failure
- Built admin-list-users Edge Function that merges auth.admin.listUsers with user_profiles and advertisers
- Built admin-reset-password Edge Function using auth.admin.updateUserById
- All functions implement CORS preflight, input validation, and proper error status codes (401/403/400)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create shared Edge Function utilities and all three admin Edge Functions** - `259c909` (feat)
2. **Task 2: Deploy Edge Functions to Supabase** - No commit (auth gate: SUPABASE_ACCESS_TOKEN required)

## Files Created/Modified
- `supabase/functions/_shared/cors.ts` - Shared CORS headers for browser-based Edge Function invocation
- `supabase/functions/_shared/supabase-admin.ts` - Admin client factory (createAdminClient) and caller verification (verifySuperAdmin)
- `supabase/functions/admin-create-user/index.ts` - POST: creates auth user + advertiser + user_profile atomically with rollback
- `supabase/functions/admin-list-users/index.ts` - GET/POST: returns all users merged with profiles and advertiser data
- `supabase/functions/admin-reset-password/index.ts` - POST: resets user password via auth.admin.updateUserById

## Decisions Made
- **Dual-client pattern**: Two separate Supabase clients in each Edge Function -- one with service_role key for admin operations, one with anon key + caller JWT for identity verification. This prevents the caller's JWT from overriding the service_role key (which would subject admin queries to RLS).
- **Deployment deferred**: The `--use-api` flag requires `SUPABASE_ACCESS_TOKEN` environment variable or `npx supabase login`. This is a one-time setup step documented below.

## Deviations from Plan

None - plan executed exactly as written. The deployment auth gate was explicitly anticipated in the plan's action and done criteria.

## Issues Encountered

### Deployment Auth Gate (Expected)

**Task 2** attempted to deploy Edge Functions via `npx supabase functions deploy --use-api --project-ref ltiqcyigqlytqeisfoeq`. The CLI returned: "Access token not provided. Supply an access token by running supabase login or setting the SUPABASE_ACCESS_TOKEN environment variable."

This was anticipated by the plan. To complete deployment:

1. **Option A (interactive):** Run `npx supabase login` -- opens browser for Supabase authentication, stores token locally
2. **Option B (env var):** Set `SUPABASE_ACCESS_TOKEN` environment variable with a token from https://supabase.com/dashboard/account/tokens
3. **Then deploy all three functions:**
   ```
   npx supabase functions deploy admin-create-user --use-api --project-ref ltiqcyigqlytqeisfoeq
   npx supabase functions deploy admin-list-users --use-api --project-ref ltiqcyigqlytqeisfoeq
   npx supabase functions deploy admin-reset-password --use-api --project-ref ltiqcyigqlytqeisfoeq
   ```
4. **Verify:** `npx supabase functions list --project-ref ltiqcyigqlytqeisfoeq`

## User Setup Required

**Supabase access token needed for Edge Function deployment.** Steps:

1. Go to https://supabase.com/dashboard/account/tokens
2. Generate a new access token
3. Either run `npx supabase login --token YOUR_TOKEN` or set `SUPABASE_ACCESS_TOKEN=YOUR_TOKEN` in environment
4. Deploy functions using the commands above
5. Verify with `npx supabase functions list --project-ref ltiqcyigqlytqeisfoeq`

## Next Phase Readiness
- All Edge Function source code is complete and committed -- ready to deploy once auth token is configured
- Plan 02-02 (AuthProvider, login UI, protected routes) can reference these functions via `supabase.functions.invoke()`
- Super admin bootstrap still needed: create first user via Supabase Dashboard Auth panel + manual SQL insert for user_profile with role='super_admin'

## Self-Check: PASSED

- [x] supabase/functions/_shared/cors.ts - FOUND
- [x] supabase/functions/_shared/supabase-admin.ts - FOUND
- [x] supabase/functions/admin-create-user/index.ts - FOUND
- [x] supabase/functions/admin-list-users/index.ts - FOUND
- [x] supabase/functions/admin-reset-password/index.ts - FOUND
- [x] .planning/phases/02-authentication-admin/02-01-SUMMARY.md - FOUND
- [x] Commit 259c909 - FOUND

---
*Phase: 02-authentication-admin*
*Completed: 2026-02-19*
