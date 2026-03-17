import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const countDownFormat: FormatDefinition = {
  type: 'desktop-leaderboard-count-down',
  name: 'Count Down',
  description: 'Countdown Leaderboard is an animated ad which invokes excitement amongst the users by giving a sense of urgency. It is ideal for brands who are advertising for Flash sales and limited Offers. The timer is added on a background image of 728x90. The countdown is calculated based on the time and date entered by the advertiser in the Studio.',
  category: 'desktop',
  size: 'leaderboard',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
