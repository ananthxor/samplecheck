import type { FormatDefinition } from '../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const largeLeaderboard728x300Format: FormatDefinition = {
  type: 'standard-banners-large-leaderboard-728x300',
  name: 'Large Leaderboard',
  description: 'Elevate your campaign with the Large Leaderboard format. Designed for maximum engagement and seamless integration, this format ensures your brand story is told effectively across all devices.',
  category: 'standard-banners',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
