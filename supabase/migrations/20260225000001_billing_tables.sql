-- =============================================================================
-- Phase 9: Billing & Credit System - Billing Tables Migration
-- =============================================================================
-- Creates credit_transactions ledger table, add_impression_credits function,
-- fixes daily_metrics UNIQUE constraint for NULL handling, creates
-- rollup_daily_metrics function, and schedules pg_cron job.
-- =============================================================================

-- PREREQUISITE: pg_cron must be enabled in Supabase Dashboard BEFORE running
-- this migration. Go to: Supabase Dashboard -> Database -> Extensions ->
-- search "pg_cron" -> Enable. If pg_cron is not enabled, the final section
-- (pg_cron setup) will fail, but all other parts of the migration will succeed.

-- =============================================================================
-- 1. CREDIT TRANSACTIONS TABLE (append-only ledger)
-- =============================================================================

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

-- Index for efficient per-advertiser transaction history queries
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

-- No updated_at trigger -- transactions are append-only/immutable

-- =============================================================================
-- 2. ADD IMPRESSION CREDITS FUNCTION
-- =============================================================================

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

-- =============================================================================
-- 3. FIX DAILY_METRICS UNIQUE CONSTRAINT FOR NULL CAMPAIGN_ID
-- =============================================================================
-- The original UNIQUE constraint on (metric_date, advertiser_id, campaign_id, creative_id)
-- does not match NULL values (NULL != NULL in SQL). PostgreSQL 15+ supports
-- NULLS NOT DISTINCT on unique indexes, which treats NULLs as equal.
-- This is needed for ON CONFLICT to work correctly in the rollup function.

ALTER TABLE public.daily_metrics DROP CONSTRAINT IF EXISTS daily_metrics_metric_date_advertiser_id_campaign_id_creative_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_metrics_unique
  ON public.daily_metrics (metric_date, advertiser_id, campaign_id, creative_id) NULLS NOT DISTINCT;

-- =============================================================================
-- 4. DAILY METRICS ROLLUP FUNCTION
-- =============================================================================

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
      COALESCE(
        SUM(
          CASE 
            WHEN event_type = 'engagement' 
            AND ae.extra_data->>'dwell_time_ms' ~ '^[0-9]+$'
            THEN (ae.extra_data->>'dwell_time_ms')::BIGINT
            ELSE 0 
          END
        ), 0
      )
    FROM public.ad_events ae
    -- Skip events for deleted creatives (daily_metrics.creative_id has FK → creatives)
    INNER JOIN public.creatives c ON c.id = ae.creative_id
    WHERE ae.event_timestamp >= p_date::TIMESTAMPTZ
      AND ae.event_timestamp < (p_date + INTERVAL '1 day')::TIMESTAMPTZ
    GROUP BY ae.advertiser_id, ae.campaign_id, ae.creative_id
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

-- =============================================================================
-- 5. PG_CRON SETUP
-- =============================================================================
-- NOTE: pg_cron must be enabled in Supabase Dashboard BEFORE this migration runs.
-- Go to: Supabase Dashboard -> Database -> Extensions -> search "pg_cron" -> Enable
-- If the extension is not enabled, this section will fail.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
GRANT USAGE ON SCHEMA cron TO postgres;

SELECT cron.schedule(
  'rollup-daily-metrics',
  '0 2 * * *',
  $$SELECT public.rollup_daily_metrics()$$
);
