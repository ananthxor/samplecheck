import type { FormatDefinition } from '../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const miniscrollerInterscrollerWithoutVideoFormat: FormatDefinition = {
  type: 'native-miniscroller-interscroller-without-video',
  name: 'Miniscroller/Interscroller - Without Video',
  description: 'Elevate your campaign with the Miniscroller/Interscroller - Without Video format. Designed for maximum engagement and seamless integration, this format ensures your brand story is told effectively across all devices.',
  category: 'native',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
