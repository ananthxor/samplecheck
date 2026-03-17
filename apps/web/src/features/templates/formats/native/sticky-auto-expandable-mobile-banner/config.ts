import type { FormatDefinition } from '../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const stickyAutoExpandableMobileBannerFormat: FormatDefinition = {
  type: 'native-sticky-auto-expandable-mobile-banner',
  name: 'Sticky Auto Expandable Mobile Banner',
  description: 'Elevate your campaign with the Sticky Auto Expandable Mobile Banner format. Designed for maximum engagement and seamless integration, this format ensures your brand story is told effectively across all devices.',
  category: 'native',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
