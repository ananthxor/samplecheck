import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const surveyBuilderWithBranchingV2Halfpage300x600Format: FormatDefinition = {
  type: 'desktop-half-page-survey-builder-with-branching-v2-halfpage-300x600',
  name: 'Survey Builder with Branching V2 - Halfpage',
  description: 'Elevate your campaign with the Survey Builder with Branching V2 - Halfpage format. Designed for maximum engagement and seamless integration, this format ensures your brand story is told effectively across all devices.',
  category: 'desktop',
  size: 'half-page',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
