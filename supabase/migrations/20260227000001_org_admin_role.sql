-- ---------------------------------------------------------------------------
-- Add org_admin role to user_role enum
--
-- Role hierarchy:
--   super_admin  → platform-level (ScrollToday team), sees all orgs
--   org_admin    → organization admin, manages own org's users
--   advertiser   → regular user belonging to an org
-- ---------------------------------------------------------------------------

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'org_admin';
