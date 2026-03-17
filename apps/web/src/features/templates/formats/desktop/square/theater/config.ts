import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const theaterFormat: FormatDefinition = {
  type: 'desktop-square-theater',
  name: 'Theater',
  description: 'Theater is a combination of static and animated images. Where the first image is static and has a CTA urging the user to explore the series of images, where ‘n’ number of images slide showcasing different products/features. This transition is automatic as well as manual, giving the user control over the creative.',
  category: 'desktop',
  size: 'square',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
