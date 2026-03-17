import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const leaderBoardHotspotFormat: FormatDefinition = {
  type: 'desktop-leaderboard-leader-board-hotspot',
  name: 'Leader Board Hotspot',
  description: 'Presenting to you a new and trendy way of showcasing products and their details. Each product in the ad image will have a hotspot. On tapping the product hotspot, a small pop-up appears with the details, which will in turn lead to the respective page on your website.',
  category: 'desktop',
  size: 'leaderboard',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
