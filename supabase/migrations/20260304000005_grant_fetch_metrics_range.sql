-- Grant execute on fetch_metrics_range to all PostgREST roles.
-- fetch_hourly_metrics and fetch_device_breakdown work without explicit grants
-- likely because they were created before a schema policy tightening. Adding
-- explicit grants here ensures the function is callable regardless.

GRANT EXECUTE ON FUNCTION public.fetch_metrics_range(UUID, DATE, DATE, UUID, UUID)
  TO authenticated, anon, service_role;
