-- =============================================================================
-- Credit Exhaustion Handling
-- =============================================================================
-- When an advertiser's credit balance reaches zero, all their active creatives
-- are paused and CDN bundles are invalidated. When credits are added back
-- (from 0 to >0), paused creatives are restored to active.
--
-- CDN bundle files in Supabase Storage are cleaned up / restored by the
-- serve-ad and track-event edge functions (they have Storage API access).
-- =============================================================================

-- 1. Upgrade deduct_impression_credit to pause creatives when balance hits 0
CREATE OR REPLACE FUNCTION public.deduct_impression_credit(p_advertiser_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance BIGINT;
BEGIN
  UPDATE public.advertisers
  SET credit_balance = credit_balance - 1,
      updated_at = now()
  WHERE id = p_advertiser_id
    AND credit_balance >= 1
  RETURNING credit_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- When balance hits zero, pause all active creatives and clear bundle URLs
  -- so that serve-ad returns 204 and CDN bundles can be cleaned up.
  IF v_new_balance = 0 THEN
    UPDATE public.creatives
    SET status = 'paused',
        bundle_url = NULL,
        updated_at = now()
    WHERE advertiser_id = p_advertiser_id
      AND status = 'active';
  END IF;

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.deduct_impression_credit IS
  'Atomically deducts one impression credit. Returns FALSE if balance is zero. When balance reaches zero, all active creatives for the advertiser are paused.';

-- 2. Upgrade admin_add_credits to restore paused creatives when balance goes from 0 to >0
CREATE OR REPLACE FUNCTION public.admin_add_credits(
  p_advertiser_id UUID,
  p_amount        BIGINT,
  p_note          TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_balance BIGINT;
  v_new_balance BIGINT;
BEGIN
  -- Read current balance before update
  SELECT credit_balance INTO v_old_balance
  FROM public.advertisers
  WHERE id = p_advertiser_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Advertiser not found: %', p_advertiser_id;
  END IF;

  UPDATE public.advertisers
  SET credit_balance = credit_balance + p_amount,
      updated_at     = now()
  WHERE id = p_advertiser_id
  RETURNING credit_balance INTO v_new_balance;

  INSERT INTO public.credit_transactions (
    advertiser_id,
    type,
    amount,
    balance_after,
    metadata
  ) VALUES (
    p_advertiser_id,
    'adjustment',
    p_amount,
    v_new_balance,
    CASE WHEN p_note IS NOT NULL
         THEN jsonb_build_object('note', p_note, 'source', 'admin')
         ELSE jsonb_build_object('source', 'admin')
    END
  );

  -- When balance goes from 0 (or negative) to positive, restore paused creatives.
  -- Only restores creatives that have rendered_html (i.e., were previously published).
  IF v_old_balance <= 0 AND v_new_balance > 0 THEN
    UPDATE public.creatives
    SET status = 'active',
        updated_at = now()
    WHERE advertiser_id = p_advertiser_id
      AND status = 'paused'
      AND rendered_html IS NOT NULL;
  END IF;

  RETURN v_new_balance;
END;
$$;

COMMENT ON FUNCTION public.admin_add_credits IS
  'Super-admin action: atomically adjusts an advertiser balance and records a transaction. When balance goes from 0 to positive, paused creatives are restored to active.';
