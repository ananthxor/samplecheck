# Phase 9: Billing & Credit System - Research

**Researched:** 2026-02-24
**Domain:** Stripe Checkout integration via Supabase Edge Functions, credit ledger tables, real-time balance display, low-balance warnings, transaction history, daily metrics rollup
**Confidence:** HIGH

## Summary

Phase 9 adds the monetization layer to ScrollToday. The core architecture is: Stripe Checkout Sessions for one-time credit pack purchases, a Stripe webhook Edge Function for fulfillment, a `credit_transactions` ledger table for audit trail, real-time credit balance display in the app header, and low-balance warning notifications. The existing `credit_balance BIGINT` on the `advertisers` table already supports atomic deduction (Phase 8); this phase adds the credit addition side and the user-facing billing UI.

The integration follows a well-established pattern: the frontend calls a `create-checkout` Edge Function that creates a Stripe Checkout Session and returns the URL; the user is redirected to Stripe's hosted payment page; after payment, Stripe sends a `checkout.session.completed` webhook to a `stripe-webhook` Edge Function that verifies the signature, adds credits to the advertiser's balance, and inserts a transaction record. This is the exact pattern documented in Supabase's official Stripe webhook example.

The daily metrics rollup (DATA-06) uses Supabase's built-in `pg_cron` extension to schedule a PL/pgSQL function that aggregates `ad_events` into the existing `daily_metrics` table. This runs once daily (e.g., 2:00 AM UTC) and uses an `INSERT ... ON CONFLICT ... DO UPDATE` pattern for idempotent re-runs. The `daily_metrics` table already exists from Phase 1 with the correct schema.

**Primary recommendation:** Use Stripe Checkout Sessions (hosted payment page, `mode: 'payment'`) via two new Supabase Edge Functions (`create-checkout` and `stripe-webhook`). Store all transactions in a new `credit_transactions` ledger table. Use `pg_cron` for the daily metrics rollup. Display credit balance in the app header via a TanStack Query hook polling the `advertisers` table.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BILL-01 | Prepaid impression credit packs via Stripe (e.g., 50k / 200k / 1M) | Stripe Checkout Sessions with `mode: 'payment'` for one-time purchases. Define 3 Products/Prices in Stripe Dashboard. `create-checkout` Edge Function creates session with advertiser metadata. `stripe-webhook` Edge Function processes `checkout.session.completed` to add credits atomically. |
| BILL-02 | Credit balance always visible in header | TanStack Query hook fetching `advertisers.credit_balance` via Supabase client. Displayed in `AppHeader` component. Query invalidated on purchase completion (success page redirect) and periodically via `refetchInterval`. |
| BILL-03 | Transaction history with receipts | `credit_transactions` ledger table recording all credit additions (purchases) and deductions (if needed for visibility). Stripe `receipt_url` stored per transaction for direct receipt access. Billing page with table component showing transaction history. |
| BILL-04 | Low-balance warning at 10% remaining | Store `last_purchased_amount` on advertiser or derive from most recent purchase transaction. Compare `credit_balance` against 10% threshold. Display warning toast/banner when threshold crossed. Check on every balance read. |
| BILL-05 | Free to create and preview ads without purchasing credits | Already implemented architecturally -- `credit_balance` check only happens in `serve-ad` Edge Function (Phase 8). Editor, preview, and creative save have no credit checks. This requirement needs verification testing only, no new code. |
| DATA-06 | Pre-aggregated daily metrics rollup tables for fast dashboard performance | `daily_metrics` table already exists from Phase 1. Create a PL/pgSQL `rollup_daily_metrics()` function that aggregates yesterday's `ad_events` into `daily_metrics` using `INSERT ... ON CONFLICT ... DO UPDATE`. Schedule with `pg_cron` at `0 2 * * *` (2 AM UTC daily). |
</phase_requirements>

## Standard Stack

### Core (Already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase Edge Functions (Deno) | Deno 2 runtime | Checkout session creation + webhook handler | Already used for admin functions, serve-ad, track-event; `--no-verify-jwt` pattern established |
| @supabase/supabase-js | ^2 | Frontend credit balance queries, Edge Function DB operations | Already in `lib/supabase.ts` and `_shared/supabase-admin.ts` |
| TanStack Query | ^5.90 | Credit balance polling, transaction history fetching | Already used for creatives, campaigns hooks; `refetchInterval` for live balance |
| PostgreSQL (via Supabase) | 17 | Credit ledger table, atomic credit addition, pg_cron rollup | Existing database with `advertisers.credit_balance` BIGINT column |
| sonner (toast) | Already installed | Low-balance warning notifications | Already used in `App.tsx` via `<Toaster />` |
| shadcn/ui | Already installed | Billing page UI (tables, cards, buttons, badges) | Already used across all pages |

### New Dependencies (Edge Functions only)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Stripe (Deno) | `https://esm.sh/stripe@14?target=denonext` | Checkout Session creation + webhook signature verification | In `create-checkout` and `stripe-webhook` Edge Functions only |

