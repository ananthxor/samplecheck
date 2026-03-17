-- =============================================================================
-- Fix: daily_metrics ON CONFLICT fails for NULL campaign_id
-- =============================================================================
-- The UNIQUE(metric_date, advertiser_id, campaign_id, creative_id) constraint
-- uses standard PostgreSQL NULLS DISTINCT semantics, meaning NULL != NULL.
-- This causes ON CONFLICT in rollup_today_metrics / rollup_daily_metrics to
-- never match rows where campaign_id IS NULL (the common case for preview
-- tracking). Each rollup call inserted a NEW row instead of UPDATing,
-- causing duplicate rows and stale / inflated analytics counts.
--
-- Fix: deduplicate existing rows, drop the old constraint, and replace it
-- with UNIQUE NULLS NOT DISTINCT so NULL = NULL for conflict detection.
-- =============================================================================

-- 1. Deduplicate daily_metrics: keep the most-recently-updated row per
--    logical key (metric_date, advertiser_id, campaign_id, creative_id).
--    PARTITION BY in PostgreSQL already treats NULLs as equal, so rows
--    with campaign_id IS NULL are correctly grouped together.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY metric_date, advertiser_id, campaign_id, creative_id
      ORDER BY updated_at DESC, id DESC
    ) AS rn
  FROM public.daily_metrics
)
DELETE FROM public.daily_metrics
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 2. Drop the old UNIQUE constraint (auto-generated name).
DO $$
DECLARE
  v_constraint TEXT;
BEGIN
  SELECT conname INTO v_constraint
  FROM pg_constraint
  WHERE conrelid = 'public.daily_metrics'::regclass
    AND contype = 'u'
  LIMIT 1;

  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.daily_metrics DROP CONSTRAINT %I', v_constraint);
    RAISE NOTICE 'Dropped old unique constraint: %', v_constraint;
  END IF;
END;
$$;

-- 3. Add a new NULLS NOT DISTINCT unique constraint.
--    This makes NULL == NULL for conflict detection, so ON CONFLICT
--    correctly matches rows even when campaign_id IS NULL.
ALTER TABLE public.daily_metrics
ADD CONSTRAINT daily_metrics_unique_row
  UNIQUE NULLS NOT DISTINCT (metric_date, advertiser_id, campaign_id, creative_id);

-- 4. Replace both rollup functions to use ON CONFLICT ON CONSTRAINT
--    so the arbiter is unambiguous.

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
      COALESCE(SUM(CASE
        WHEN (ae.event_type = 'engagement' OR ae.event_type = 'presence')
          AND ae.extra_data->>'dwell_time_ms' ~ '^[0-9]+$'
        THEN (ae.extra_data->>'dwell_time_ms')::BIGINT
        ELSE 0
      END), 0),
      COALESCE(
        (SELECT jsonb_object_agg(COALESCE(e.engagement_type, 'interaction'), e.cnt)
         FROM (
           SELECT extra_data->>'type' AS engagement_type, count(*) AS cnt
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
    ON CONFLICT ON CONSTRAINT daily_metrics_unique_row
    DO UPDATE SET
      impressions_served    = EXCLUDED.impressions_served,
      impressions_viewable  = EXCLUDED.impressions_viewable,
      clicks                = EXCLUDED.clicks,
      engagements           = EXCLUDED.engagements,
      video_plays           = EXCLUDED.video_plays,
      video_completes       = EXCLUDED.video_completes,
      total_dwell_time_ms   = EXCLUDED.total_dwell_time_ms,
      engagement_metrics    = EXCLUDED.engagement_metrics,
      updated_at            = now()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM upserted;
  RETURN v_count;
END;
$$;

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
      COALESCE(SUM(CASE
        WHEN (ae.event_type = 'engagement' OR ae.event_type = 'presence')
          AND ae.extra_data->>'dwell_time_ms' ~ '^[0-9]+$'
        THEN (ae.extra_data->>'dwell_time_ms')::BIGINT
        ELSE 0
      END), 0),
      COALESCE(
        (SELECT jsonb_object_agg(COALESCE(e.engagement_type, 'interaction'), e.cnt)
         FROM (
           SELECT extra_data->>'type' AS engagement_type, count(*) AS cnt
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
    ON CONFLICT ON CONSTRAINT daily_metrics_unique_row
    DO UPDATE SET
      impressions_served    = EXCLUDED.impressions_served,
      impressions_viewable  = EXCLUDED.impressions_viewable,
      clicks                = EXCLUDED.clicks,
      engagements           = EXCLUDED.engagements,
      video_plays           = EXCLUDED.video_plays,
      video_completes       = EXCLUDED.video_completes,
      total_dwell_time_ms   = EXCLUDED.total_dwell_time_ms,
      engagement_metrics    = EXCLUDED.engagement_metrics,
      updated_at            = now()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM upserted;
  RETURN v_count;
END;
$$;
