import type { FormatDefinition } from '../../../_shared/types'
import { countdownRenderer } from './renderer'

export const countdownFormat: FormatDefinition = {
  type: 'countdown',
  name: 'Countdown Timer',
  description: 'Countdown timer that creates urgency for limited-time offers',
  category: 'animated',
  fields: [
    { id: 'headline', label: 'Headline', type: 'text', default: '' },
    { id: 'bodyText', label: 'Body Text', type: 'textarea', default: '' },
    { id: 'targetDate', label: 'Target Date (ISO)', type: 'date', default: '' },
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now', validation: { max: 30 } },
    { id: 'backgroundColor', label: 'Background Color', type: 'color', default: '#111827', tab: 'style' },
    { id: 'textColor', label: 'Text Color', type: 'color', default: '#ffffff', tab: 'style' },
    { id: 'ctaColor', label: 'Button Color', type: 'color', default: '#2563eb', tab: 'style' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '', tab: 'settings' },
  ],
  renderer: countdownRenderer,
  templates: [
    {
      id: 'flash-sale',
      name: 'Flash Sale',
      description: 'Countdown timer that creates urgency for limited-time offers.',
      thumbnailUrl: '',
      sizes: [{ width: 300, height: 250, label: '300x250' }, { width: 728, height: 90, label: '728x90' }],
      defaultConfig: {
        type: 'countdown',
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        headline: 'Flash Sale Ends Soon!', bodyText: 'Do not miss out on our biggest deals of the year.',
        ctaText: 'Shop Now', ctaUrl: '',
        backgroundColor: '#dc2626', textColor: '#ffffff',
      },
    },
  ],
}
