import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const spinner180Format: FormatDefinition = {
  type: 'desktop-leaderboard-180-spinner',
  name: '180 Spinner',
  description: '180 spinner is a desktop ad format that features 3D 180 degree spin showcasing 2 images. The format is simple, intuitive and captivates the user to engage with the ad.',
  category: 'desktop',
  size: 'leaderboard',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
