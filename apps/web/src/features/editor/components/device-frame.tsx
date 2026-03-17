import { cn } from '@/lib/utils'

interface DeviceFrameProps {
  deviceMode: 'desktop' | 'mobile'
  children: React.ReactNode
  width?: number
  height?: number
}

/**
 * Wrapper that provides desktop/mobile visual context around the preview iframe.
 * Desktop: full-width container with subtle border.
 * Mobile: centered 375px-wide container with phone-frame appearance.
 */
export function DeviceFrame({
  deviceMode,
  children,
  width,
  height,
}: DeviceFrameProps) {
  if (deviceMode === 'mobile') {
    return (
      <div className="flex items-start justify-center p-6">
        <div
          className={cn(
            'relative overflow-hidden rounded-[2rem] border-[3px] border-gray-800',
            'bg-gray-900 p-2 shadow-xl'
          )}
          style={{ width: 375 + 6 }}
        >
          <div
            className="overflow-hidden rounded-[1.5rem] bg-white"
            style={
              width && height
                ? {
                    maxWidth: width,
                    aspectRatio: `${width} / ${height}`,
                  }
                : undefined
            }
          >
            {children}
          </div>
          {/* Home indicator */}
          <div className="mx-auto mt-1 h-1 w-24 rounded-full bg-gray-600" />
        </div>
      </div>
    )
  }

  // Desktop mode
  return (
    <div className="flex items-start justify-center p-6">
      <div
        className="overflow-hidden rounded-lg border border-border bg-white shadow-sm"
        style={
          width && height
            ? {
                maxWidth: width,
                aspectRatio: `${width} / ${height}`,
                width: '100%',
              }
            : { width: '100%', maxWidth: 970 }
        }
      >
        {children}
      </div>
    </div>
  )
}
