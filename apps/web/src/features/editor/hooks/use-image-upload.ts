import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { STORAGE_BUCKET } from '@scrolltoday/shared'

interface ImageUploadResult {
  url: string
  path: string
}

interface UseImageUpload {
  uploadImage: (
    file: File,
    creativeId: string
  ) => Promise<ImageUploadResult | null>
  isUploading: boolean
  error: string | null
}

/**
 * Hook for uploading images to Supabase Storage creative-assets bucket.
 * Generates a unique path scoped to the advertiser and creative.
 */
export function useImageUpload(): UseImageUpload {
  const { profile } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadImage = useCallback(
    async (
      file: File,
      creativeId: string
    ): Promise<ImageUploadResult | null> => {
      setError(null)

      if (!profile?.advertiser_id) {
        setError('No advertiser account found. Cannot upload images.')
        return null
      }

      setIsUploading(true)

      try {
        const ext = file.name.split('.').pop() || 'png'
        const filePath = `${profile.advertiser_id}/${creativeId}/${crypto.randomUUID()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, file, {
            cacheControl: '31536000',
            upsert: false,
          })

        if (uploadError) {
          setError(uploadError.message)
          return null
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)

        return { url: publicUrl, path: filePath }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Upload failed'
        setError(message)
        return null
      } finally {
        setIsUploading(false)
      }
    },
    [profile?.advertiser_id]
  )

  return { uploadImage, isUploading, error }
}
