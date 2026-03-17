import type { FormatDefinition } from '../../../_shared/types'
import { quizRenderer } from './renderer'

export const quizFormat: FormatDefinition = {
  type: 'quiz',
  name: 'Quiz / Poll',
  description: 'Interactive quiz with multiple-choice questions',
  category: 'interactive',
  fields: [
    { id: 'question', label: 'Question', type: 'textarea', default: '' },
    {
      id: 'options', label: 'Options', type: 'array', default: [],
      arrayConfig: {
        minItems: 2, maxItems: 6, itemLabel: 'Option',
        defaultItem: { text: '', isCorrect: false },
        fields: [
          { id: 'text', label: 'Option Text', type: 'text', default: '' },
          { id: 'isCorrect', label: 'Correct', type: 'switch', default: false },
        ],
      },
    },
    { id: 'resultText', label: 'Result Text', type: 'textarea', default: '' },
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Learn More', validation: { max: 30 } },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '', tab: 'settings' },
  ],
  renderer: quizRenderer,
  templates: [
    {
      id: 'brand-trivia',
      name: 'Brand Trivia',
      description: 'Interactive quiz with multiple-choice questions.',
      thumbnailUrl: '',
      sizes: [{ width: 300, height: 250, label: '300x250' }, { width: 320, height: 480, label: '320x480' }],
      defaultConfig: {
        type: 'quiz',
        question: 'What makes our product unique?',
        options: [
          { text: 'Option A', isCorrect: false },
          { text: 'Option B', isCorrect: true },
          { text: 'Option C', isCorrect: false },
        ],
        resultText: 'Great job! You know your stuff.',
        ctaText: 'Learn More', ctaUrl: '',
      },
    },
  ],
}
