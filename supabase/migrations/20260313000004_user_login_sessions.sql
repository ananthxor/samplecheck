-- =============================================================================
-- User Login Sessions
-- =============================================================================
-- Stores per-login metadata: IP, geo-location, browser, OS, device type.
-- Recorded automatically at sign-in (client-side, fire-and-forget).
-- RLS: each user can only see/insert their own rows.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_login_sessions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address   TEXT,
  city         TEXT,
  region       TEXT,
  country_name TEXT,
  country_code TEXT,
  latitude     DOUBLE PRECISION,
  longitude    DOUBLE PRECISION,
  browser      TEXT,
  os           TEXT,
  device_type  TEXT,   -- 'desktop' | 'mobile'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_login_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_login_sessions"
  ON public.user_login_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_login_sessions"
  ON public.user_login_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_user_login_sessions_user_created
  ON public.user_login_sessions(user_id, created_at DESC);