### Frontend -- No new npm dependencies needed
The frontend needs only existing libraries: `@supabase/supabase-js` for queries, `@tanstack/react-query` for data fetching, shadcn/ui for UI components, and `sonner` for toast notifications. Stripe's hosted Checkout page handles all payment UI -- no `@stripe/stripe-js` or `@stripe/react-stripe-js` needed on the client.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Stripe Checkout (hosted page) | Stripe Elements (embedded) | Hosted page is simpler, PCI-compliant by default, no frontend Stripe SDK needed. Elements gives more UI control but adds complexity and `@stripe/stripe-js` dependency. |
| Stripe Checkout (hosted page) | Stripe Payment Links | Payment Links are even simpler (no code) but cannot pass metadata or `client_reference_id` programmatically. We need to link payment to advertiser_id. |
| `credit_transactions` ledger table | Only update `credit_balance` directly | Ledger table provides audit trail, enables transaction history page, supports receipt URL storage, and allows reconciliation. Direct update loses history. |
| pg_cron for daily rollup | Edge Function with cron schedule | pg_cron runs inside PostgreSQL with zero network latency. Edge Function cron would add HTTP overhead and cold start concerns for a pure SQL aggregation job. |
| Polling `advertisers.credit_balance` | Supabase Realtime subscription | Realtime adds complexity (channel management, reconnection). Polling every 30-60s via `refetchInterval` is simpler and sufficient -- balance changes only on purchase and impression serving. |
| Stripe Billing Credits API | Custom credit system | Stripe Billing Credits is designed for subscription-based usage billing, not one-time credit pack purchases. Custom ledger with Stripe Checkout is the standard pattern for prepaid credit systems. |

**Installation:**
```bash
# Frontend: No new packages needed
# Edge Functions: Stripe imported via esm.sh in Deno (no npm install)

# Stripe CLI (for local webhook testing during development):
# Download from https://stripe.com/docs/stripe-cli
# Or: scoop install stripe (Windows)
```

## Architecture Patterns

### Recommended Project Structure
```
supabase/functions/
  _shared/
    cors.ts                      # Existing CORS headers
    supabase-admin.ts            # Existing admin client factory
    stripe.ts                    # NEW: Stripe client factory + shared config
  create-checkout/
    index.ts                     # POST: Creates Stripe Checkout Session, returns URL
  stripe-webhook/
    index.ts                     # POST: Receives Stripe webhook, verifies signature, fulfills

supabase/migrations/
  20260225000001_billing_tables.sql  # credit_transactions table + add_credits function + pg_cron rollup

apps/web/src/
  features/billing/
    api/billing-api.ts           # Supabase queries for balance, transactions
    hooks/use-billing.ts         # TanStack Query hooks for billing data
    hooks/use-credit-balance.ts  # Dedicated hook for header balance display
    components/
      credit-balance-badge.tsx   # Balance display for app header
      credit-pack-card.tsx       # Credit pack selection card
      transaction-table.tsx      # Transaction history table
      low-balance-warning.tsx    # Warning banner/toast component
    pages/billing-page.tsx       # Main billing page
  components/layout/
    app-header.tsx               # MODIFIED: Add credit balance badge
```

### Pattern 1: Stripe Checkout Flow (create-checkout Edge Function)
**What:** An authenticated Edge Function that creates a Stripe Checkout Session for one-time credit pack purchases and returns the session URL to the frontend for redirect.
**When to use:** When user clicks "Buy Credits" on the billing page.
**Why authenticated:** Unlike serve-ad/track-event (public endpoints), checkout must verify the caller's identity to link the purchase to their advertiser account.
**Example:**
```typescript
// supabase/functions/create-checkout/index.ts
import Stripe from 'https://esm.sh/stripe@14?target=denonext'
import { createAdminClient } from '../_shared/supabase-admin.ts'
import { corsHeaders } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY')!, {
  apiVersion: '2024-11-20',
})

// Credit pack definitions (price IDs from Stripe Dashboard)
const CREDIT_PACKS: Record<string, { credits: number; priceId: string }> = {
  '50k':  { credits: 50000,   priceId: Deno.env.get('STRIPE_PRICE_50K')! },
  '200k': { credits: 200000,  priceId: Deno.env.get('STRIPE_PRICE_200K')! },
  '1m':   { credits: 1000000, priceId: Deno.env.get('STRIPE_PRICE_1M')! },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 1. Verify caller identity
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Unauthorized')
    const jwt = authHeader.replace('Bearer ', '')
    const admin = createAdminClient()
    const { data: { user }, error: authError } = await admin.auth.getUser(jwt)
    if (authError || !user) throw new Error('Unauthorized')

    // 2. Get advertiser_id from user_profiles
    const { data: profile } = await admin
      .from('user_profiles')
      .select('advertiser_id')
      .eq('auth_user_id', user.id)
      .single()
    if (!profile?.advertiser_id) throw new Error('No advertiser linked')

    // 3. Parse pack selection
    const { packId } = await req.json()
    const pack = CREDIT_PACKS[packId]
    if (!pack) throw new Error('Invalid pack')

    // 4. Get advertiser email for Stripe
    const { data: advertiser } = await admin
      .from('advertisers')
      .select('contact_email')
      .eq('id', profile.advertiser_id)
      .single()

    // 5. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: pack.priceId, quantity: 1 }],
      success_url: `${req.headers.get('origin')}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/billing?canceled=true`,
      client_reference_id: profile.advertiser_id,
      customer_email: advertiser?.contact_email || user.email,
      metadata: {
        advertiser_id: profile.advertiser_id,
        credits: String(pack.credits),
        pack_id: packId,
      },
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    const status = message === 'Unauthorized' ? 401 : 400
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### Pattern 2: Stripe Webhook Handler (stripe-webhook Edge Function)
**What:** A public Edge Function (deployed with `--no-verify-jwt`) that receives Stripe webhook events, verifies the signature using `crypto.subtle`, and fulfills credit pack purchases by atomically adding credits and recording the transaction.
**When to use:** Automatically called by Stripe after successful payment.
**Critical:** Must verify webhook signature. Must be idempotent (same event processed safely multiple times).
**Example:**
```typescript
// supabase/functions/stripe-webhook/index.ts
import Stripe from 'https://esm.sh/stripe@14?target=denonext'
import { createAdminClient } from '../_shared/supabase-admin.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY')!, {
  apiVersion: '2024-11-20',
})
const cryptoProvider = Stripe.createSubtleCryptoProvider()

