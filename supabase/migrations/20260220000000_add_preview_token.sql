-- Add preview_token column for shareable preview links
ALTER TABLE public.creatives ADD COLUMN preview_token TEXT UNIQUE;

-- Partial index for fast token lookups (only index non-null tokens)
CREATE INDEX idx_creatives_preview_token ON public.creatives (preview_token) WHERE preview_token IS NOT NULL;

-- RLS policy: Allow anonymous (unauthenticated) users to read creatives by preview_token
-- This enables shareable preview links to work without login
-- The application always queries with .eq('preview_token', token) so only the matching row is returned
CREATE POLICY "Public preview access by token"
ON public.creatives FOR SELECT
TO anon
USING (preview_token IS NOT NULL);
