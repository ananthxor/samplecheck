-- =============================================================================
-- Phase 10: Analytics V3 - Engagement Breakdown
-- =============================================================================
-- Adds engagement_metrics JSONB column to daily_metrics for detailed
-- interaction tracking (flips, swipes, etc.) and updates rollup functions.
-- =============================================================================

-- 1. ADD COLUMN
ALTER TABLE public.daily_metrics 
ADD COLUMN IF NOT EXISTS engagement_metrics JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 2. UPDATE ROLLUP FUNCTIONS WITH ENGAGEMENT BREAKDOWN
-- Includes previously implemented dwell time (presence) fixes.

-- Fix rollup_today_metrics
CREATE OR REPLACE FUNCTION public.rollup_today_metrics(p_advertiser_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_count INTEGER;
BEGIN
  WITH upserted AS (
    INSERT INTO public.daily_metrics (
      metric_date, advertiser_id, campaign_id, creative_id,
      impressions_served, impressions_viewable, clicks, engagements,
      video_plays, video_completes, total_dwell_time_ms, engagement_metrics
    )
    SELECT
      v_today, ae.advertiser_id, ae.campaign_id, ae.creative_id,
      COUNT(*) FILTER (WHERE ae.event_type = 'impression_served'),
      COUNT(*) FILTER (WHERE ae.event_type = 'impression_viewable'),
      COUNT(*) FILTER (WHERE ae.event_type = 'click'),
      COUNT(*) FILTER (WHERE ae.event_type = 'engagement'),
      COUNT(*) FILTER (WHERE ae.event_type = 'video_play'),
      COUNT(*) FILTER (WHERE ae.event_type = 'video_complete'),
      COALESCE(SUM(CASE WHEN (ae.event_type = 'engagement' OR ae.event_type = 'presence') AND ae.extra_data->>'dwell_time_ms' ~ '^[0-9]+$' THEN (ae.extra_data->>'dwell_time_ms')::BIGINT ELSE 0 END), 0),
      COALESCE(
        (SELECT jsonb_object_agg(COALESCE(e.extra_data->>'type', 'interaction'), e.count)
         FROM (
           SELECT extra_data, count(*) as count
           FROM public.ad_events
           WHERE event_type = 'engagement'
             AND event_timestamp >= v_today::TIMESTAMPTZ
             AND event_timestamp < (v_today + INTERVAL '1 day')::TIMESTAMPTZ
             AND advertiser_id = ae.advertiser_id
             AND creative_id = ae.creative_id
             AND (campaign_id = ae.campaign_id OR (campaign_id IS NULL AND ae.campaign_id IS NULL))
           GROUP BY extra_data->>'type'
         ) e
        ), '{}'::jsonb
      )
    FROM public.ad_events ae
    INNER JOIN public.creatives c ON c.id = ae.creative_id
    WHERE ae.event_timestamp >= v_today::TIMESTAMPTZ
      AND ae.event_timestamp < (v_today + INTERVAL '1 day')::TIMESTAMPTZ
      AND ae.advertiser_id = p_advertiser_id
    GROUP BY ae.advertiser_id, ae.campaign_id, ae.creative_id
    ON CONFLICT (metric_date, advertiser_id, campaign_id, creative_id)
    DO UPDATE SET
      impressions_served = EXCLUDED.impressions_served,
      impressions_viewable = EXCLUDED.impressions_viewable,
      clicks = EXCLUDED.clicks,
      engagements = EXCLUDED.engagements,
      video_plays = EXCLUDED.video_plays,
      video_completes = EXCLUDED.video_completes,
      total_dwell_time_ms = EXCLUDED.total_dwell_time_ms,
      engagement_metrics = EXCLUDED.engagement_metrics,
      updated_at = now()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM upserted;
  RETURN v_count;
END;
$$;

-- Fix rollup_daily_metrics
CREATE OR REPLACE FUNCTION public.rollup_daily_metrics(p_date DATE DEFAULT (CURRENT_DATE - INTERVAL '1 day')::DATE)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH upserted AS (
    INSERT INTO public.daily_metrics (
      metric_date, advertiser_id, campaign_id, creative_id,
      impressions_served, impressions_viewable, clicks, engagements,
      video_plays, video_completes, total_dwell_time_ms, engagement_metrics
    )
    SELECT
      p_date, ae.advertiser_id, ae.campaign_id, ae.creative_id,
      COUNT(*) FILTER (WHERE ae.event_type = 'impression_served'),
      COUNT(*) FILTER (WHERE ae.event_type = 'impression_viewable'),
      COUNT(*) FILTER (WHERE ae.event_type = 'click'),
      COUNT(*) FILTER (WHERE ae.event_type = 'engagement'),
      COUNT(*) FILTER (WHERE ae.event_type = 'video_play'),
      COUNT(*) FILTER (WHERE ae.event_type = 'video_complete'),
      COALESCE(SUM(CASE WHEN (ae.event_type = 'engagement' OR ae.event_type = 'presence') AND ae.extra_data->>'dwell_time_ms' ~ '^[0-9]+$' THEN (ae.extra_data->>'dwell_time_ms')::BIGINT ELSE 0 END), 0),
      COALESCE(
        (SELECT jsonb_object_agg(COALESCE(e.extra_data->>'type', 'interaction'), e.count)
         FROM (
           SELECT extra_data, count(*) as count
           FROM public.ad_events
           WHERE event_type = 'engagement'
             AND event_timestamp >= p_date::TIMESTAMPTZ
             AND event_timestamp < (p_date + INTERVAL '1 day')::TIMESTAMPTZ
             AND advertiser_id = ae.advertiser_id
             AND creative_id = ae.creative_id
             AND (campaign_id = ae.campaign_id OR (campaign_id IS NULL AND ae.campaign_id IS NULL))
           GROUP BY extra_data->>'type'
         ) e
        ), '{}'::jsonb
      )
    FROM public.ad_events ae
    INNER JOIN public.creatives c ON c.id = ae.creative_id
    WHERE ae.event_timestamp >= p_date::TIMESTAMPTZ
      AND ae.event_timestamp < (p_date + INTERVAL '1 day')::TIMESTAMPTZ
    GROUP BY ae.advertiser_id, ae.campaign_id, ae.creative_id
    ON CONFLICT (metric_date, advertiser_id, campaign_id, creative_id)
    DO UPDATE SET
      impressions_served = EXCLUDED.impressions_served,
      impressions_viewable = EXCLUDED.impressions_viewable,
      clicks = EXCLUDED.clicks,
      engagements = EXCLUDED.engagements,
      video_plays = EXCLUDED.video_plays,
      video_completes = EXCLUDED.video_completes,
      total_dwell_time_ms = EXCLUDED.total_dwell_time_ms,
      engagement_metrics = EXCLUDED.engagement_metrics,
      updated_at = now()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM upserted;
  RETURN v_count;
END;
$$;
