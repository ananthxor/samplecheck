import type { FormatDefinition } from '../../../_shared/types'
import { sliderRenderer } from './renderer'

export const sliderFormat: FormatDefinition = {
  type: 'slider',
  name: 'Comparison Slider',
  description: 'Drag a handle to compare two images side-by-side',
  category: 'interactive',
  fields: [
    { id: 'headline', label: 'Headline', type: 'text', default: '' },
    { id: 'bodyText', label: 'Body Text', type: 'textarea', default: '' },
    { id: 'beforeImageUrl', label: 'Before Image', type: 'image', default: '' },
    { id: 'afterImageUrl', label: 'After Image', type: 'image', default: '' },
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Learn More', validation: { max: 30 } },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '', tab: 'settings' },
  ],
  renderer: sliderRenderer,
  templates: [
    {
      id: 'comparison-slider',
      name: 'Comparison Slider',
      description: 'Drag a handle to compare two images side-by-side.',
      thumbnailUrl: '',
      sizes: [{ width: 300, height: 250, label: '300x250' }, { width: 728, height: 90, label: '728x90' }],
      defaultConfig: {
        type: 'slider',
        beforeImageUrl: '', afterImageUrl: '',
        headline: 'See the Difference', bodyText: 'Drag the slider to compare before and after.',
        ctaText: 'Try It Now', ctaUrl: '',
      },
    },
  ],
}
