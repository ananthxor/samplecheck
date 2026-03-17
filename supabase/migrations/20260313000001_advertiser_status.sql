-- =============================================================================
-- Advertiser Status
-- =============================================================================
-- Adds an active/inactive status to the advertisers table so super admins
-- can enable or disable an advertiser account from the Team admin page.
-- =============================================================================

-- 1. Enum -----------------------------------------------------------------------

CREATE TYPE public.advertiser_status AS ENUM ('active', 'inactive');

-- 2. Column ---------------------------------------------------------------------

ALTER TABLE public.advertisers
  ADD COLUMN status public.advertiser_status NOT NULL DEFAULT 'active';

COMMENT ON COLUMN public.advertisers.status IS
  'Account status. Inactive advertisers cannot log in or serve ads.';

-- 3. Index ----------------------------------------------------------------------
-- Useful for ad-serving queries that filter on active advertisers.

CREATE INDEX idx_advertisers_status ON public.advertisers (status);

-- 4. RPC function ---------------------------------------------------------------
-- Only super admins may call this function (enforced inside via is_super_admin()).

CREATE OR REPLACE FUNCTION public.admin_set_advertiser_status(
  p_advertiser_id UUID,
  p_status        public.advertiser_status
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Permission denied: super_admin role required';
  END IF;

  UPDATE public.advertisers
  SET    status     = p_status,
         updated_at = now()
  WHERE  id = p_advertiser_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Advertiser % not found', p_advertiser_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.admin_set_advertiser_status IS
  'Sets active/inactive status for an advertiser. Restricted to super_admin.';

-- Grant execute to authenticated users (guard is inside the function)
GRANT EXECUTE ON FUNCTION public.admin_set_advertiser_status TO authenticated;
