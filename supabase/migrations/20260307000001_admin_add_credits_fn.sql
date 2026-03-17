-- =============================================================================
-- Admin Add Credits Function
-- =============================================================================
-- Atomically adds credits to an advertiser and records the transaction in
-- credit_transactions for a full audit trail. Called by super admin only.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.admin_add_credits(
  p_advertiser_id UUID,
  p_amount        BIGINT,
  p_note          TEXT DEFAULT NULL
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
      updated_at     = now()
  WHERE id = p_advertiser_id
  RETURNING credit_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Advertiser not found: %', p_advertiser_id;
  END IF;

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

  RETURN v_new_balance;
END;
$$;

COMMENT ON FUNCTION public.admin_add_credits IS
  'Super-admin action: atomically credits an advertiser balance and records an adjustment transaction. Returns the new balance.';

-- Grant execute only to service_role (called via admin client in edge function or direct RPC)
GRANT EXECUTE ON FUNCTION public.admin_add_credits TO service_role;
