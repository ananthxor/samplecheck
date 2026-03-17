import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const video360Format: FormatDefinition = {
  type: 'animated-squares-360-video',
  name: '360 Video',
  description: 'Immersive square format featuring a 360° video that users can explore in all directions. Gyroscope and touch-driven navigation puts the viewer in control, ideal for virtual tours, destination marketing, and experiential brand campaigns.',
  category: 'animated',
  size: 'squares',
  fields: [
  { id: 'video_src', label: '360° Video File', type: 'video', default: '' },
  { id: 'headline', label: 'Overlay Headline', type: 'text', default: '' },
  { id: 'headline_color', label: 'Headline Text Color', type: 'color', default: '' },
  { id: 'headline_bg', label: 'Headline Text Background Color', type: 'color', default: '' },
  { id: 'cta_text', label: 'CTA Button Text', type: 'text', default: '' },
  { id: 'cta_url', label: 'CTA Landing Page URL', type: 'url', default: '' },
  ],
  templates: [],
}
