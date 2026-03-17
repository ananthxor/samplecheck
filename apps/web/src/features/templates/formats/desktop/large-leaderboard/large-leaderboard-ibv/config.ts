import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const largeLeaderboardIbvFormat: FormatDefinition = {
  type: 'desktop-large-leaderboard-large-leaderboard-ibv',
  name: 'Large Leaderboard IBV',
  description: 'This is a large leaderboard banner where half the banner is an image and the other half is a video. Both elements size and position can be customized as required.',
  category: 'desktop',
  size: 'large-leaderboard',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
