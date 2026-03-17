import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const inlineResponsiveBannerVideoFormat: FormatDefinition = {
  type: 'desktop-desktop-native-inline-responsive-banner-video',
  name: 'Inline Responsive Banner + Video',
  description: 'Elevate your campaign with the Inline Responsive Banner + Video format. Designed for maximum engagement and seamless integration, this format ensures your brand story is told effectively across all devices.',
  category: 'desktop',
  size: 'desktop-native',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
