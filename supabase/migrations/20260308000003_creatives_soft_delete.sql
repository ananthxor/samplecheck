-- Soft-delete for creatives.
-- Instead of physically removing a row (which loses all analytics join data),
-- set deleted_at = now(). All creative list queries filter WHERE deleted_at IS NULL.
-- Analytics functions use INNER JOIN creatives, so events from soft-deleted
-- creatives are still counted — the row exists, just with deleted_at set.

ALTER TABLE public.creatives
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Partial index: only indexes non-deleted rows, keeping list queries fast
CREATE INDEX IF NOT EXISTS idx_creatives_not_deleted
  ON public.creatives (advertiser_id, updated_at DESC)
  WHERE deleted_at IS NULL;

NOTIFY pgrst, 'reload schema';
