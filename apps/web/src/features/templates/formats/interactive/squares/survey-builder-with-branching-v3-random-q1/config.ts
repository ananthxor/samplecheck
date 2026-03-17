import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const surveyBuilderWithBranchingV3RandomQ1Format: FormatDefinition = {
  type: 'interactive-squares-survey-builder-with-branching-v3-random-q1',
  name: 'Survey Builder with Branching V3 - Random Q1',
  description: 'Elevate your campaign with the Survey Builder with Branching V3 - Random Q1 format. Designed for maximum engagement and seamless integration, this format ensures your brand story is told effectively across all devices.',
  category: 'interactive',
  size: 'squares',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
