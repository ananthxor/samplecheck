import type { FormatDefinition } from '../../../_shared/types'
import { accordionRenderer } from './renderer'

export const accordionFormat: FormatDefinition = {
  type: 'accordion',
  name: 'Accordion',
  description: 'Expandable sections that reveal content on click',
  category: 'interactive',
  fields: [
    {
      id: 'sections', label: 'Sections', type: 'array', default: [],
      arrayConfig: {
        minItems: 2, maxItems: 8, itemLabel: 'Section',
        defaultItem: { title: '', content: '', imageUrl: '' },
        fields: [
          { id: 'title', label: 'Title', type: 'text', default: '' },
          { id: 'content', label: 'Content', type: 'textarea', default: '' },
          { id: 'imageUrl', label: 'Image', type: 'image', default: '' },
        ],
      },
    },
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Learn More', validation: { max: 30 } },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '', tab: 'settings' },
  ],
  renderer: accordionRenderer,
  templates: [
    {
      id: 'feature-accordion',
      name: 'Feature Accordion',
      description: 'Expandable sections that reveal content on click.',
      thumbnailUrl: '',
      sizes: [{ width: 300, height: 250, label: '300x250' }, { width: 160, height: 600, label: '160x600' }],
      defaultConfig: {
        type: 'accordion',
        sections: [
          { title: 'Feature One', content: 'Details about the first feature.', imageUrl: '' },
          { title: 'Feature Two', content: 'Details about the second feature.', imageUrl: '' },
          { title: 'Feature Three', content: 'Details about the third feature.', imageUrl: '' },
        ],
        ctaText: 'Get Started', ctaUrl: '',
      },
    },
  ],
}
