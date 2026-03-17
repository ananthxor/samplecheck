import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const videoWallLeaderboardFormat: FormatDefinition = {
  type: 'desktop-leaderboard-video-wall-leaderboard',
  name: 'Video Wall Leaderboard',
  description: 'This is a leaderboard ad, which allows the advertiser to showcase a video within a banner. The video is placed in the middle of the background image and the dimensions of the video can be customised to fit seamlessly with the background image. On clicking anywhere on the banner, the user is redirected to the advertiser\'s landing page.',
  category: 'desktop',
  size: 'leaderboard',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
