-- =============================================================================
-- ScrollToday: Tracker Configuration Tables
-- =============================================================================
-- Phase 7, Plan 02: Tracker Schema & Tag Generation Utilities
-- Creates tracker_configs and creative_trackers tables with RLS policies
-- =============================================================================

-- =============================================================================
-- TABLES
-- =============================================================================

-- Tracker Configurations: reusable tracker definitions per advertiser
CREATE TABLE public.tracker_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  advertiser_id UUID NOT NULL REFERENCES public.advertisers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tracker_url TEXT NOT NULL,
  tracker_type TEXT NOT NULL CHECK (tracker_type IN ('pixel', 'script')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.tracker_configs IS 'Reusable third-party tracker configurations per advertiser. tracker_type: pixel = 1x1 img, script = JS tag.';

-- Creative-Tracker junction: assigns tracker configs to creatives with fire conditions
CREATE TABLE public.creative_trackers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creative_id UUID NOT NULL REFERENCES public.creatives(id) ON DELETE CASCADE,
  tracker_config_id UUID NOT NULL REFERENCES public.tracker_configs(id) ON DELETE CASCADE,
  fire_condition TEXT NOT NULL CHECK (fire_condition IN ('on_load', 'on_viewable', 'on_click', 'on_engagement')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(creative_id, tracker_config_id, fire_condition)
);

COMMENT ON TABLE public.creative_trackers IS 'Maps tracker configurations to creatives with fire condition. Unique constraint prevents duplicate assignments.';

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_tracker_configs_advertiser ON public.tracker_configs (advertiser_id);
CREATE INDEX idx_creative_trackers_creative ON public.creative_trackers (creative_id);
CREATE INDEX idx_creative_trackers_config ON public.creative_trackers (tracker_config_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.tracker_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_trackers ENABLE ROW LEVEL SECURITY;

-- ---- Tracker Configs Policies ----

CREATE POLICY "Super admin full access to tracker_configs"
ON public.tracker_configs FOR ALL
TO authenticated
USING ((SELECT public.is_super_admin()))
WITH CHECK ((SELECT public.is_super_admin()));

CREATE POLICY "Users can manage own tracker_configs"
ON public.tracker_configs FOR ALL
TO authenticated
USING (advertiser_id = (SELECT public.get_user_advertiser_id()))
WITH CHECK (advertiser_id = (SELECT public.get_user_advertiser_id()));

-- ---- Creative Trackers Policies ----

CREATE POLICY "Super admin full access to creative_trackers"
ON public.creative_trackers FOR ALL
TO authenticated
USING ((SELECT public.is_super_admin()))
WITH CHECK ((SELECT public.is_super_admin()));

CREATE POLICY "Users can manage own creative_trackers"
ON public.creative_trackers FOR ALL
TO authenticated
USING (
  creative_id IN (
    SELECT id FROM public.creatives
    WHERE advertiser_id = (SELECT public.get_user_advertiser_id())
  )
)
WITH CHECK (
  creative_id IN (
    SELECT id FROM public.creatives
    WHERE advertiser_id = (SELECT public.get_user_advertiser_id())
  )
);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tracker_configs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
