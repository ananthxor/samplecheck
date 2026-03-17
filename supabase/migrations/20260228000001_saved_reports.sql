-- ---------------------------------------------------------------------------
-- Phase 14: saved_reports table for custom report persistence
--
-- Stores user-defined report configs: name, type, resolution, metrics, date range.
-- RLS: each advertiser sees only their own rows; super admin sees all.
-- ---------------------------------------------------------------------------

CREATE TABLE public.saved_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  advertiser_id UUID NOT NULL REFERENCES public.advertisers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('display', 'standard_banner', 'tracker', 'placement')),
  resolution TEXT NOT NULL DEFAULT 'daily' CHECK (resolution IN ('hourly', 'daily')),
  metrics JSONB NOT NULL DEFAULT '["impressions","clicks","ctr","viewability"]'::jsonb,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for per-advertiser queries and name search
CREATE INDEX idx_saved_reports_advertiser ON public.saved_reports (advertiser_id);
CREATE INDEX idx_saved_reports_name ON public.saved_reports (advertiser_id, name);

-- RLS
ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full access to saved_reports"
ON public.saved_reports FOR ALL TO authenticated
USING ((SELECT public.is_super_admin()))
WITH CHECK ((SELECT public.is_super_admin()));

CREATE POLICY "Users can manage own saved_reports"
ON public.saved_reports FOR ALL TO authenticated
USING (advertiser_id = (SELECT public.get_user_advertiser_id()))
WITH CHECK (advertiser_id = (SELECT public.get_user_advertiser_id()));

-- Reuse existing handle_updated_at trigger function (created in Phase 1)
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.saved_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
