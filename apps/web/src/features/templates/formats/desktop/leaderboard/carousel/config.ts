import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const carouselFormat: FormatDefinition = {
  type: 'desktop-leaderboard-carousel',
  name: 'Carousel',
  description: 'Carousel is an intuitive, scrollable ad unit which engages users and nudges them to browse through collections with ease. The image slides automatically as well as users can also swipe manually. The image also has a CTA button that directs the user to the landing page.',
  category: 'desktop',
  size: 'leaderboard',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
