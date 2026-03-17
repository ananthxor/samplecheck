import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const exhibitionAudioCardsFormat: FormatDefinition = {
  type: 'desktop-large-leaderboard-exhibition-audio-cards',
  name: 'Exhibition - Audio Cards',
  description: 'Core Messaging is an intuitive ad unit which engages users and nudges them to browse through collections with ease. The image slides automatically as well as users can also swipe manually. The image also has a CTA button that directs the user to the landing page.',
  category: 'desktop',
  size: 'large-leaderboard',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
