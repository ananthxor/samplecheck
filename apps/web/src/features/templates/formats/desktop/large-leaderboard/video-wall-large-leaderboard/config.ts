import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const videoWallLargeLeaderboardFormat: FormatDefinition = {
  type: 'desktop-large-leaderboard-video-wall-large-leaderboard',
  name: 'Video Wall Large Leaderboard',
  description: 'This is a large leaderboard ad, which allows the advertiser to showcase a video within a banner. The video is placed in the middle of the background image and the dimensions of the video can be customised to fit seamlessly with the background image. On clicking anywhere on the banner, the user is redirected to the advertiser\'s landing page.',
  category: 'desktop',
  size: 'large-leaderboard',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
