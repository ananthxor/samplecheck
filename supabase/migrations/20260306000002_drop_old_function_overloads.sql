-- Drop old function overloads that lack the p_timezone parameter.
-- CREATE OR REPLACE with a different signature creates a new overload rather
-- than replacing in-place, leaving both versions registered. PostgREST hits the
-- wrong one when p_timezone is passed, causing a 400. Dropping the old signatures
-- forces PostgREST to route to the new (timezone-aware) versions.

DROP FUNCTION IF EXISTS public.fetch_metrics_range(UUID, DATE, DATE, UUID, UUID);
DROP FUNCTION IF EXISTS public.fetch_hourly_metrics(UUID, DATE);
