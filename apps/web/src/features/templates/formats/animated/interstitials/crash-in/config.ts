import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const crashInFormat: FormatDefinition = {
  type: 'animated-interstitials-crash-in',
  name: 'Crash In',
  description: 'Full-screen interstitial where graphic and text content crashes forcefully onto a background image for high-impact delivery. The dramatic crash animation demands instant attention, perfect for bold product drops and action-oriented campaigns.',
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
