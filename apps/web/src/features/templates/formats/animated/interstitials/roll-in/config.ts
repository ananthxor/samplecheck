import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const rollInFormat: FormatDefinition = {
  type: 'animated-interstitials-roll-in',
  name: 'Roll In',
  description: 'Full-screen interstitial with a background image onto which graphic and text content rolls in to complete the message. The smooth rolling animation creates an elegant reveal, well suited for lifestyle brands, travel, and aspirational campaigns.',
  category: 'animated',
  size: 'interstitials',
  fields: [
  { id: 'bg_image', label: 'Background Image', type: 'image', default: '' },
  { id: 'headline', label: 'Headline', type: 'text', default: '' },
  { id: 'headline_color', label: 'Headline Text Color', type: 'color', default: '' },
  { id: 'headline_bg', label: 'Headline Text Background Color', type: 'color', default: '' },
  { id: 'body_text', label: 'Body Text', type: 'text', default: '' },
  { id: 'body_text_color', label: 'Body Text Color', type: 'color', default: '' },
  { id: 'body_text_bg', label: 'Body Text Background Color', type: 'color', default: '' },
  { id: 'cta_text', label: 'CTA Button Text', type: 'text', default: '' },
  { id: 'cta_url', label: 'CTA Landing Page URL', type: 'url', default: '' },
  ],
  templates: [],
}
