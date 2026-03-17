import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const shakeToRevealFormat: FormatDefinition = {
  type: 'interactive-banner-shake-to-reveal',
  name: 'Shake To Reveal',
  description: 'Elevate your campaign with the Shake To Reveal format. Designed for maximum engagement and seamless integration, this format ensures your brand story is told effectively across all devices.',
  category: 'interactive',
  size: 'banner',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
