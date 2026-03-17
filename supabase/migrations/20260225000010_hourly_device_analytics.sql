-- Migration: Hourly metrics and device breakdown RPC functions
-- Phase 13: Analytics Enhancements (ANLYT-08, ANLYT-11)

-- fetch_hourly_metrics: Returns 24 rows (hours 0-23) with impressions and clicks
-- for a given advertiser on a specific date. Zero-filled via generate_series LEFT JOIN.
-- Used by the hourly breakdown chart (ANLYT-08).
CREATE OR REPLACE FUNCTION public.fetch_hourly_metrics(
  p_advertiser_id UUID,
  p_date DATE
)
RETURNS TABLE (
  hour_of_day INTEGER,
  impressions BIGINT,
  clicks BIGINT
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
      EXTRACT(HOUR FROM ae.event_timestamp)::INTEGER AS hour_of_day,
      COUNT(*) FILTER (WHERE ae.event_type = 'impression_served') AS impressions,
      COUNT(*) FILTER (WHERE ae.event_type = 'click') AS clicks
    FROM public.ad_events ae
    WHERE ae.advertiser_id = p_advertiser_id
      AND ae.event_timestamp >= p_date::TIMESTAMPTZ
      AND ae.event_timestamp < (p_date + INTERVAL '1 day')::TIMESTAMPTZ
    GROUP BY EXTRACT(HOUR FROM ae.event_timestamp)::INTEGER
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


-- fetch_device_breakdown: Returns impression counts grouped by device type
-- for a given advertiser and date range.
-- Scoped to impression_served events only for consistency with KPI impressions metric (ANLYT-11).
-- Device types are: 'desktop', 'mobile', 'tablet', 'unknown' (from normalizeDevice() in track-event).
CREATE OR REPLACE FUNCTION public.fetch_device_breakdown(
  p_advertiser_id UUID,
  p_start_date DATE,
  p_end_date DATE
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
  WHERE ae.advertiser_id = p_advertiser_id
    AND ae.event_type = 'impression_served'
    AND ae.event_timestamp >= p_start_date::TIMESTAMPTZ
    AND ae.event_timestamp < (p_end_date + INTERVAL '1 day')::TIMESTAMPTZ
  GROUP BY ae.extra_data->>'device_type'
  ORDER BY impressions DESC;
END;
$$;
