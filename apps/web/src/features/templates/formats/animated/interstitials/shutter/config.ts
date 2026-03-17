import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const shutterFormat: FormatDefinition = {
  type: 'animated-interstitials-shutter',
  name: 'Shutter',
  description: 'Full-screen interstitial that uses a shutter-style animation to unveil graphic and text content over a background image. The cinematic shutter reveal adds a sense of drama and sophistication, ideal for fashion drops and beauty launches.',
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
