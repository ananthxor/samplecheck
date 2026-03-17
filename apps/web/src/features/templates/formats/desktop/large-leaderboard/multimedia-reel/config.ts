import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const multimediaReelFormat: FormatDefinition = {
  type: 'desktop-large-leaderboard-multimedia-reel',
  name: 'Multimedia Reel',
  description: 'This is a multi-image Large Leaderboard ad unit that allows the advertisers to showcase different products redirecting the user to unique Landing Pages. The animation styles can be chosen by the advertiser when setting up the creative.',
  category: 'desktop',
  size: 'large-leaderboard',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
