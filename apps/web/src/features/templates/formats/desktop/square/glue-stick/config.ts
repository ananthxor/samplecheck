import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const glueStickFormat: FormatDefinition = {
  type: 'desktop-square-glue-stick',
  name: 'Glue Stick',
  description: 'Glue Stick is a simple swipe format using parallax. It uses a technique where the background content or an image is moved at a different speed than the foreground content while scrolling creating an unique effect and allowing the advertiser to view the product in differen scenarios.',
  category: 'desktop',
  size: 'square',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
