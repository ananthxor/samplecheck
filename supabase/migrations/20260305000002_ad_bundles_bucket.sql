-- Create public Supabase Storage bucket for pre-built ad bundles.
-- Acts as CDN for self-contained JS ad bundles uploaded at publish time.
-- To swap CDN providers later: point VITE_CDN_BASE_URL to the new provider.

INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'ad-bundles',
  'ad-bundles',
  true,
  ARRAY['application/javascript', 'text/javascript'],
  10485760 -- 10 MB max per bundle
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read bundles (they are public ad files)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public read access for ad-bundles' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Public read access for ad-bundles"
      ON storage.objects FOR SELECT TO public
      USING (bucket_id = 'ad-bundles');
  END IF;
END $$;

-- Allow authenticated users to upload/replace bundles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated upload to ad-bundles' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Authenticated upload to ad-bundles"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'ad-bundles');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated update in ad-bundles' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Authenticated update in ad-bundles"
      ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'ad-bundles');
  END IF;
END $$;
