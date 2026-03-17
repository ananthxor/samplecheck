-- Create public Supabase Storage bucket for creative preview HTML files.
-- Previews are uploaded at save/share time and served directly — no edge function needed.
-- To migrate to cdn.scrolltoday.com later: point VITE_CDN_BASE_URL to the CDN domain.
-- Storage path:  previews/{preview_token}.html
-- Storage URL:   {supabase_url}/storage/v1/object/public/previews/{token}.html
-- CDN URL later: cdn.scrolltoday.com/preview/{token}.html

INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'previews',
  'previews',
  true,
  ARRAY['text/html'],
  5242880 -- 5 MB max per preview file
)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read preview files (they are public, shareable previews)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public read access for previews' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Public read access for previews"
      ON storage.objects FOR SELECT TO public
      USING (bucket_id = 'previews');
  END IF;
END $$;

-- Authenticated users can upload / replace preview files
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated upload to previews' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Authenticated upload to previews"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'previews');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated update in previews' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Authenticated update in previews"
      ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'previews');
  END IF;
END $$;
