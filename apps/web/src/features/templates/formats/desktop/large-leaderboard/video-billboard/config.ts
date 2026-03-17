import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const videoBillboardFormat: FormatDefinition = {
  type: 'desktop-large-leaderboard-video-billboard',
  name: 'Video Billboard',
  description: 'Taking advantage of the real estate a Billboard banner offers, we have developed an ad experience with multiple elements. The static image ensures the brand presence at all times, the video could showcase the product features. This banner is a clean representation of a static banner and video can be merged.',
  category: 'desktop',
  size: 'large-leaderboard',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
