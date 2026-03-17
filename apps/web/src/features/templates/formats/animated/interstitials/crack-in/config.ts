import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const crackInFormat: FormatDefinition = {
  type: 'animated-interstitials-crack-in',
  name: 'Crack In',
  description: 'Full-screen interstitial where the background image cracks open to reveal graphic and text content beneath. The dramatic crack-and-reveal effect builds suspense, making it ideal for teasers, game launches, and cinematic product reveals.',
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
