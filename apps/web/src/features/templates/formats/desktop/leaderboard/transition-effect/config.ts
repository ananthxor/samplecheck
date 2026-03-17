import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const transitionEffectFormat: FormatDefinition = {
  type: 'desktop-leaderboard-transition-effect',
  name: 'Transition Effect',
  description: 'Transition Effect ad format is a nice way to stylize the content. Slide transitions can make content understandable, engaging and professional-looking. It offers several choice of transitions among which a style can be selected to apply to the images.',
  category: 'desktop',
  size: 'leaderboard',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
