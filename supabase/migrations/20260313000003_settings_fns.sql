-- =============================================================================
-- Settings Functions
-- =============================================================================
-- update_display_name  : any user updates their own display name
-- update_org_profile   : org_admin/super_admin update org name + contact email
-- =============================================================================

-- 1. Update display name (any authenticated user, own row only) ----------------

CREATE OR REPLACE FUNCTION public.update_display_name(p_display_name TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_profiles
  SET display_name = NULLIF(trim(p_display_name), '')
  WHERE auth_user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_display_name TO authenticated;

-- 2. Update org profile (org_admin: own org; super_admin: any org) -------------

CREATE OR REPLACE FUNCTION public.update_org_profile(
  p_advertiser_id UUID,
  p_name          TEXT,
  p_contact_email TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller user_profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_caller FROM user_profiles WHERE auth_user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  IF v_caller.role = 'org_admin' THEN
    IF v_caller.advertiser_id IS DISTINCT FROM p_advertiser_id THEN
      RAISE EXCEPTION 'Forbidden';
    END IF;
  ELSIF v_caller.role != 'super_admin' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  UPDATE public.advertisers
  SET
    name          = trim(p_name),
    contact_email = NULLIF(trim(p_contact_email), '')
  WHERE id = p_advertiser_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_org_profile TO authenticated;
