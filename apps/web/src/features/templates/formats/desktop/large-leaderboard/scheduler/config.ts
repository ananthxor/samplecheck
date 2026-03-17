import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const schedulerFormat: FormatDefinition = {
  type: 'desktop-large-leaderboard-scheduler',
  name: 'Scheduler',
  description: 'Scheduler as the name suggests, works as a programmatic schedule of image display by uploading the intended images and its showcase timing. The image will be displayed according to the time input given by the advertiser. The advertiser has the option of displaying certain images during a pre-decided timeframe.',
  category: 'desktop',
  size: 'large-leaderboard',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
