-- =============================================================================
-- ScrollToday: Campaign Date Fields & Tracker Category
-- =============================================================================
-- Phase 11, Plan 01: Foundation Enhancements
-- Adds advertiser_name, start_date, end_date to campaigns table
-- Adds category column to tracker_configs table
-- =============================================================================

-- =============================================================================
-- CAMPAIGN DATE FIELDS (CAMP-07)
-- =============================================================================

ALTER TABLE public.campaigns
  ADD COLUMN advertiser_name TEXT,
  ADD COLUMN start_date DATE,
  ADD COLUMN end_date DATE;

COMMENT ON COLUMN public.campaigns.advertiser_name IS 'Client/brand name for this campaign';
COMMENT ON COLUMN public.campaigns.start_date IS 'Campaign flight start date';
COMMENT ON COLUMN public.campaigns.end_date IS 'Campaign flight end date';

-- =============================================================================
-- TRACKER CATEGORY (TRK-02, TRK-03)
-- =============================================================================

ALTER TABLE public.tracker_configs
  ADD COLUMN category TEXT NOT NULL DEFAULT 'impression'
  CHECK (category IN ('conversion', 'impression', 'click'));

COMMENT ON COLUMN public.tracker_configs.category IS 'Tracker measurement category';

CREATE INDEX idx_tracker_configs_category ON public.tracker_configs (category);