Deno.serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text() // Must use .text() not .json() for signature verification

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')!,
      undefined,
      cryptoProvider,
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // Only fulfill if payment is complete (not deferred/async payment methods)
    if (session.payment_status === 'paid') {
      await fulfillCreditPurchase(session)
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
})

async function fulfillCreditPurchase(session: Stripe.Checkout.Session) {
  const admin = createAdminClient()
  const advertiserId = session.metadata?.advertiser_id
  const credits = Number(session.metadata?.credits)

  if (!advertiserId || !credits) {
    console.error('Missing metadata in checkout session:', session.id)
    return
  }

  // Idempotency: Check if this session was already fulfilled
  const { data: existing } = await admin
    .from('credit_transactions')
    .select('id')
    .eq('stripe_session_id', session.id)
    .maybeSingle()

  if (existing) {
    console.log('Session already fulfilled:', session.id)
    return
  }

  // Atomically add credits
  const { error: creditError } = await admin.rpc('add_impression_credits', {
    p_advertiser_id: advertiserId,
    p_amount: credits,
  })

  if (creditError) {
    console.error('Failed to add credits:', creditError.message)
    return
  }

  // Record transaction
  await admin.from('credit_transactions').insert({
    advertiser_id: advertiserId,
    type: 'purchase',
    amount: credits,
    stripe_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent as string,
    receipt_url: null, // Updated later via charge.succeeded or retrieved on demand
    metadata: {
      pack_id: session.metadata?.pack_id,
      customer_email: session.customer_email,
    },
  })

  console.log(`Fulfilled ${credits} credits for advertiser ${advertiserId}`)
}
```

### Pattern 3: Atomic Credit Addition (PostgreSQL Function)
**What:** A PL/pgSQL function that atomically adds credits to an advertiser's balance. Mirrors the existing `deduct_impression_credit` function pattern.
**When to use:** Called by the webhook handler after successful payment verification.
**Example:**
```sql
CREATE OR REPLACE FUNCTION public.add_impression_credits(
  p_advertiser_id UUID,
  p_amount BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.advertisers
  SET credit_balance = credit_balance + p_amount,
      updated_at = now()
  WHERE id = p_advertiser_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Advertiser not found: %', p_advertiser_id;
  END IF;
END;
$$;
```

### Pattern 4: Credit Balance in App Header
**What:** A TanStack Query hook that fetches the advertiser's credit balance and displays it in the app header. Uses `refetchInterval` for periodic updates.
**When to use:** Always visible to authenticated advertisers.
**Example:**
```typescript
// features/billing/hooks/use-credit-balance.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

export function useCreditBalance() {
  const { profile } = useAuth()
  return useQuery({
    queryKey: ['credit-balance', profile?.advertiser_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advertisers')
        .select('credit_balance')
        .eq('id', profile!.advertiser_id!)
        .single()
      if (error) throw error
      return data.credit_balance
    },
    enabled: !!profile?.advertiser_id,
    refetchInterval: 30_000, // Poll every 30 seconds
    staleTime: 10_000,       // Consider stale after 10 seconds
  })
}
```

### Pattern 5: Daily Metrics Rollup (pg_cron)
**What:** A PL/pgSQL function scheduled via pg_cron that aggregates yesterday's `ad_events` into the existing `daily_metrics` table. Uses `INSERT ... ON CONFLICT ... DO UPDATE` for idempotent re-runs.
**When to use:** Runs automatically at 2:00 AM UTC daily.
**Example:**
```sql
CREATE OR REPLACE FUNCTION public.rollup_daily_metrics(p_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.daily_metrics (
    metric_date, advertiser_id, campaign_id, creative_id,
    impressions_served, impressions_viewable, clicks, engagements,
    video_plays, video_completes, total_dwell_time_ms
  )
  SELECT
    p_date::DATE,
    advertiser_id,
    campaign_id,
    creative_id,
    COUNT(*) FILTER (WHERE event_type = 'impression_served'),
    COUNT(*) FILTER (WHERE event_type = 'impression_viewable'),
    COUNT(*) FILTER (WHERE event_type = 'click'),
    COUNT(*) FILTER (WHERE event_type = 'engagement'),
    COUNT(*) FILTER (WHERE event_type = 'video_play'),
    COUNT(*) FILTER (WHERE event_type = 'video_complete'),
    0 -- dwell_time_ms requires separate calculation from engagement event pairs
  FROM public.ad_events
  WHERE event_timestamp >= p_date
    AND event_timestamp < p_date + INTERVAL '1 day'
  GROUP BY advertiser_id, campaign_id, creative_id
  ON CONFLICT (metric_date, advertiser_id, campaign_id, creative_id)
  DO UPDATE SET
    impressions_served = EXCLUDED.impressions_served,
    impressions_viewable = EXCLUDED.impressions_viewable,
    clicks = EXCLUDED.clicks,
    engagements = EXCLUDED.engagements,
    video_plays = EXCLUDED.video_plays,
    video_completes = EXCLUDED.video_completes,
    total_dwell_time_ms = EXCLUDED.total_dwell_time_ms,
    updated_at = now();
END;
$$;

-- Schedule with pg_cron (run daily at 2:00 AM UTC)
SELECT cron.schedule(
  'rollup-daily-metrics',
  '0 2 * * *',
  $$SELECT public.rollup_daily_metrics()$$
);
```

### Pattern 6: Low-Balance Warning
**What:** Client-side check that compares current credit balance against 10% of the last purchased pack size. Shows a warning toast when threshold is crossed.
**When to use:** On every credit balance fetch (via the polling hook).
**Example:**
```typescript
// In a useEffect or within the credit balance hook callback
const lastPurchase = transactions?.[0] // Most recent purchase transaction
if (lastPurchase && balance !== null) {
  const threshold = Math.floor(lastPurchase.amount * 0.1)
  if (balance > 0 && balance <= threshold) {
    toast.warning(
      `Low credit balance! ${balance.toLocaleString()} impressions remaining.`,
      { id: 'low-balance', duration: Infinity }
    )
  }
}
```

### Anti-Patterns to Avoid
- **Do NOT embed Stripe secret key in frontend code:** The `STRIPE_API_KEY` (secret key) must only exist in Edge Function environment variables. The frontend never touches Stripe directly -- it calls the `create-checkout` Edge Function which handles Stripe server-side.
- **Do NOT skip webhook signature verification:** Always verify via `stripe.webhooks.constructEventAsync()` with the signing secret. Without verification, anyone could POST fake events to credit accounts.
- **Do NOT rely on the success redirect for fulfillment:** The success_url redirect is for UX only. Customers may close the browser before redirect. The webhook is the authoritative fulfillment trigger.
- **Do NOT use `@stripe/stripe-js` on the frontend:** With Stripe Checkout's hosted page, the frontend only needs to redirect to the `session.url` returned by the Edge Function. No client-side Stripe SDK needed.
- **Do NOT store credit balance only in Stripe:** Stripe Billing Credits is for subscription usage billing. Our credit system uses PostgreSQL for real-time atomic deduction during ad serving. Stripe handles payment only; credit accounting is our responsibility.
- **Do NOT skip idempotency in the webhook handler:** Stripe may send the same event multiple times. Check `stripe_session_id` uniqueness before fulfilling.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Payment processing | Custom credit card form, PCI compliance | Stripe Checkout hosted page | PCI-DSS compliance is handled by Stripe. Hosted page handles 3D Secure, international payments, multiple payment methods. |
| Webhook signature verification | Custom HMAC verification | `stripe.webhooks.constructEventAsync()` with `Stripe.createSubtleCryptoProvider()` | Stripe's SDK handles all crypto correctly for Deno's Web Crypto API. Rolling your own risks timing attacks or algorithm mistakes. |
| Receipt generation | Custom PDF receipt generator | Stripe's `receipt_url` from the Charge object | Stripe generates hosted receipts automatically. Store the URL in `credit_transactions` for easy access. |
| Cron scheduling | Custom setTimeout/setInterval in Edge Functions | pg_cron extension in PostgreSQL | pg_cron runs inside the database with zero network latency, guaranteed execution, and built-in job monitoring via `cron.job_run_details`. |
| Number formatting (credits display) | Custom formatting functions | `Intl.NumberFormat` or `.toLocaleString()` | Built-in browser API handles thousands separators, locale-specific formatting. |
| Idempotent webhook processing | Complex locking mechanism | Unique constraint on `stripe_session_id` + check-before-insert pattern | Simple and effective. The unique constraint prevents duplicate transactions even under concurrent webhook delivery. |

**Key insight:** The billing system is primarily an integration problem -- Stripe handles payment processing and receipt generation, PostgreSQL handles credit accounting, and the frontend provides visibility. The custom code is thin glue between these proven systems.

## Common Pitfalls

### Pitfall 1: Webhook Signature Verification Failure
**What goes wrong:** The webhook handler fails to verify Stripe's signature, either rejecting all events or accepting forged ones.
**Why it happens:** Using `req.json()` instead of `req.text()` for the body (JSON parsing changes the raw bytes), or using the wrong signing secret (test vs. live, or endpoint-specific secrets).
**How to avoid:** Always use `await req.text()` to get the raw body. Use `Stripe.createSubtleCryptoProvider()` for Deno's Web Crypto API. Store the webhook signing secret (starting with `whsec_`) as a Supabase secret, not the API key.
**Warning signs:** All webhook events returning 400 status; events appearing in Stripe's webhook logs as "failed".

### Pitfall 2: Double Credit Fulfillment
**What goes wrong:** Same payment credits an advertiser's account twice.
**Why it happens:** Stripe sends the same `checkout.session.completed` event multiple times (retries on timeout, network issues), or both the webhook and the success page redirect trigger fulfillment.
**How to avoid:** Store `stripe_session_id` with a UNIQUE constraint on `credit_transactions`. Check for existing record before fulfilling. Never fulfill from the success page redirect -- use it only for UI feedback.
**Warning signs:** Transaction history showing duplicate entries; credit balance higher than expected after a purchase.

### Pitfall 3: Stripe Import Issues in Deno Edge Functions
**What goes wrong:** Edge Function fails to deploy or crashes at runtime with import errors.
**Why it happens:** Using the wrong esm.sh target parameter, or using an incompatible Stripe version.
**How to avoid:** Use `import Stripe from 'https://esm.sh/stripe@14?target=denonext'`. The `?target=denonext` parameter is critical for Deno runtime compatibility. The official Supabase example uses Stripe v14 with this target. Do NOT use `?target=deno` (older, less compatible).
**Warning signs:** Deploy errors mentioning "module not found" or "cannot resolve"; runtime errors about missing Node.js built-ins.

### Pitfall 4: Missing pg_cron Extension
**What goes wrong:** The `cron.schedule()` call fails because pg_cron is not enabled.
**Why it happens:** pg_cron must be explicitly enabled on the Supabase project. It is available on all Supabase plans but not enabled by default.
**How to avoid:** Enable pg_cron via Supabase Dashboard (Database > Extensions) or via SQL: `CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;`. Then grant usage: `GRANT USAGE ON SCHEMA cron TO postgres;`.
**Warning signs:** SQL error "schema cron does not exist" or "function cron.schedule does not exist".

### Pitfall 5: Success Page Credits Not Showing
**What goes wrong:** User completes payment and is redirected to `/billing?success=true` but their credit balance hasn't updated.
**Why it happens:** Stripe webhook delivery may have a few-second delay after checkout completion. The frontend queries the database before the webhook has processed.
**How to avoid:** On the success page, show a "Processing your purchase..." state and poll with a shorter interval (e.g., 2-3 seconds) for up to 30 seconds until the balance changes. Also invalidate the credit balance query key on the success page mount.
**Warning signs:** Users seeing their old balance after completing payment; credits appearing only after manual refresh seconds later.

### Pitfall 6: NULL campaign_id in daily_metrics UNIQUE Constraint
**What goes wrong:** The `ON CONFLICT` clause fails for rows where `campaign_id` IS NULL because NULL != NULL in PostgreSQL.
**Why it happens:** Some ad_events have NULL campaign_id (creatives not assigned to campaigns). The existing UNIQUE constraint on `(metric_date, advertiser_id, campaign_id, creative_id)` does not match NULL values with `ON CONFLICT`.
**How to avoid:** Use `COALESCE(campaign_id, '00000000-0000-0000-0000-000000000000')` in both the GROUP BY and the unique constraint. Or create the UNIQUE constraint as a unique index with `NULLS NOT DISTINCT` (PostgreSQL 15+ feature). Since the project uses PostgreSQL 17, `NULLS NOT DISTINCT` is the cleanest approach -- drop and recreate the constraint as: `CREATE UNIQUE INDEX ... ON daily_metrics (metric_date, advertiser_id, campaign_id, creative_id) NULLS NOT DISTINCT;`.
**Warning signs:** `ON CONFLICT DO UPDATE` silently inserting duplicate rows for NULL campaign_id combinations; rollup function raising unique violation errors.

### Pitfall 7: Stripe API Key Confusion (Test vs. Live)
**What goes wrong:** Payments work in test mode but fail in production, or vice versa.
**Why it happens:** Stripe has separate test (`sk_test_...`) and live (`sk_live_...`) API keys. Test keys only work with test Checkout Sessions and test webhooks.
**How to avoid:** Use test keys during development. Store live keys as Supabase secrets for production. Use separate webhook endpoints or signing secrets for test vs. live. Set Stripe Price IDs as environment variables (not hardcoded) since test and live prices have different IDs.
**Warning signs:** "No such price" errors; webhook signature failures after switching environments.

## Code Examples

Verified patterns from official sources and codebase analysis:

### Database Migration: credit_transactions + add_credits + pg_cron rollup
```sql
-- Source: PostgreSQL patterns + Supabase pg_cron docs
-- Migration: 20260225000001_billing_tables.sql

-- 1. Credit transactions ledger table
CREATE TABLE public.credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  advertiser_id UUID NOT NULL REFERENCES public.advertisers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'adjustment', 'refund')),
  amount BIGINT NOT NULL, -- positive for additions, negative for deductions
  balance_after BIGINT, -- snapshot of balance after this transaction
  stripe_session_id TEXT UNIQUE, -- Stripe Checkout Session ID (for idempotency)
  stripe_payment_intent_id TEXT, -- Stripe PaymentIntent ID
  receipt_url TEXT, -- Stripe-hosted receipt URL
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.credit_transactions IS
  'Append-only ledger of all credit balance changes. stripe_session_id UNIQUE prevents double fulfillment.';

