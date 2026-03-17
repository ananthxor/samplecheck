import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const inceptionFormat: FormatDefinition = {
  type: 'desktop-square-inception',
  name: 'Inception',
  description: 'Inception is a simple animated format. It has 2 images in which the overlay image breaks into two. Both the clipped parts of the image scale up and move out of the screen and back creating an inception effect',
  category: 'desktop',
  size: 'square',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
