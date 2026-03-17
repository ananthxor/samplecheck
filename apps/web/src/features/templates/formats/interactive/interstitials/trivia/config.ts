import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const triviaFormat: FormatDefinition = {
  type: 'interactive-interstitials-trivia',
  name: 'Trivia',
  description: 'Test your audience\'s knowledge with a quick-fire trivia challenge. This format is a powerhouse for educational campaigns or brand myth-busting. By engaging the user\'s competitive spirit, it ensures high dwell time and creates a memorable brand association through active learning.',
  category: 'interactive',
  size: 'interstitials',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
