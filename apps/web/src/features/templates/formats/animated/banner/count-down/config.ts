import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const countDownFormat: FormatDefinition = {
  type: 'animated-banner-count-down',
  name: 'Count Down',
  description: 'Full-screen countdown banner with a background image, animated timer, and configurable timezone to drive urgency. Perfect for flash sales, limited-time offers, and event promotions where a ticking clock motivates immediate action.',
  category: 'animated',
  size: 'banner',
  fields: [
  { id: 'bg_image', label: 'Background Image', type: 'image', default: '' },
  { id: 'headline', label: 'Headline', type: 'text', default: '' },
  { id: 'headline_color', label: 'Headline Text Color', type: 'color', default: '' },
  { id: 'headline_bg', label: 'Headline Text Background Color', type: 'color', default: '' },
  { id: 'countdown_date', label: 'Countdown Target Date', type: 'date', default: '' },
  { id: 'countdown_tz', label: 'Timezone', type: 'select', default: '', validation: { options: [{"value":"UTC","label":"UTC"},{"value":"America/New_York","label":"Eastern (ET)"},{"value":"America/Chicago","label":"Central (CT)"},{"value":"America/Denver","label":"Mountain (MT)"},{"value":"America/Los_Angeles","label":"Pacific (PT)"},{"value":"Europe/London","label":"London (GMT)"},{"value":"Europe/Paris","label":"Paris (CET)"},{"value":"Asia/Tokyo","label":"Tokyo (JST)"},{"value":"Asia/Kolkata","label":"India (IST)"},{"value":"Australia/Sydney","label":"Sydney (AEST)"}] } },
  { id: 'cta_text', label: 'CTA Button Text', type: 'text', default: '' },
  { id: 'cta_url', label: 'CTA Landing Page URL', type: 'url', default: '' },
  ],
  templates: [],
}
