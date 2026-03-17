import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const rippleFormat: FormatDefinition = {
  type: 'desktop-leaderboard-ripple',
  name: 'Ripple',
  description: 'Ripple ad-format has an effect of ripples expanding across the water when an object is dropped into it, giving the illusion of underwater effect. It also creates a water ripple animation following the mouse cursor on the product image. Combining animation as well as interaction, this format is bound to grab users’ attention.',
  category: 'desktop',
  size: 'leaderboard',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
