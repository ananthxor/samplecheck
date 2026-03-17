-- =============================================================================
-- Fix: deduct_impression_credit returns new balance instead of boolean
-- =============================================================================
-- Previously returned TRUE/FALSE. Edge functions couldn't tell whether the
-- last credit was just used (balance hit 0) vs. credits were already exhausted.
-- This caused one extra ad render after credits ran out, because the CDN bundle
-- was only cleaned up on the NEXT failed deduction attempt.
--
-- New behaviour:
--   Returns new_balance (>= 0) on successful deduction
--   Returns -1 when no credits available (balance was already 0)
--
-- Edge functions now check: if result <= 0, trigger CDN cleanup immediately.
-- =============================================================================

-- Must drop first because we're changing the return type (BOOLEAN → BIGINT)
DROP FUNCTION IF EXISTS public.deduct_impression_credit(UUID);

CREATE FUNCTION public.deduct_impression_credit(p_advertiser_id UUID)
RETURNS BIGINT
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
    RETURN -1;
  END IF;

  -- When balance hits zero, pause all active creatives and clear bundle URLs
  IF v_new_balance = 0 THEN
    UPDATE public.creatives
    SET status = 'paused',
        bundle_url = NULL,
        updated_at = now()
    WHERE advertiser_id = p_advertiser_id
      AND status = 'active';
  END IF;

  RETURN v_new_balance;
END;
$$;

COMMENT ON FUNCTION public.deduct_impression_credit IS
  'Atomically deducts one impression credit. Returns new balance on success, -1 if already exhausted. When balance reaches zero, all active creatives are paused.';
