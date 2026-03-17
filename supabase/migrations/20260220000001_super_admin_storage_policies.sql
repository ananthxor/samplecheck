-- =============================================================================
-- Super Admin Storage Policies
-- =============================================================================
-- Adds super admin override policies for storage operations.
-- Super admins can upload/update/delete files in any advertiser folder.
-- =============================================================================

-- Super admins can upload to any folder
CREATE POLICY "Super admin can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'creative-assets'
  AND (SELECT public.is_super_admin())
);

-- Super admins can update any files
CREATE POLICY "Super admin can update files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'creative-assets'
  AND (SELECT public.is_super_admin())
);

-- Super admins can delete any files
CREATE POLICY "Super admin can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'creative-assets'
  AND (SELECT public.is_super_admin())
);