-- Indexes
CREATE INDEX idx_credit_transactions_advertiser
  ON public.credit_transactions (advertiser_id, created_at DESC);

-- RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full access to transactions"
ON public.credit_transactions FOR ALL
TO authenticated
USING ((SELECT public.is_super_admin()))
WITH CHECK ((SELECT public.is_super_admin()));

CREATE POLICY "Users can read own transactions"
ON public.credit_transactions FOR SELECT
TO authenticated
USING (advertiser_id = (SELECT public.get_user_advertiser_id()));

-- Updated_at trigger not needed -- transactions are append-only (immutable)

-- 2. Atomic credit addition function
CREATE OR REPLACE FUNCTION public.add_impression_credits(
  p_advertiser_id UUID,
  p_amount BIGINT
)
RETURNS BIGINT -- Returns new balance
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance BIGINT;
BEGIN
  UPDATE public.advertisers
  SET credit_balance = credit_balance + p_amount,
      updated_at = now()
  WHERE id = p_advertiser_id
  RETURNING credit_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Advertiser not found: %', p_advertiser_id;
  END IF;

  RETURN v_new_balance;
END;
$$;

COMMENT ON FUNCTION public.add_impression_credits IS
  'Atomically adds impression credits to an advertiser balance. Returns the new balance. Called by stripe-webhook Edge Function after payment verification.';

