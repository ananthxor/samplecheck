import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const carousel300x250Format: FormatDefinition = {
  type: 'desktop-square-carousel-300x250',
  name: 'Carousel',
  description: 'This is a multi-slide carousel square unit. Each slide can have a unique product image, text description and click-through URL. The background colour of the slides can also be set while setting up the creative.',
  category: 'desktop',
  size: 'square',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
