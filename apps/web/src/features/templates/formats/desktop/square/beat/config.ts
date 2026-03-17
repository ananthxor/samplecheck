import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const beatFormat: FormatDefinition = {
  type: 'desktop-square-beat',
  name: 'Beat',
  description: 'Beat is a simple yet graceful ad creative. The logo/shake image on the overlay will be in a continuous shake mode. Upon hover the image starts to shake vigorously making it conspicuous and on clicking it, exhibits the underlay image.',
  category: 'desktop',
  size: 'square',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
