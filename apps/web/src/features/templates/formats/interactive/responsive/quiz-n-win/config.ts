import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const quizNWinFormat: FormatDefinition = {
  type: 'interactive-responsive-quiz-n-win',
  name: 'Quiz-n-Win',
  description: 'Engage users with interactive trivia that rewards participation. Perfect for brand education and data collection, this format gamifies the ad experience, leading to higher completion rates and improved brand recall.',
  category: 'interactive',
  size: 'responsive',
  fields: [
  {
    id: 'quiz_props', label: 'Quiz Setup', type: 'group', default: {},
    arrayConfig: {
      itemLabel: 'Quiz Setup',
      fields: [
        { id: 'q_type', label: 'Question Type', type: 'select', default: '', validation: { options: [{"value":"manual","label":"Manual Input"},{"value":"predefined","label":"Predefined Options"}] } },
        { id: 'text_q', label: 'Quiz Question', type: 'text', default: '' },
        { id: 'media', label: 'Quest Images', type: 'image', default: '' },
      ],
      defaultItem: {},
    },
  },
  ],
  templates: [],
}
