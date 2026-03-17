import type { FormatDefinition } from '../../../_shared/types'
import { animatedBannerRenderer } from './renderer'

export const animatedBannerFormat: FormatDefinition = {
  type: 'animated-banner',
  name: 'Animated Banner',
  description: 'Animated banner with eye-catching motion effects',
  category: 'animated',
  fields: [
    { id: 'headline', label: 'Headline', type: 'text', default: '' },
    { id: 'bodyText', label: 'Body Text', type: 'textarea', default: '' },
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Learn More', validation: { max: 30 } },
    { id: 'imageUrl', label: 'Image', type: 'image', default: '' },
    { id: 'backgroundColor', label: 'Background Color', type: 'color', default: '#ffffff', tab: 'style' },
    { id: 'textColor', label: 'Text Color', type: 'color', default: '#000000', tab: 'style' },
    { id: 'ctaColor', label: 'CTA Button Color', type: 'color', default: '#2563eb', tab: 'style' },
    {
      id: 'animationType', label: 'Animation Type', type: 'select', default: 'fade', tab: 'style',
      validation: {
        options: [
          { value: 'fade', label: 'Fade' },
          { value: 'slide', label: 'Slide' },
          { value: 'bounce', label: 'Bounce' },
          { value: 'zoom', label: 'Zoom' },
        ],
      },
    },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '', tab: 'settings' },
  ],
  renderer: animatedBannerRenderer,
  templates: [
    {
      id: 'attention-grabber',
      name: 'Attention Grabber',
      description: 'Animated banner with eye-catching motion effects.',
      thumbnailUrl: '',
      sizes: [{ width: 728, height: 90, label: '728x90' }, { width: 300, height: 250, label: '300x250' }, { width: 320, height: 50, label: '320x50' }],
      defaultConfig: {
        type: 'animated-banner',
        headline: 'Grab Attention Now', bodyText: 'Animated content that stands out from the crowd.',
        ctaText: 'Learn More', ctaUrl: '',
        backgroundColor: '#ffffff', textColor: '#000000', ctaColor: '#2563eb',
        imageUrl: '', animationType: 'fade',
      },
    },
  ],
}
