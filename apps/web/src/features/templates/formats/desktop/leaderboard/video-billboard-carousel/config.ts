import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const videoBillboardCarouselFormat: FormatDefinition = {
  type: 'desktop-leaderboard-video-billboard-carousel',
  name: 'Video Billboard Carousel',
  description: 'The Video Billboard Carousel allows any advertiser to showcase up to 10 videos in a single Native Ad unit. Each video is displayed along with a Description. The big banner size allows for a thumbnail of the upcoming video and description to be showcased when viewing a video. The user can control and toggle between the videos as they wish. Each video has a unique CTA URL.',
  category: 'desktop',
  size: 'leaderboard',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
