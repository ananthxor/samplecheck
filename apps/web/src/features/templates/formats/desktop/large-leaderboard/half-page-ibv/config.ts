import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const halfPageIbvFormat: FormatDefinition = {
  type: 'desktop-large-leaderboard-half-page-ibv',
  name: 'Half Page IBV',
  description: 'This is a half page banner where half the banner is an image and the other half is a video. Both elements size and position can be customized as required.',
  category: 'desktop',
  size: 'large-leaderboard',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
