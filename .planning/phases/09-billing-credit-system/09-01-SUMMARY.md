---
phase: 09-billing-credit-system
plan: 01
subsystem: payments
tags: [stripe, supabase, edge-functions, deno, postgres, pg_cron, credit-system, billing, webhook]

# Dependency graph
requires:
  - phase: 01-foundation-data-schema
    provides: "advertisers table, daily_metrics table, RLS policy pattern, helper functions, db push --db-url pattern"
  - phase: 08-ad-serving-infrastructure
    provides: "credit_balance BIGINT on advertisers, deduct_impression_credit function, supabase-admin.ts, cors.ts"
provides:
  - "credit_transactions ledger table with stripe_session_id UNIQUE for idempotent webhook processing"
  - "add_impression_credits PL/pgSQL function returning new balance"
  - "daily_metrics UNIQUE index with NULLS NOT DISTINCT for NULL campaign_id handling"
  - "rollup_daily_metrics PL/pgSQL function with idempotent ON CONFLICT upsert"
  - "pg_cron scheduled job for daily metrics rollup at 2 AM UTC"
  - "Shared stripe.ts with Stripe client factory, cryptoProvider, and CREDIT_PACKS config"
  - "create-checkout Edge Function for authenticated Stripe Checkout Session creation"
  - "stripe-webhook Edge Function for webhook signature verification and credit fulfillment"
  - "Updated TypeScript types with credit_transactions table and new function types"
affects: [09-billing-ui, 10-analytics]

# Tech tracking
tech-stack:
  added: [stripe@14-esm-denonext, pg_cron]
  patterns: [stripe-checkout-sessions, webhook-signature-verification, idempotent-webhook-processing, atomic-credit-addition, daily-metrics-rollup, nulls-not-distinct]

key-files:
  created:
    - supabase/migrations/20260225000001_billing_tables.sql
    - supabase/functions/_shared/stripe.ts
    - supabase/functions/create-checkout/index.ts
    - supabase/functions/stripe-webhook/index.ts
  modified:
    - packages/shared/src/database.types.ts

key-decisions:
  - "Stripe SDK v14 via esm.sh with ?target=denonext (matching official Supabase example, not latest v20)"
  - "create-checkout deployed with default JWT verification (authenticated); stripe-webhook deployed with --no-verify-jwt (public for Stripe callbacks)"
  - "NULLS NOT DISTINCT on daily_metrics unique index for correct ON CONFLICT with NULL campaign_id"
  - "pg_cron CREATE EXTENSION included in migration (requires Dashboard pre-enablement)"
  - "Webhook idempotency via stripe_session_id UNIQUE constraint + check-before-insert pattern"
  - "add_impression_credits returns BIGINT (new balance) for balance_after snapshot in transaction record"

patterns-established:
  - "Stripe integration: shared stripe.ts client factory + cryptoProvider for all Stripe Edge Functions"
  - "Credit ledger: append-only credit_transactions table with stripe_session_id UNIQUE for idempotency"
  - "Webhook fulfillment: verify signature -> check idempotency -> RPC atomic operation -> record transaction"
  - "Daily rollup: pg_cron + INSERT ON CONFLICT DO UPDATE for idempotent daily aggregation"

requirements-completed: [BILL-01, DATA-06]

# Metrics
duration: 5min
completed: 2026-02-24
---

# Phase 9 Plan 1: Billing Backend Summary

