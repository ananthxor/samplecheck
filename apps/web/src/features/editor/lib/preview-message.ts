import type { TemplateConfig } from '@/features/templates/formats/registry'

// ---------------------------------------------------------------------------
// postMessage protocol between editor and iframe preview
// ---------------------------------------------------------------------------

export type PreviewMessage = {
  type: 'CONFIG_UPDATE'
  payload: TemplateConfig
}

/**
 * Sends a CONFIG_UPDATE message to the iframe preview.
 * The iframe's embedded script listens for this event and re-renders.
 */
export function sendConfigUpdate(
  iframe: HTMLIFrameElement,
  config: TemplateConfig
): void {
  iframe.contentWindow?.postMessage(
    { type: 'CONFIG_UPDATE', payload: config } satisfies PreviewMessage,
    '*'
  )
}
