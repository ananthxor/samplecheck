import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const video360Format: FormatDefinition = {
  type: 'interactive-responsive-360-video',
  name: '360 Video',
  description: 'Offer a fully immersive 360-degree environment.',
  category: 'interactive',
  size: 'responsive',
  fields: [
  { id: 'env_vid', label: 'Environment Video', type: 'video', default: '' },
  ],
  templates: [],
}
