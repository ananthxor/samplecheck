-- =============================================================================
-- ScrollToday: Initial Database Schema
-- =============================================================================
-- Phase 1: Foundation & Data Schema
-- Creates core tables, enums, indexes, RLS policies, and helper functions
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- =============================================================================
-- CUSTOM ENUMS
-- =============================================================================

CREATE TYPE public.event_type AS ENUM (
  'impression_served',
  'impression_viewable',
  'engagement',
  'click',
  'video_play',
  'video_pause',
  'video_complete',
  'expand',
  'collapse',
  'close'
);

CREATE TYPE public.user_role AS ENUM ('super_admin', 'advertiser');

CREATE TYPE public.creative_status AS ENUM ('draft', 'active', 'paused', 'archived');

CREATE TYPE public.campaign_status AS ENUM ('draft', 'active', 'paused', 'completed');

-- =============================================================================
-- TABLES
-- =============================================================================

-- Advertisers: top-level tenant entity
CREATE TABLE public.advertisers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.advertisers IS 'Top-level tenant entity. All data is scoped to an advertiser.';

-- User Profiles: links Supabase Auth users to advertisers
CREATE TABLE public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  advertiser_id UUID REFERENCES public.advertisers(id) ON DELETE SET NULL,
  role public.user_role NOT NULL DEFAULT 'advertiser',
  display_name TEXT,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(auth_user_id)
);

COMMENT ON TABLE public.user_profiles IS 'Maps Supabase Auth users to advertisers with role-based access.';

-- Campaigns: advertiser campaigns
CREATE TABLE public.campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  advertiser_id UUID NOT NULL REFERENCES public.advertisers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status public.campaign_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.campaigns IS 'Advertiser campaigns that group creatives.';

-- Creatives: ad creative records with JSONB template data
CREATE TABLE public.creatives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  advertiser_id UUID NOT NULL REFERENCES public.advertisers(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  format_id TEXT NOT NULL,
  format_name TEXT NOT NULL,
  status public.creative_status NOT NULL DEFAULT 'draft',
  schema_version INTEGER NOT NULL DEFAULT 1,
  template_data JSONB NOT NULL DEFAULT '{}',
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.creatives IS 'Ad creative records. schema_version prevents schema lock-in. template_data stores format-specific configuration.';

-- Ad Events: immutable, monthly-partitioned event log
-- PRIMARY KEY must include the partition column (event_timestamp)
CREATE TABLE public.ad_events (
  id UUID DEFAULT gen_random_uuid(),
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type public.event_type NOT NULL,
  request_id UUID NOT NULL,
  creative_id UUID NOT NULL,
  campaign_id UUID,
  advertiser_id UUID NOT NULL,
  extra_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_timestamp, id)
) PARTITION BY RANGE (event_timestamp);

COMMENT ON TABLE public.ad_events IS 'Immutable ad event log. Partitioned monthly by event_timestamp. All events from a single ad exposure share a request_id.';

-- =============================================================================
-- PARTITIONS (Feb 2026 through Jul 2026)
-- =============================================================================

CREATE TABLE public.ad_events_2026_02
  PARTITION OF public.ad_events
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE public.ad_events_2026_03
  PARTITION OF public.ad_events
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE public.ad_events_2026_04
  PARTITION OF public.ad_events
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE public.ad_events_2026_05
  PARTITION OF public.ad_events
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE public.ad_events_2026_06
  PARTITION OF public.ad_events
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE TABLE public.ad_events_2026_07
  PARTITION OF public.ad_events
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

-- Daily Metrics: pre-aggregated rollup table for dashboard queries
CREATE TABLE public.daily_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_date DATE NOT NULL,
  advertiser_id UUID NOT NULL REFERENCES public.advertisers(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  creative_id UUID REFERENCES public.creatives(id) ON DELETE CASCADE,
  impressions_served BIGINT NOT NULL DEFAULT 0,
  impressions_viewable BIGINT NOT NULL DEFAULT 0,
  clicks BIGINT NOT NULL DEFAULT 0,
  engagements BIGINT NOT NULL DEFAULT 0,
  video_plays BIGINT NOT NULL DEFAULT 0,
  video_completes BIGINT NOT NULL DEFAULT 0,
  total_dwell_time_ms BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(metric_date, advertiser_id, campaign_id, creative_id)
);

COMMENT ON TABLE public.daily_metrics IS 'Pre-aggregated daily metrics for fast dashboard queries. Unique per (date, advertiser, campaign, creative).';

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Ad Events indexes (created on parent, inherited by partitions)
CREATE INDEX idx_ad_events_request_id ON public.ad_events (request_id);
CREATE INDEX idx_ad_events_creative_id ON public.ad_events (creative_id);
CREATE INDEX idx_ad_events_advertiser_id ON public.ad_events (advertiser_id);
CREATE INDEX idx_ad_events_event_type ON public.ad_events (event_type);

