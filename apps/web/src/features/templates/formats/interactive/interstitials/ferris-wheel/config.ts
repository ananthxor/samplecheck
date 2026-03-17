import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const ferrisWheelFormat: FormatDefinition = {
  type: 'interactive-interstitials-ferris-wheel',
  name: 'Ferris Wheel',
  description: 'A visually striking carousel variant where products rotate in a circular \'Ferris Wheel\' motion. This high-impact format is exceptional for showing off a seasonal collection or a variety of product colors. It captures attention through its unique mechanical motion and invites users to spin and explore.',
  category: 'interactive',
  size: 'interstitials',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
