import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const swipeToLikeFormat: FormatDefinition = {
  type: 'interactive-interstitials-swipe-to-like',
  name: 'Swipe to Like',
  description: 'Borrowing from popular social mechanics, this format lets users swipe left or right on products to express interest. It provides brands with invaluable preference data in a fun, frictionless way. Perfect for fashion, food, or any category where personal taste drives the purchase decision.',
  category: 'interactive',
  size: 'interstitials',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
