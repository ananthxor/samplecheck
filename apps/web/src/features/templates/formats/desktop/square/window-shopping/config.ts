import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const windowShoppingFormat: FormatDefinition = {
  type: 'desktop-square-window-shopping',
  name: 'Window Shopping',
  description: 'Window shopping is an interactive as well as automated ad, where the advertiser can put \'n\' no. of slides. The individual slides can showcase different product/features and each slide can be assigned a unique redirect URL.',
  category: 'desktop',
  size: 'square',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
