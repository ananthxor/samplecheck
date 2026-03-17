import { useRef } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useImageUpload } from '../hooks/use-image-upload'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  creativeId: string
  label?: string
}

/**
 * Image upload component with preview, clear button, and loading state.
 * Uses the useImageUpload hook for Supabase Storage uploads.
 */
export function ImageUpload({
  value,
  onChange,
  creativeId,
  label,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadImage, isUploading, error } = useImageUpload()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const result = await uploadImage(file, creativeId)
    if (result) {
      onChange(result.url)
    }

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-sm font-medium leading-none">{label}</p>
      )}

      {value ? (
        <div className="relative">
          <img
            src={value}
            alt="Uploaded"
            className="h-32 w-full rounded-md border object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon-xs"
            className="absolute right-1 top-1"
            onClick={() => onChange('')}
          >
            <X />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <>
              <Loader2 className="animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload />
              Upload Image
            </>
          )}
        </Button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => void handleFileChange(e)}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
