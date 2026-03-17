-- Replace the CTE-based timezone version with a flat SELECT approach
-- matching the last known-working version (20260304000008) but with
-- timezone-aware date bucketing and date boundary filters.
-- Also forces PostgREST to reload its schema cache.

CREATE OR REPLACE FUNCTION public.fetch_metrics_range(
  p_advertiser_id UUID,
  p_start_date    DATE    DEFAULT NULL,
  p_end_date      DATE    DEFAULT NULL,
  p_creative_id   UUID    DEFAULT NULL,
  p_campaign_id   UUID    DEFAULT NULL,
  p_timezone      TEXT    DEFAULT 'UTC'
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
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (ae.event_timestamp AT TIME ZONE p_timezone)::DATE           AS metric_date,
    ae.creative_id                                               AS creative_id,
    ae.campaign_id                                               AS campaign_id,
    COUNT(*) FILTER (WHERE ae.event_type = 'impression_served')::BIGINT   AS impressions_served,
    COUNT(*) FILTER (WHERE ae.event_type = 'impression_viewable')::BIGINT AS impressions_viewable,
    COUNT(*) FILTER (WHERE ae.event_type = 'click')::BIGINT               AS clicks,
    COUNT(*) FILTER (WHERE ae.event_type = 'engagement')::BIGINT          AS engagements,
    COUNT(*) FILTER (WHERE ae.event_type = 'video_play')::BIGINT          AS video_plays,
    COUNT(*) FILTER (WHERE ae.event_type = 'video_complete')::BIGINT      AS video_completes,
    COALESCE(SUM(
      CASE
        WHEN ae.event_type = 'engagement'
          AND ae.extra_data->>'dwell_time_ms' ~ '^[0-9]+$'
        THEN (ae.extra_data->>'dwell_time_ms')::BIGINT
        ELSE 0
      END
    )::BIGINT, 0)                                                AS total_dwell_time_ms,
    '{}'::jsonb                                                  AS engagement_metrics
  FROM public.ad_events ae
  INNER JOIN public.creatives c ON c.id = ae.creative_id
  WHERE ae.advertiser_id = p_advertiser_id
    AND (p_start_date IS NULL OR ae.event_timestamp >= (p_start_date::TIMESTAMP AT TIME ZONE p_timezone))
    AND (p_end_date   IS NULL OR ae.event_timestamp <  ((p_end_date + INTERVAL '1 day')::TIMESTAMP AT TIME ZONE p_timezone))
    AND (p_creative_id IS NULL OR ae.creative_id = p_creative_id)
    AND (p_campaign_id IS NULL OR ae.campaign_id = p_campaign_id)
  GROUP BY
    (ae.event_timestamp AT TIME ZONE p_timezone)::DATE,
    ae.creative_id,
    ae.campaign_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_metrics_range(UUID, DATE, DATE, UUID, UUID, TEXT)
  TO authenticated, anon, service_role;

-- Force PostgREST to reload function signatures from pg_catalog
NOTIFY pgrst, 'reload schema';
