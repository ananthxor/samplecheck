import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const shakeToRevealFormat: FormatDefinition = {
  type: 'interactive-responsive-shake-to-reveal',
  name: 'Shake To Reveal',
  description: 'Create a moment of surprise and delight.',
  category: 'interactive',
  size: 'responsive',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
