import { useCallback } from 'react'
import { Download } from 'lucide-react'
import { useGenerateImage } from 'recharts-to-png'
import { Button } from '@/components/ui/button'

interface ChartDownloadButtonProps {
  chartRef: React.RefObject<HTMLDivElement>
  filename: string
  disabled?: boolean
}

/**
 * Download a chart as a PNG image.
 * Wraps useGenerateImage from recharts-to-png with backgroundColor: '#ffffff'
 * to prevent the common black PNG background issue.
 */
export function ChartDownloadButton({
  chartRef,
  filename,
  disabled,
}: ChartDownloadButtonProps) {
  const [getDomImage, { isLoading, ref: internalRef }] =
    useGenerateImage<HTMLDivElement>({
      quality: 0.92,
      type: 'image/png',
      options: { backgroundColor: '#ffffff' } as any,
    })

  const handleDownload = useCallback(async () => {
    // Sync the internal ref to point at the external chartRef's element
    if (chartRef.current) {
      ;(internalRef as React.MutableRefObject<HTMLDivElement | null>).current =
        chartRef.current
    }

    const dataUrl = await getDomImage()
    if (dataUrl) {
      const anchor = document.createElement('a')
      anchor.href = dataUrl
      anchor.download = `${filename}.png`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
    }
  }, [chartRef, getDomImage, internalRef, filename])

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={isLoading || disabled}
    >
      <Download className="mr-1.5 size-4" />
      {isLoading ? 'Generating...' : 'PNG'}
    </Button>
  )
}
