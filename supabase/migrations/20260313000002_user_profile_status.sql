-- =============================================================================
-- User Profile Status
-- =============================================================================
-- Adds a per-user active/inactive status to user_profiles so org_admin and
-- super_admin can enable or disable individual team members independently
-- of the org-level advertiser status.
-- =============================================================================

-- 1. Enum -----------------------------------------------------------------------

CREATE TYPE public.user_profile_status AS ENUM ('active', 'inactive');

-- 2. Column ---------------------------------------------------------------------

ALTER TABLE public.user_profiles
  ADD COLUMN status public.user_profile_status NOT NULL DEFAULT 'active';

COMMENT ON COLUMN public.user_profiles.status IS
  'Per-user status. Inactive users are blocked from logging in.';

-- 3. Index ----------------------------------------------------------------------

CREATE INDEX idx_user_profiles_status ON public.user_profiles (status);

-- 4. RPC function ---------------------------------------------------------------
-- org_admin : can toggle any user in their own org (except themselves)
-- super_admin: can toggle any user (except themselves)

CREATE OR REPLACE FUNCTION public.set_user_status(
  p_profile_id UUID,
  p_status     public.user_profile_status
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller user_profiles%ROWTYPE;
  v_target user_profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_caller FROM user_profiles WHERE auth_user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_target FROM user_profiles WHERE id = p_profile_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Prevent self-deactivation
  IF v_target.auth_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot change your own status';
  END IF;

  -- super_admin: full access
  IF v_caller.role = 'super_admin' THEN
    UPDATE public.user_profiles SET status = p_status WHERE id = p_profile_id;
    RETURN;
  END IF;

  -- org_admin: own org only
  IF v_caller.role = 'org_admin' THEN
    IF v_target.advertiser_id IS DISTINCT FROM v_caller.advertiser_id THEN
      RAISE EXCEPTION 'Forbidden';
    END IF;
    UPDATE public.user_profiles SET status = p_status WHERE id = p_profile_id;
    RETURN;
  END IF;

  RAISE EXCEPTION 'Forbidden';
END;
$$;

COMMENT ON FUNCTION public.set_user_status IS
  'Sets active/inactive status for a user profile. org_admin: own org only. super_admin: any user. Neither can change their own status.';

GRANT EXECUTE ON FUNCTION public.set_user_status TO authenticated;
