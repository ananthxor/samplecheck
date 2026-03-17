import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const displayShelfFormat: FormatDefinition = {
  type: 'desktop-leaderboard-display-shelf',
  name: 'Display Shelf',
  description: 'Display shelf is a simple animated format that displays the brand’s product details through animation that flips on and off continuously. It\'s a simple and informative way to attract users\' attention.',
  category: 'desktop',
  size: 'leaderboard',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
