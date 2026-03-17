import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const snowFormat: FormatDefinition = {
  type: 'animated-interstitials-snow',
  name: 'Snow',
  description: 'Full-screen interstitial where content drifts in over a background image with a gentle snow-fall animation effect. The calm, wintry ambiance sets the mood for seasonal retail, holiday gift guides, and end-of-year promotional campaigns.',
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
