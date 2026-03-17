import { useCallback, useEffect, useRef, useState } from 'react'
import type { TemplateConfig } from '@/features/templates/formats/registry'
import { generatePreviewHtml } from '../lib/renderer'
import { sendConfigUpdate } from '../lib/preview-message'
import { DeviceFrame } from './device-frame'

interface EditorPreviewProps {
  config: TemplateConfig
  deviceMode: 'desktop' | 'mobile'
  width?: number
  height?: number
}

/**
 * Right panel of the editor showing the live iframe preview.
 * Uses srcdoc for initial render, then postMessage for incremental updates.
 *
 * Two-channel update strategy:
 *  1. srcdoc   — full re-render when format type changes (different renderer JS)
 *  2. postMessage — incremental updates on every config change, debounced 150ms
 *
 * Race-condition fix: on iframe load we also push the current config via
 * postMessage. This covers the case where the debounced postMessage fires
 * before the iframe's message listener is registered (srcdoc takes time to
 * parse and execute), ensuring the preview always reflects the latest config.
 */
export function EditorPreview({
  config,
  deviceMode,
  width,
  height,
}: EditorPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  // Keep a ref so onLoad always sends the latest config without stale closure
  const configRef = useRef(config)
  const [initialHtml, setInitialHtml] = useState(() =>
    generatePreviewHtml(config)
  )
  const configTypeRef = useRef(config.type)

  // Keep configRef in sync on every render
  useEffect(() => {
    configRef.current = config
  }, [config])

  // Regenerate full HTML when format type changes (different renderer needed)
  useEffect(() => {
    if (config.type !== configTypeRef.current) {
      configTypeRef.current = config.type
      setInitialHtml(generatePreviewHtml(config))
    }
  }, [config])

  // Send incremental updates via postMessage with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (iframeRef.current) {
        sendConfigUpdate(iframeRef.current, config)
      }
    }, 150)

    return () => clearTimeout(timer)
  }, [config])

  // On iframe load: send current config so the preview is correct even if the
  // debounced postMessage fired before the iframe's listener was registered.
  const handleIframeLoad = useCallback(() => {
    if (iframeRef.current) {
      sendConfigUpdate(iframeRef.current, configRef.current)
    }
  }, [])

  return (
    <div className="flex h-full min-w-0 flex-col overflow-auto bg-muted/30">
      <DeviceFrame deviceMode={deviceMode} width={width} height={height}>
        <iframe
          ref={iframeRef}
          srcDoc={initialHtml}
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
          allow="autoplay"
          title="Creative preview"
          className="block border-0"
          onLoad={handleIframeLoad}
          style={{
            width: width || '100%',
            height: height || 400,
          }}
        />
      </DeviceFrame>
    </div>
  )
}
