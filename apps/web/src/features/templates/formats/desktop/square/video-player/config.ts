import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const videoPlayerFormat: FormatDefinition = {
  type: 'desktop-square-video-player',
  name: 'Video Player',
  description: 'This is a video player which floats to the bottom left or right of the browser once the user opens it. This format combines video within the standard 300x250 ad unit, making it easier to implement with large inventory availability. You can either upload a video file or use a VAST tag for this unit.',
  category: 'desktop',
  size: 'square',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
