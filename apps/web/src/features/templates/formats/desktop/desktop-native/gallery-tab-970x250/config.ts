import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const galleryTab970x250Format: FormatDefinition = {
  type: 'desktop-desktop-native-gallery-tab-970x250',
  name: 'Gallery Tab',
  description: 'Elevate your campaign with the Gallery Tab format. Designed for maximum engagement and seamless integration, this format ensures your brand story is told effectively across all devices.',
  category: 'desktop',
  size: 'desktop-native',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
