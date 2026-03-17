-- Fix: fetch_hourly_metrics and fetch_device_breakdown must accept NULL
-- p_advertiser_id so super admins can query across all orgs ("All Organizations").
-- The WHERE logic already handles NULL correctly; only the signature was missing
-- DEFAULT NULL, causing PostgreSQL to reject calls that omit the parameter.

-- ---------------------------------------------------------------------------
-- fetch_hourly_metrics — add DEFAULT NULL to p_advertiser_id
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fetch_hourly_metrics(
  p_advertiser_id UUID    DEFAULT NULL,
  p_date          DATE    DEFAULT NULL,
  p_timezone      TEXT    DEFAULT 'UTC'
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
-- fetch_device_breakdown — add DEFAULT NULL to p_advertiser_id
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fetch_device_breakdown(
  p_advertiser_id UUID DEFAULT NULL,
  p_start_date    DATE DEFAULT NULL,
  p_end_date      DATE DEFAULT NULL
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
