-- =============================================================================
-- ScrollToday: Development Seed Data
-- =============================================================================
-- Test data for local development and verification
--
-- Usage:
--   Apply manually via Supabase Dashboard SQL Editor
--   Or run: npx supabase db reset --linked (resets DB + applies migrations + seed)
--
-- WARNING: This seed file should ONLY be used on development databases.
-- =============================================================================

-- Create a test advertiser
INSERT INTO public.advertisers (id, name, contact_email)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Test Advertiser',
  'test@scrolltoday.dev'
);

-- Create a test campaign linked to the test advertiser
INSERT INTO public.campaigns (id, advertiser_id, name, status)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Test Campaign',
  'draft'
);

-- Create a test creative linked to the test advertiser and campaign
INSERT INTO public.creatives (id, advertiser_id, campaign_id, name, format_id, format_name, status, schema_version, width, height)
VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'Test Creative',
  'carousel',
  'Swipeable Carousel',
  'draft',
  1,
  300,
  250
);

-- Insert a test ad event to verify partitioning works
-- Uses a timestamp within the current month (Feb 2026) so it lands in ad_events_2026_02
INSERT INTO public.ad_events (event_timestamp, event_type, request_id, creative_id, campaign_id, advertiser_id, extra_data)
VALUES (
  '2026-02-19T12:00:00Z',
  'impression_served',
  'e0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  '{"test": true, "source": "seed_data"}'
);

-- Insert a corresponding viewable impression event (same request_id for funnel reconstruction)
INSERT INTO public.ad_events (event_timestamp, event_type, request_id, creative_id, campaign_id, advertiser_id, extra_data)
VALUES (
  '2026-02-19T12:00:01Z',
  'impression_viewable',
  'e0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  '{"viewable_time_ms": 1500, "test": true}'
);

-- Insert a test daily metrics row
INSERT INTO public.daily_metrics (advertiser_id, campaign_id, creative_id, metric_date, impressions_served, impressions_viewable, clicks, engagements)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  '2026-02-19',
  1000,
  750,
  45,
  120
);
