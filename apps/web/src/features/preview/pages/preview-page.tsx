import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { fetchCreativeByToken } from '@/features/creatives/api/creatives-api'
import { generatePreviewHtml } from '@/features/editor/lib/renderer'
import type { TemplateConfig } from '@/features/templates/formats/registry'

/** Returns a CSS scale factor so the ad fits within the viewport with padding. */
function useAdScale(adWidth: number) {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    function update() {
      setScale(Math.min(1, (window.innerWidth - 32) / adWidth))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [adWidth])
  return scale
}

export default function PreviewPage() {
  const { token } = useParams<{ token: string }>()

  const {
    data: creative,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['preview', token],
    queryFn: () => fetchCreativeByToken(token!),
    enabled: !!token,
  })

  const width  = creative?.width  ?? 300
  const height = creative?.height ?? 250
  const scale  = useAdScale(width)

  // Missing token
  if (!token) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900">Invalid Preview Link</h1>
          <p className="mt-2 text-sm text-gray-500">No preview token was provided.</p>
        </div>
      </div>
    )
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <Loader2 className="size-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // Error or not found
  if (error || !creative) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900">Preview not found</h1>
          <p className="mt-2 text-sm text-gray-500">
            This preview link may be invalid or expired.
          </p>
        </div>
      </div>
    )
  }

  const config: TemplateConfig = {
    ...(creative.template_data as unknown as TemplateConfig),
    id: creative.id,
    advertiserId: creative.advertiser_id,
    campaignId: creative.campaign_id ?? undefined,
    requestId: crypto.randomUUID(),
  }
  const previewHtml = generatePreviewHtml(config)

  // Outer box is sized to the VISUAL dimensions after scaling, so nothing
  // overflows and the footer sits correctly below the ad.
  const visualWidth  = width  * scale
  const visualHeight = height * scale

  return (
    <div className="flex min-h-screen w-screen flex-col items-center justify-center bg-gray-50 py-8">
      {/* Outer box occupies exactly the visual space the scaled ad needs */}
      <div style={{ width: visualWidth, height: visualHeight }}>
        {/* Inner ad at native IAB dimensions, scaled with CSS transform */}
        <div
          className="overflow-hidden rounded-lg border bg-white shadow-sm"
          style={{
            width,
            height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <iframe
            srcDoc={previewHtml}
            title={creative.name}
            className="h-full w-full border-0"
            sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
            allow="autoplay"
          />
        </div>
      </div>

      {/* Subtle footer */}
      <p className="mt-6 text-xs text-gray-400">
        Powered by{' '}
        <a
          href="/"
          className="underline underline-offset-2 hover:text-gray-500"
          target="_blank"
          rel="noopener noreferrer"
        >
          ScrollToday
        </a>
      </p>
    </div>
  )
}
