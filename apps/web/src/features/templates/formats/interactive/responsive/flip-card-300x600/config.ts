import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const flipCard300x600Format: FormatDefinition = {
  type: 'interactive-responsive-flip-card-300x600',
  name: 'Flip Card',
  description: 'An interactive 3D card with tilt-on-hover and click-to-flip reveal. Perfect for before/after reveals, exclusive offers, and interactive brand storytelling.',
  category: 'interactive',
  size: 'responsive',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
