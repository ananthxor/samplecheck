-- =============================================================================
-- fetch_metrics_range: Direct ad_events aggregation for real-time analytics
-- =============================================================================
-- Replaces the rollup_today_metrics → daily_metrics pipeline for the real-time
-- dashboard. Queries ad_events directly (same pattern as fetch_hourly_metrics
-- and fetch_device_breakdown), bypassing the broken rollup materialization.
--
-- Returns DailyMetricRow-compatible rows grouped by (date, creative, campaign).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fetch_metrics_range(
  p_advertiser_id UUID,
  p_start_date    DATE    DEFAULT NULL,
  p_end_date      DATE    DEFAULT NULL,
  p_creative_id   UUID    DEFAULT NULL,
  p_campaign_id   UUID    DEFAULT NULL
)
RETURNS TABLE (
  metric_date          DATE,
  creative_id          UUID,
  campaign_id          UUID,
  impressions_served   BIGINT,
  impressions_viewable BIGINT,
  clicks               BIGINT,
  engagements          BIGINT,
  video_plays          BIGINT,
  video_completes      BIGINT,
  total_dwell_time_ms  BIGINT,
  engagement_metrics   JSONB
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH base AS (
    -- Pull all qualifying raw events into a single CTE so we scan ad_events once.
    SELECT
      ae.event_timestamp::DATE AS d,
      ae.creative_id           AS cid,
      ae.campaign_id           AS camp,
      ae.event_type,
      ae.extra_data
    FROM public.ad_events ae
    INNER JOIN public.creatives c ON c.id = ae.creative_id
    WHERE ae.advertiser_id = p_advertiser_id
      AND (p_start_date IS NULL OR ae.event_timestamp >= p_start_date::TIMESTAMPTZ)
      AND (p_end_date   IS NULL OR ae.event_timestamp <  (p_end_date + INTERVAL '1 day')::TIMESTAMPTZ)
      AND (p_creative_id IS NULL OR ae.creative_id = p_creative_id)
      AND (p_campaign_id IS NULL OR ae.campaign_id = p_campaign_id)
  ),
  -- Compute per-group engagement type breakdown as JSONB.
  -- Two-level aggregation: first count by type, then object-agg per group.
  eng_breakdown AS (
    SELECT
      t.d, t.cid, t.camp,
      jsonb_object_agg(COALESCE(t.etype, 'interaction'), t.cnt) AS eng_metrics
    FROM (
      SELECT
        d, cid, camp,
        extra_data->>'type' AS etype,
        count(*)            AS cnt
      FROM base
      WHERE event_type = 'engagement'
      GROUP BY d, cid, camp, extra_data->>'type'
    ) t
    GROUP BY t.d, t.cid, t.camp
  ),
  -- Main metric aggregation grouped by (date, creative, campaign).
  main_agg AS (
    SELECT
      d, cid, camp,
      COUNT(*) FILTER (WHERE event_type = 'impression_served')::BIGINT  AS imp_served,
      COUNT(*) FILTER (WHERE event_type = 'impression_viewable')::BIGINT AS imp_viewable,
      COUNT(*) FILTER (WHERE event_type = 'click')::BIGINT               AS clicks,
      COUNT(*) FILTER (WHERE event_type = 'engagement')::BIGINT          AS engs,
      COUNT(*) FILTER (WHERE event_type = 'video_play')::BIGINT          AS vplays,
      COUNT(*) FILTER (WHERE event_type = 'video_complete')::BIGINT      AS vcompletes,
      COALESCE(SUM(CASE
        WHEN (event_type = 'engagement' OR event_type = 'presence')
          AND extra_data->>'dwell_time_ms' ~ '^[0-9]+$'
        THEN (extra_data->>'dwell_time_ms')::BIGINT
        ELSE 0
      END), 0)::BIGINT AS dwell_ms
    FROM base
    GROUP BY d, cid, camp
  )
  SELECT
    m.d,
    m.cid,
    m.camp,
    m.imp_served,
    m.imp_viewable,
    m.clicks,
    m.engs,
    m.vplays,
    m.vcompletes,
    m.dwell_ms,
    COALESCE(e.eng_metrics, '{}'::jsonb)
  FROM main_agg m
  LEFT JOIN eng_breakdown e
    ON  e.d    = m.d
    AND e.cid  = m.cid
    AND (e.camp = m.camp OR (e.camp IS NULL AND m.camp IS NULL));
END;
$$;
