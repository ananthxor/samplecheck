import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const rippleFormat: FormatDefinition = {
  type: 'desktop-half-page-ripple',
  name: 'Ripple',
  description: 'Elevate your campaign with the Ripple format. Designed for maximum engagement and seamless integration, this format ensures your brand story is told effectively across all devices.',
  category: 'desktop',
  size: 'half-page',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
