import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const catalogFormat: FormatDefinition = {
  type: 'desktop-leaderboard-catalog',
  name: 'Catalog',
  description: 'Catalog ad format lets you showcase your product in a square catalog format. Upon clicking on a product a separate pop-up window opens showing more details of the product. Each product can be linked to their respective page on the brand\'s website.',
  category: 'desktop',
  size: 'leaderboard',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
