import type { FormatDefinition } from '../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const addToCalendar320x480Format: FormatDefinition = {
  type: 'standard-banners-add-to-calendar-320x480',
  name: 'Add To Calendar',
  description: 'Elevate your campaign with the Add To Calendar format. Designed for maximum engagement and seamless integration, this format ensures your brand story is told effectively across all devices.',
  category: 'standard-banners',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
