-- Add bundle_url column to creatives table.
-- This stores the public CDN URL of the pre-built JS bundle uploaded at publish time.
-- Abstracted: to swap CDN providers, update VITE_CDN_BASE_URL and re-upload bundles.

ALTER TABLE creatives ADD COLUMN IF NOT EXISTS bundle_url TEXT;
