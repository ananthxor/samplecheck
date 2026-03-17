import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const blackBoardFormat: FormatDefinition = {
  type: 'desktop-square-black-board',
  name: 'Black Board',
  description: 'Blackboard is an interactive ad format, which mimics the action of cleaning a chalk slate. It is perfect to show a Before & After scenario. Once the underlay image shows, the CTA button appears simultaneously, which leads the user to the LP.',
  category: 'desktop',
  size: 'square',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
