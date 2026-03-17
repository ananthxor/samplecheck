import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const lightboxCatalogFormat: FormatDefinition = {
  type: 'desktop-square-lightbox-catalog',
  name: 'Lightbox Catalog',
  description: 'Lightbox creative which expands from a square creative to one that takes over your screen. The expanded version of this creative is a Catalog ad, which allows advertisers to showcase up to four products and their respective descriptions. Each product can be redirected to unique landing pages. This expandable unit can be executed on both mobile and desktop where the base creative is a square size.',
  category: 'desktop',
  size: 'square',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
