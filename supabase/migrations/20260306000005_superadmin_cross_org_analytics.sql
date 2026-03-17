-- Allow super admins to query analytics across all orgs by passing NULL as
-- p_advertiser_id. Regular users must still supply their own advertiser_id.
-- Also applies to fetch_hourly_metrics and fetch_device_breakdown.

-- ---------------------------------------------------------------------------
-- fetch_metrics_range (super-admin-aware)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fetch_metrics_range(
  p_advertiser_id UUID    DEFAULT NULL,
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
  -- Non-super-admins must supply their own advertiser_id
  IF p_advertiser_id IS NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE auth_user_id = auth.uid() AND role = 'super_admin'
    ) THEN
      RAISE EXCEPTION 'advertiser_id required';
    END IF;
  END IF;

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
  WHERE
    (p_advertiser_id IS NULL OR ae.advertiser_id = p_advertiser_id)
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


-- ---------------------------------------------------------------------------
-- fetch_hourly_metrics (super-admin-aware)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fetch_hourly_metrics(
  p_advertiser_id UUID,
  p_date          DATE,
  p_timezone      TEXT DEFAULT 'UTC'
)
RETURNS TABLE (
  hour_of_day INTEGER,
  impressions BIGINT,
  clicks      BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH hours AS (
    SELECT generate_series(0, 23) AS hour_of_day
  ),
  event_counts AS (
    SELECT
      EXTRACT(HOUR FROM (ae.event_timestamp AT TIME ZONE p_timezone))::INTEGER AS hour_of_day,
      COUNT(*) FILTER (WHERE ae.event_type = 'impression_served') AS impressions,
      COUNT(*) FILTER (WHERE ae.event_type = 'click') AS clicks
    FROM public.ad_events ae
    WHERE
      (p_advertiser_id IS NULL OR ae.advertiser_id = p_advertiser_id)
      AND ae.event_timestamp >= (p_date::TIMESTAMP AT TIME ZONE p_timezone)
      AND ae.event_timestamp <  ((p_date + INTERVAL '1 day')::TIMESTAMP AT TIME ZONE p_timezone)
    GROUP BY EXTRACT(HOUR FROM (ae.event_timestamp AT TIME ZONE p_timezone))::INTEGER
  )
  SELECT
    h.hour_of_day,
    COALESCE(ec.impressions, 0) AS impressions,
    COALESCE(ec.clicks, 0) AS clicks
  FROM hours h
  LEFT JOIN event_counts ec ON ec.hour_of_day = h.hour_of_day
  ORDER BY h.hour_of_day;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_hourly_metrics(UUID, DATE, TEXT) TO authenticated, service_role;


-- ---------------------------------------------------------------------------
-- fetch_device_breakdown (super-admin-aware)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fetch_device_breakdown(
  p_advertiser_id UUID,
  p_start_date    DATE,
  p_end_date      DATE
)
RETURNS TABLE (
  device_type TEXT,
  impressions BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(ae.extra_data->>'device_type', 'unknown') AS device_type,
    COUNT(*) AS impressions
  FROM public.ad_events ae
  WHERE
    (p_advertiser_id IS NULL OR ae.advertiser_id = p_advertiser_id)
    AND ae.event_type = 'impression_served'
    AND ae.event_timestamp >= (p_start_date::TIMESTAMP AT TIME ZONE 'UTC')
    AND ae.event_timestamp <  ((p_end_date + INTERVAL '1 day')::TIMESTAMP AT TIME ZONE 'UTC')
  GROUP BY ae.extra_data->>'device_type'
  ORDER BY impressions DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_device_breakdown(UUID, DATE, DATE) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
