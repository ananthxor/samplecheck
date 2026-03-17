import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const surveyBuilderWithBranchingMultipleEndCardFormat: FormatDefinition = {
  type: 'interactive-interstitials-survey-builder-with-branching-multiple-end-card',
  name: 'Survey Builder with Branching - Multiple End Card',
  description: 'Elevate your campaign with the Survey Builder with Branching - Multiple End Card format. Designed for maximum engagement and seamless integration, this format ensures your brand story is told effectively across all devices.',
  category: 'interactive',
  size: 'interstitials',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
