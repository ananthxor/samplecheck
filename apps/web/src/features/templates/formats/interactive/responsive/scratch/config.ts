import type { FormatDefinition } from '../../../_shared/types'
import { scratchRenderer } from './renderer'

export const scratchFormat: FormatDefinition = {
  type: 'scratch',
  name: 'Scratch to Reveal',
  description: 'Users scratch an overlay to reveal hidden content underneath',
  category: 'interactive',
  fields: [
    { id: 'headline', label: 'Headline', type: 'text', default: '' },
    { id: 'bodyText', label: 'Body Text', type: 'textarea', default: '' },
    { id: 'overlayImageUrl', label: 'Overlay Image', type: 'image', default: '' },
    { id: 'revealImageUrl', label: 'Reveal Image', type: 'image', default: '' },
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Learn More', validation: { max: 30 } },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '', tab: 'settings' },
  ],
  renderer: scratchRenderer,
  templates: [
    {
      id: 'mystery-reveal',
      name: 'Mystery Reveal',
      description: 'Users scratch an overlay to reveal hidden content underneath.',
      thumbnailUrl: '',
      sizes: [{ width: 300, height: 250, label: '300x250' }, { width: 320, height: 480, label: '320x480' }],
      defaultConfig: {
        type: 'scratch',
        overlayImageUrl: '', revealImageUrl: '',
        headline: 'Scratch to Reveal Your Prize!',
        bodyText: 'Use your finger or mouse to scratch the surface and discover what is underneath.',
        ctaText: 'Claim Now', ctaUrl: '',
      },
    },
  ],
}