-- 3. Fix daily_metrics unique constraint for NULL handling
-- Drop old constraint and recreate with NULLS NOT DISTINCT (PostgreSQL 15+)
ALTER TABLE public.daily_metrics DROP CONSTRAINT IF EXISTS daily_metrics_metric_date_advertiser_id_campaign_id_creative_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_metrics_unique
  ON public.daily_metrics (metric_date, advertiser_id, campaign_id, creative_id) NULLS NOT DISTINCT;

-- 4. Daily metrics rollup function
CREATE OR REPLACE FUNCTION public.rollup_daily_metrics(
  p_date DATE DEFAULT (CURRENT_DATE - INTERVAL '1 day')::DATE
)
RETURNS INTEGER -- Returns number of rows upserted
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH upserted AS (
    INSERT INTO public.daily_metrics (
      metric_date, advertiser_id, campaign_id, creative_id,
      impressions_served, impressions_viewable, clicks, engagements,
      video_plays, video_completes, total_dwell_time_ms
    )
    SELECT
      p_date,
      advertiser_id,
      campaign_id,
      creative_id,
      COUNT(*) FILTER (WHERE event_type = 'impression_served'),
      COUNT(*) FILTER (WHERE event_type = 'impression_viewable'),
      COUNT(*) FILTER (WHERE event_type = 'click'),
      COUNT(*) FILTER (WHERE event_type = 'engagement'),
      COUNT(*) FILTER (WHERE event_type = 'video_play'),
      COUNT(*) FILTER (WHERE event_type = 'video_complete'),
      0 -- dwell_time_ms calculated separately if needed
    FROM public.ad_events
    WHERE event_timestamp >= p_date::TIMESTAMPTZ
      AND event_timestamp < (p_date + INTERVAL '1 day')::TIMESTAMPTZ
    GROUP BY advertiser_id, campaign_id, creative_id
    ON CONFLICT (metric_date, advertiser_id, campaign_id, creative_id)
    DO UPDATE SET
      impressions_served = EXCLUDED.impressions_served,
      impressions_viewable = EXCLUDED.impressions_viewable,
      clicks = EXCLUDED.clicks,
      engagements = EXCLUDED.engagements,
      video_plays = EXCLUDED.video_plays,
      video_completes = EXCLUDED.video_completes,
      total_dwell_time_ms = EXCLUDED.total_dwell_time_ms,
      updated_at = now()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM upserted;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.rollup_daily_metrics IS
  'Aggregates ad_events for a given date into daily_metrics. Idempotent via ON CONFLICT. Scheduled by pg_cron at 2 AM UTC daily.';

-- 5. Enable pg_cron and schedule the rollup job
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
GRANT USAGE ON SCHEMA cron TO postgres;

SELECT cron.schedule(
  'rollup-daily-metrics',
  '0 2 * * *',
  $$SELECT public.rollup_daily_metrics()$$
);
```

### Shared Stripe Client (Edge Functions)
```typescript
// supabase/functions/_shared/stripe.ts
import Stripe from 'https://esm.sh/stripe@14?target=denonext'

export function createStripeClient() {
  return new Stripe(Deno.env.get('STRIPE_API_KEY')!, {
    apiVersion: '2024-11-20',
  })
}

export const cryptoProvider = Stripe.createSubtleCryptoProvider()

// Credit pack definitions -- Price IDs come from Stripe Dashboard
// Store as env vars so test/live environments use different IDs
export const CREDIT_PACKS = {
  '50k':  { credits: 50000,   label: '50,000 Impressions', priceId: Deno.env.get('STRIPE_PRICE_50K')! },
  '200k': { credits: 200000,  label: '200,000 Impressions', priceId: Deno.env.get('STRIPE_PRICE_200K')! },
  '1m':   { credits: 1000000, label: '1,000,000 Impressions', priceId: Deno.env.get('STRIPE_PRICE_1M')! },
} as const

export type PackId = keyof typeof CREDIT_PACKS
```

### Frontend: Billing API Layer
```typescript
// features/billing/api/billing-api.ts
import { supabase } from '@/lib/supabase'

export async function fetchCreditBalance(advertiserId: string) {
  const { data, error } = await supabase
    .from('advertisers')
    .select('credit_balance')
    .eq('id', advertiserId)
    .single()
  if (error) throw error
  return data.credit_balance as number
}

export async function fetchTransactions(advertiserId: string) {
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('advertiser_id', advertiserId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createCheckoutSession(packId: string) {
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { packId },
  })
  if (error) throw error
  return data as { url: string }
}
```

### Frontend: Checkout Button Handler
```typescript
// In billing page component
async function handlePurchase(packId: string) {
  try {
    const { url } = await createCheckoutSession(packId)
    // Redirect to Stripe's hosted Checkout page
    window.location.href = url
  } catch (err) {
    toast.error('Failed to start checkout. Please try again.')
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom payment forms (PCI burden) | Stripe Checkout hosted page | 2019+ (Checkout 2.0) | Zero PCI compliance burden on application; Stripe handles all card data |
| Direct API charges | Checkout Sessions API | 2019+ | Built-in 3D Secure, SCA compliance, multiple payment methods |
| Manual receipt PDFs | Stripe-hosted receipts via `receipt_url` | Always available | No receipt generation code needed; Stripe provides branded hosted receipts |
| Custom cron daemons | pg_cron in PostgreSQL | Available in Supabase since 2023 | Zero infrastructure; runs inside the database with built-in monitoring |
| Stripe npm SDK in Deno (broken) | `esm.sh/stripe@14?target=denonext` | 2024+ | Clean Deno compatibility via esm.sh CDN; no Node.js polyfills needed |
| Separate webhook verification | `Stripe.createSubtleCryptoProvider()` | Stripe SDK 14+ | Native Web Crypto API support for Deno; no Node.js crypto dependency |

**Deprecated/outdated:**
- `esm.sh/stripe@11?target=deno` -- older target; use `?target=denonext` with Stripe 14+
- Stripe Charges API (direct) -- use Checkout Sessions or PaymentIntents instead
- Custom HMAC webhook verification -- use `stripe.webhooks.constructEventAsync()` with `cryptoProvider`
- Manual pg_cron setup via SQL -- Supabase now provides UI-based cron management via Dashboard

## Open Questions

1. **Stripe Price IDs for credit packs**
   - What we know: Three products need to be created in Stripe Dashboard (50k, 200k, 1M impression packs) with corresponding Prices.
   - What's unclear: Exact pricing for each pack (not specified in requirements).
   - Recommendation: Create products in Stripe Dashboard before implementation. Store Price IDs as Supabase secrets (`STRIPE_PRICE_50K`, `STRIPE_PRICE_200K`, `STRIPE_PRICE_1M`). Use placeholder prices for development (e.g., $50, $150, $500) that can be updated later.

2. **Receipt URL availability timing**
   - What we know: Stripe's `receipt_url` is on the Charge object, not directly on the Checkout Session. It is available after the charge is captured.
   - What's unclear: Whether `receipt_url` is available in the `checkout.session.completed` event or requires a separate Charge retrieval.
   - Recommendation: In the webhook handler, retrieve the PaymentIntent and its latest Charge to get `receipt_url`. Alternatively, store the `payment_intent_id` and lazily fetch `receipt_url` when the user views the transaction in the UI. The second approach is simpler and avoids blocking the webhook.

3. **pg_cron availability on Supabase hosted**
   - What we know: pg_cron is listed as a supported extension on all Supabase plans. It must be enabled per-project.
   - What's unclear: Whether `CREATE EXTENSION pg_cron` can be run via `db push --db-url` migration or must be enabled via Dashboard.
   - Recommendation: Enable pg_cron via the Supabase Dashboard first (Database > Extensions), then include the `cron.schedule()` call in the migration. If Dashboard-first is not possible, use a separate manual step documented in the plan.

4. **Credit balance real-time accuracy during high-volume serving**
   - What we know: The balance displayed in the header is fetched via polling (30s interval). During active ad serving, credits are being deducted every impression.
   - What's unclear: Whether a 30-second delay in balance display is acceptable UX.
   - Recommendation: 30-second polling is sufficient for v1. The exact balance is less important than the trend. Low-balance warnings provide the actionable alert. For v2, Supabase Realtime subscriptions on the `advertisers` table could provide sub-second updates.

## Sources

### Primary (HIGH confidence)
- [Supabase: Handling Stripe Webhooks](https://supabase.com/docs/guides/functions/examples/stripe-webhooks) -- Official webhook handler example with `constructEventAsync()` and `createSubtleCryptoProvider()`
- [Supabase GitHub: stripe-webhooks/index.ts](https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/stripe-webhooks/index.ts) -- Complete verified source code: `import Stripe from 'https://esm.sh/stripe@14?target=denonext'`, apiVersion `2024-11-20`
- [Stripe Docs: Checkout quickstart](https://docs.stripe.com/checkout/quickstart) -- Session creation with `mode: 'payment'`, `line_items`, `success_url`, `metadata`
- [Stripe Docs: Create Checkout Session API](https://docs.stripe.com/api/checkout/sessions/create) -- Full API reference: `client_reference_id`, `metadata`, `customer_email`, mode values
- [Stripe Docs: Fulfill orders](https://docs.stripe.com/checkout/fulfillment) -- `checkout.session.completed` event handling, `payment_status` check, idempotency best practices
- [Stripe Docs: Receipts](https://docs.stripe.com/receipts) -- `receipt_url` on Charge object, hosted receipt pages, email receipt configuration
- [Supabase: Cron](https://supabase.com/docs/guides/cron) -- pg_cron scheduling, `cron.schedule()` syntax, job monitoring
- [Supabase: esm.sh Stripe import troubleshooting](https://supabase.com/docs/guides/troubleshooting/importing-stripe-or-other-modules-from-esmsh-on-deno-edge-functions-throws-an-error-TmbB5p) -- `?target=denonext` requirement
- Codebase: `supabase/functions/_shared/supabase-admin.ts` -- `createAdminClient()` pattern (service_role)
- Codebase: `supabase/functions/serve-ad/index.ts` -- Existing Edge Function pattern, auth.getUser(jwt) verification
- Codebase: `supabase/migrations/20260224000001_credit_balance_serving.sql` -- `credit_balance BIGINT`, `deduct_impression_credit` function
- Codebase: `supabase/migrations/20260219000000_initial_schema.sql` -- `daily_metrics` table schema, `get_user_advertiser_id()` helper, RLS policy pattern
- Codebase: `apps/web/src/features/creatives/hooks/use-creatives.ts` -- TanStack Query hook pattern (useQuery, useMutation, queryClient.invalidateQueries)
- Codebase: `apps/web/src/components/layout/app-header.tsx` -- Current header layout, ready for credit balance badge
- Codebase: `apps/web/src/contexts/auth-context.tsx` -- Auth context with `profile.advertiser_id`
- Codebase: `packages/shared/src/database.types.ts` -- Database types including `advertisers.credit_balance`

### Secondary (MEDIUM confidence)
- [Stripe npm package](https://www.npmjs.com/package/stripe) -- v20.3.1 is latest on npm; Supabase example uses v14 via esm.sh which is stable and verified
- [Stripe: Using metadata with Checkout sessions](https://support.stripe.com/questions/using-metadata-with-checkout-sessions) -- Metadata passed through to webhook events
- [Moesif: Pre-paid Credit-Based Billing With Stripe](https://www.moesif.com/blog/technical/api-development/Pre-paid-Credit-Based-Billing-With-Stripe/) -- Architecture pattern for custom prepaid credit systems with Stripe
- [Citus Data: Materialized Views vs Rollup Tables](https://www.citusdata.com/blog/2018/10/31/materialized-views-vs-rollup-tables/) -- Rollup tables preferred over materialized views for incremental updates
- [Gameball: Scaling Analytics with PostgreSQL Rollup Tables](https://engineering.gameball.co/posts/scaling-analytics-with-postgresql-rollup-tables) -- INSERT ON CONFLICT pattern for idempotent rollups

### Tertiary (LOW confidence)
- Stripe v14 vs v20 on esm.sh for Deno -- Official Supabase example pins v14; v20 may work with `?target=denonext` but is unverified in Supabase Edge Functions context. Recommend staying with v14 to match official example.
- pg_cron in migration files -- unclear if `CREATE EXTENSION pg_cron` works via `db push --db-url`; may require Dashboard enablement first. Needs validation during implementation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Stripe + Supabase Edge Functions is the officially documented and example-backed pattern. No new frontend dependencies needed.
- Architecture (Checkout flow): HIGH -- `create-checkout` + `stripe-webhook` two-function pattern matches official Supabase examples exactly. Webhook signature verification via `createSubtleCryptoProvider()` is documented.
- Architecture (credit ledger): HIGH -- Append-only ledger with idempotent webhook processing is standard billing pattern. `add_impression_credits` mirrors existing `deduct_impression_credit`.
- Architecture (daily rollup): HIGH -- pg_cron + `INSERT ON CONFLICT DO UPDATE` is well-documented PostgreSQL pattern. `daily_metrics` table already exists with correct schema.
- Pitfalls: HIGH -- Based on Stripe's official fulfillment guide (idempotency, webhook-first), Supabase esm.sh troubleshooting docs, and codebase analysis of existing patterns.
- Low-balance warning: MEDIUM -- The "10% of last purchased pack" threshold is straightforward to implement but the UX (toast vs. banner vs. both) may need refinement based on user feedback.

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (Stripe API versions are stable; Supabase Edge Functions and pg_cron are mature features)
