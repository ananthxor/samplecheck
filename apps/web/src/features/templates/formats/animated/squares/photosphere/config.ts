import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const photosphereFormat: FormatDefinition = {
  type: 'animated-squares-photosphere',
  name: 'Photosphere',
  description: 'Interactive photosphere format that places the viewer inside a 360° image environment. Touch and gyroscope navigation let users look around freely, creating an immersive showcase perfect for hotels, venues, and real-estate walkthroughs.',
  category: 'animated',
  size: 'squares',
  fields: [
  { id: 'photo_src', label: 'Photosphere File (360° Image)', type: 'video', default: '' },
  { id: 'headline', label: 'Overlay Headline', type: 'text', default: '' },
  { id: 'headline_color', label: 'Headline Text Color', type: 'color', default: '' },
  { id: 'headline_bg', label: 'Headline Text Background Color', type: 'color', default: '' },
  { id: 'cta_text', label: 'CTA Button Text', type: 'text', default: '' },
  { id: 'cta_url', label: 'CTA Landing Page URL', type: 'url', default: '' },
  ],
  templates: [],
}
