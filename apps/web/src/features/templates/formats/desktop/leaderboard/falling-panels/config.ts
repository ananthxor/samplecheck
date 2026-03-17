import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const fallingPanelsFormat: FormatDefinition = {
  type: 'desktop-leaderboard-falling-panels',
  name: 'Falling Panels',
  description: 'Falling Panels is a very simple and intuitive ad format. It consists of 2 images that have falling and bouncing effects and are displayed one over the other. This simple animation encourages the users to check out the required website by clicking on the images.',
  category: 'desktop',
  size: 'leaderboard',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