-- Creatives indexes
CREATE INDEX idx_creatives_advertiser_id ON public.creatives (advertiser_id);
CREATE INDEX idx_creatives_campaign_id ON public.creatives (campaign_id);

-- Campaigns indexes
CREATE INDEX idx_campaigns_advertiser_id ON public.campaigns (advertiser_id);

-- Daily Metrics indexes (composite for time-range dashboard queries)
CREATE INDEX idx_daily_metrics_advertiser_date ON public.daily_metrics (advertiser_id, metric_date);
CREATE INDEX idx_daily_metrics_campaign_date ON public.daily_metrics (campaign_id, metric_date);

-- User Profiles indexes
CREATE INDEX idx_user_profiles_auth_user_id ON public.user_profiles (auth_user_id);
CREATE INDEX idx_user_profiles_advertiser_id ON public.user_profiles (advertiser_id);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get the current authenticated user's advertiser_id
-- Uses (SELECT auth.uid()) for query planner caching optimization
CREATE OR REPLACE FUNCTION public.get_user_advertiser_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT advertiser_id FROM public.user_profiles
  WHERE auth_user_id = (SELECT auth.uid())
$$;

COMMENT ON FUNCTION public.get_user_advertiser_id() IS 'Returns the advertiser_id for the currently authenticated user. Used in RLS policies.';

-- Check if the current authenticated user is a super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE auth_user_id = (SELECT auth.uid())
    AND role = 'super_admin'
  )
$$;

COMMENT ON FUNCTION public.is_super_admin() IS 'Returns true if the currently authenticated user has super_admin role. Used in RLS policies.';

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.advertisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

-- ---- Advertisers Policies ----

CREATE POLICY "Super admin full access to advertisers"
ON public.advertisers FOR ALL
TO authenticated
USING ((SELECT public.is_super_admin()))
WITH CHECK ((SELECT public.is_super_admin()));

CREATE POLICY "Users can view own advertiser"
ON public.advertisers FOR SELECT
TO authenticated
USING (id = (SELECT public.get_user_advertiser_id()));

-- ---- User Profiles Policies ----

CREATE POLICY "Super admin full access to profiles"
ON public.user_profiles FOR ALL
TO authenticated
USING ((SELECT public.is_super_admin()))
WITH CHECK ((SELECT public.is_super_admin()));

CREATE POLICY "Users can view own profile"
ON public.user_profiles FOR SELECT
TO authenticated
USING (auth_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (auth_user_id = (SELECT auth.uid()))
WITH CHECK (auth_user_id = (SELECT auth.uid()));

-- ---- Campaigns Policies ----

CREATE POLICY "Super admin full access to campaigns"
ON public.campaigns FOR ALL
TO authenticated
USING ((SELECT public.is_super_admin()))
WITH CHECK ((SELECT public.is_super_admin()));

CREATE POLICY "Users can manage own campaigns"
ON public.campaigns FOR ALL
TO authenticated
USING (advertiser_id = (SELECT public.get_user_advertiser_id()))
WITH CHECK (advertiser_id = (SELECT public.get_user_advertiser_id()));

-- ---- Creatives Policies ----

CREATE POLICY "Super admin full access to creatives"
ON public.creatives FOR ALL
TO authenticated
USING ((SELECT public.is_super_admin()))
WITH CHECK ((SELECT public.is_super_admin()));

CREATE POLICY "Users can manage own creatives"
ON public.creatives FOR ALL
TO authenticated
USING (advertiser_id = (SELECT public.get_user_advertiser_id()))
WITH CHECK (advertiser_id = (SELECT public.get_user_advertiser_id()));

-- ---- Ad Events Policies (read-only for users, inserted via service_role) ----

CREATE POLICY "Super admin can read all events"
ON public.ad_events FOR SELECT
TO authenticated
USING ((SELECT public.is_super_admin()));

CREATE POLICY "Users can read own events"
ON public.ad_events FOR SELECT
TO authenticated
USING (advertiser_id = (SELECT public.get_user_advertiser_id()));

-- Note: INSERT on ad_events uses service_role from Edge Functions (bypasses RLS)
-- No UPDATE or DELETE policies -- events are immutable

-- ---- Daily Metrics Policies ----

CREATE POLICY "Super admin full access to metrics"
ON public.daily_metrics FOR ALL
TO authenticated
USING ((SELECT public.is_super_admin()))
WITH CHECK ((SELECT public.is_super_admin()));

CREATE POLICY "Users can read own metrics"
ON public.daily_metrics FOR SELECT
TO authenticated
USING (advertiser_id = (SELECT public.get_user_advertiser_id()));

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_updated_at() IS 'Automatically sets updated_at to now() on row update.';

-- Apply updated_at triggers to all mutable tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.advertisers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.creatives
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.daily_metrics
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