**Stripe Checkout integration via two Edge Functions (create-checkout + stripe-webhook) with credit_transactions ledger, atomic credit addition, daily metrics rollup via pg_cron, and idempotent webhook processing**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-02-24T07:55:26Z
- **Completed:** 2026-02-24T07:59:55Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Created credit_transactions ledger table with stripe_session_id UNIQUE constraint for idempotent webhook processing
- Built add_impression_credits PL/pgSQL function (counterpart to Phase 8's deduct_impression_credit) returning new balance
- Fixed daily_metrics UNIQUE constraint with NULLS NOT DISTINCT for correct ON CONFLICT with NULL campaign_id
- Created rollup_daily_metrics function with CTE RETURNING pattern for idempotent daily aggregation
- Scheduled pg_cron job at 2 AM UTC for automatic daily metrics rollup
- Built shared stripe.ts with Stripe client factory, Web Crypto provider, and CREDIT_PACKS configuration
- Deployed create-checkout Edge Function (authenticated, JWT verified via auth.getUser)
- Deployed stripe-webhook Edge Function (public, --no-verify-jwt, signature verification via constructEventAsync + cryptoProvider)

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migration -- credit_transactions, add_impression_credits, daily_metrics rollup, pg_cron** - `678f50f` (feat)
2. **Task 2: Stripe Edge Functions -- create-checkout + stripe-webhook** - `79776bc` (feat)

**Plan metadata:** [pending] (docs: complete plan)

## Files Created/Modified

- `supabase/migrations/20260225000001_billing_tables.sql` - Credit transactions table, add_impression_credits function, daily_metrics UNIQUE fix, rollup_daily_metrics function, pg_cron schedule
- `supabase/functions/_shared/stripe.ts` - Shared Stripe client factory, cryptoProvider, CREDIT_PACKS config with 3 tiers
- `supabase/functions/create-checkout/index.ts` - Authenticated Edge Function creating Stripe Checkout Sessions with advertiser metadata
- `supabase/functions/stripe-webhook/index.ts` - Public Edge Function verifying Stripe signatures, checking idempotency, adding credits via RPC, recording transactions
- `packages/shared/src/database.types.ts` - Added credit_transactions table type, add_impression_credits and rollup_daily_metrics function types

## Decisions Made

1. **Stripe SDK v14 via esm.sh** -- Used `stripe@14?target=denonext` matching the official Supabase webhook example, not the latest v20 on npm. This is the verified-working version for Deno Edge Functions.
2. **create-checkout with JWT, stripe-webhook without** -- create-checkout needs authenticated users to link purchases to advertisers. stripe-webhook is called by Stripe's servers and uses webhook signature verification instead.
3. **NULLS NOT DISTINCT** -- PostgreSQL 15+ feature on daily_metrics unique index. Required for ON CONFLICT to correctly match rows where campaign_id is NULL (creatives not assigned to campaigns).
4. **pg_cron in migration** -- Included `CREATE EXTENSION IF NOT EXISTS pg_cron` in the migration. This requires the extension to be pre-enabled via Supabase Dashboard. The migration will fail at the pg_cron section if not pre-enabled, but all other parts succeed.
5. **add_impression_credits returns BIGINT** -- Returns the new balance so the webhook handler can store `balance_after` in the transaction record for audit trail.
6. **Webhook idempotency** -- Uses two layers: check-before-insert pattern (query for existing stripe_session_id) plus UNIQUE constraint on stripe_session_id as a safety net.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **Database URL format** -- Initial `db push` failed with pooler URL format. Used direct connection format (`postgres:password@db.ref.supabase.co:5432/postgres`) matching Phase 1 pattern. Resolved immediately.
- **Daily metrics constraint name truncation** -- PostgreSQL truncated the 63+ character constraint name in `DROP CONSTRAINT IF EXISTS`. The `IF EXISTS` clause handled this gracefully (constraint was already named differently in the original migration).

## User Setup Required

Stripe integration requires manual configuration before the Edge Functions will work at runtime:

1. **Create 3 products in Stripe Dashboard** (Products -> Add product):
   - 50,000 Impressions pack
   - 200,000 Impressions pack
   - 1,000,000 Impressions pack

2. **Create webhook endpoint** (Developers -> Webhooks -> Add endpoint):
   - URL: `https://ltiqcyigqlytqeisfoeq.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`

3. **Set Supabase secrets**:
   ```bash
   npx supabase secrets set STRIPE_API_KEY=sk_test_... STRIPE_WEBHOOK_SIGNING_SECRET=whsec_... STRIPE_PRICE_50K=price_... STRIPE_PRICE_200K=price_... STRIPE_PRICE_1M=price_...
   ```

4. **Enable pg_cron** (if not already): Supabase Dashboard -> Database -> Extensions -> search "pg_cron" -> Enable

## Next Phase Readiness

Plan 09-01 backend is complete. Ready for:
- **09-02**: Frontend billing UI (credit balance display, credit pack purchase flow, transaction history)
- **09-03**: Low-balance warnings and additional billing features
- **Phase 10**: Analytics dashboard can use rollup_daily_metrics and daily_metrics table

**No blockers for downstream plans.**

## Self-Check: PASSED

All claimed artifacts verified:

| Artifact | Status |
|----------|--------|
| Commit 678f50f | FOUND |
| Commit 79776bc | FOUND |
| supabase/migrations/20260225000001_billing_tables.sql | FOUND |
| supabase/functions/_shared/stripe.ts | FOUND |
| supabase/functions/create-checkout/index.ts | FOUND |
| supabase/functions/stripe-webhook/index.ts | FOUND |
| packages/shared/src/database.types.ts (credit_transactions) | FOUND |
| credit_transactions table queryable (REST API) | VERIFIED (HTTP 200, empty array) |
| rollup_daily_metrics RPC callable | VERIFIED (returned 0) |
| Both Edge Functions deployed | VERIFIED (Supabase CLI output) |

---
*Phase: 09-billing-credit-system*
*Completed: 2026-02-24*
