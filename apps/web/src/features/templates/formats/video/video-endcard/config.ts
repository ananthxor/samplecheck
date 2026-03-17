import type { FormatDefinition } from '../../_shared/types'
import { videoEndcardRenderer } from './renderer'

export const videoEndcardFormat: FormatDefinition = {
  type: 'video-endcard',
  name: 'Video with End Card',
  description: 'Video that plays and transitions to an interactive end card with CTA',
  category: 'video',
  fields: [
    { id: 'videoUrl', label: 'Video URL', type: 'text', default: '' },
    { id: 'endcardHeadline', label: 'End Card Headline', type: 'text', default: '' },
    { id: 'endcardBodyText', label: 'End Card Body', type: 'textarea', default: '' },
    { id: 'endcardImageUrl', label: 'End Card Image', type: 'image', default: '' },
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Learn More', validation: { max: 30 } },
    { id: 'autoplay', label: 'Auto Play Video', type: 'switch', default: false, tab: 'settings' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '', tab: 'settings' },
  ],
  renderer: videoEndcardRenderer,
  templates: [
    {
      id: 'brand-story',
      name: 'Brand Story',
      description: 'Video that plays and transitions to an interactive end card with CTA.',
      thumbnailUrl: '',
      sizes: [{ width: 300, height: 250, label: '300x250' }, { width: 640, height: 360, label: '640x360' }],
      defaultConfig: {
        type: 'video-endcard',
        videoUrl: '', endcardHeadline: 'Thanks for Watching',
        endcardBodyText: 'Ready to learn more about what we offer?',
        endcardImageUrl: '', ctaText: 'Get Started', ctaUrl: '', autoplay: false,
      },
    },
  ],
}
