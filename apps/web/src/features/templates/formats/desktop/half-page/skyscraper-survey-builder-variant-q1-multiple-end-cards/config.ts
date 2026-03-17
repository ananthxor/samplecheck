import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const skyscraperSurveyBuilderVariantQ1MultipleEndCardsFormat: FormatDefinition = {
  type: 'desktop-half-page-skyscraper-survey-builder-variant-q1-multiple-end-cards',
  name: 'Skyscraper Survey Builder - Variant Q1 & Multiple End Cards',
  description: 'Elevate your campaign with the Skyscraper Survey Builder - Variant Q1 & Multiple End Cards format. Designed for maximum engagement and seamless integration, this format ensures your brand story is told effectively across all devices.',
  category: 'desktop',
  size: 'half-page',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
