import type { FormatDefinition } from '../../_shared/types'
import { clickToPlayRenderer } from './renderer'

export const clickToPlayFormat: FormatDefinition = {
  type: 'click-to-play',
  name: 'Click to Play Video',
  description: 'Thumbnail image that expands to play a video on click',
  category: 'video',
  fields: [
    { id: 'videoUrl', label: 'Video URL', type: 'text', default: '' },
    { id: 'headline', label: 'Headline', type: 'text', default: '' },
    { id: 'thumbnailImageUrl', label: 'Thumbnail Image', type: 'image', default: '' },
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Learn More', validation: { max: 30 } },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '', tab: 'settings' },
  ],
  renderer: clickToPlayRenderer,
  templates: [
    {
      id: 'product-demo',
      name: 'Product Demo',
      description: 'Thumbnail image that expands to play a video on click.',
      thumbnailUrl: '',
      sizes: [{ width: 300, height: 250, label: '300x250' }, { width: 640, height: 360, label: '640x360' }],
      defaultConfig: {
        type: 'click-to-play',
        videoUrl: '', thumbnailImageUrl: '',
        headline: 'Watch Product Demo', ctaText: 'Play Video', ctaUrl: '',
      },
    },
  ],
}
