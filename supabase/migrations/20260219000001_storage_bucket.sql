-- =============================================================================
-- ScrollToday: Storage Bucket Setup
-- =============================================================================
-- Creates the creative-assets bucket for ad creative file storage
-- Public read access, authenticated upload to advertiser-scoped folders
-- =============================================================================

-- Create public bucket for creative assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'creative-assets',
  'creative-assets',
  true,
  52428800,  -- 50MB limit
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'application/javascript',
    'text/html',
    'text/css'
  ]
);

-- =============================================================================
-- STORAGE RLS POLICIES
-- =============================================================================

-- Authenticated users can upload to their own advertiser folder
-- Folder structure: creative-assets/<advertiser_id>/<filename>
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'creative-assets'
  AND (storage.foldername(name))[1] = (SELECT public.get_user_advertiser_id())::text
);

-- Public read access (bucket is marked public)
CREATE POLICY "Public read access for creative assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'creative-assets');

-- Authenticated users can update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'creative-assets'
  AND (storage.foldername(name))[1] = (SELECT public.get_user_advertiser_id())::text
);

-- Authenticated users can delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'creative-assets'
  AND (storage.foldername(name))[1] = (SELECT public.get_user_advertiser_id())::text
);
