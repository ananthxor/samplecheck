import type { FormatDefinition } from '../../../_shared/types'
import { carouselRenderer } from './renderer'

export const carouselFormat: FormatDefinition = {
  type: 'carousel',
  name: 'Carousel',
  description: 'Swipeable product cards for browsing multiple items',
  category: 'interactive',
  fields: [
    {
      id: 'slides', label: 'Slides', type: 'array', default: [],
      arrayConfig: {
        minItems: 2, maxItems: 10, itemLabel: 'Slide',
        defaultItem: { headline: '', bodyText: '', imageUrl: '' },
        fields: [
          { id: 'headline', label: 'Headline', type: 'text', default: '' },
          { id: 'bodyText', label: 'Body Text', type: 'textarea', default: '' },
          { id: 'imageUrl', label: 'Image', type: 'image', default: '' },
        ],
      },
    },
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Learn More', validation: { max: 30 } },
    { id: 'autoPlay', label: 'Auto Play', type: 'switch', default: false, tab: 'settings' },
    { id: 'autoPlayInterval', label: 'Auto Play Interval (ms)', type: 'number', default: 3000, tab: 'settings', validation: { min: 1000, max: 10000, step: 500 } },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '', tab: 'settings' },
  ],
  renderer: carouselRenderer,
  templates: [
    {
      id: 'product-gallery',
      name: 'Product Gallery',
      description: 'Swipeable product cards for browsing multiple items.',
      thumbnailUrl: '',
      sizes: [
        { width: 300, height: 250, label: '300x250' },
        { width: 320, height: 480, label: '320x480' },
      ],
      defaultConfig: {
        type: 'carousel',
        slides: [
          { headline: 'Item 1', imageUrl: '', bodyText: 'First product in the gallery.' },
          { headline: 'Item 2', imageUrl: '', bodyText: 'Second product in the gallery.' },
          { headline: 'Item 3', imageUrl: '', bodyText: 'Third product in the gallery.' },
        ],
        autoPlay: false, autoPlayInterval: 3000,
        ctaText: 'Shop Now', ctaUrl: '',
      },
    },
    {
      id: 'feature-highlights',
      name: 'Feature Highlights',
      description: 'Showcase key features one-by-one with swipeable slides.',
      thumbnailUrl: '',
      sizes: [
        { width: 300, height: 250, label: '300x250' },
        { width: 728, height: 90, label: '728x90' },
      ],
      defaultConfig: {
        type: 'carousel',
        slides: [
          { headline: 'Feature One', imageUrl: '', bodyText: 'Describe your first key feature.' },
          { headline: 'Feature Two', imageUrl: '', bodyText: 'Describe your second key feature.' },
          { headline: 'Feature Three', imageUrl: '', bodyText: 'Describe your third key feature.' },
        ],
        autoPlay: true, autoPlayInterval: 4000,
        ctaText: 'Learn More', ctaUrl: '',
      },
    },
  ],
}
