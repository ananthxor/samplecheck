import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const autoplayInBannerVideo300x250Format: FormatDefinition = {
  type: 'desktop-square-autoplay-in-banner-video-300x250',
  name: 'Autoplay In Banner Video',
  description: 'This is an IBV ad unit where the video will lie on a background image. The position and size of the video can be customized.',
  category: 'desktop',
  size: 'square',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
