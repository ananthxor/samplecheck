import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const featureCardsLeaderboardFormat: FormatDefinition = {
  type: 'desktop-large-leaderboard-feature-cards-leaderboard',
  name: 'Feature Cards Leaderboard',
  description: 'Showcase multiple products or offerings as a multi-card ad unit. The number of cards can be customized and each card has a unique click-through URL.',
  category: 'desktop',
  size: 'large-leaderboard',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
