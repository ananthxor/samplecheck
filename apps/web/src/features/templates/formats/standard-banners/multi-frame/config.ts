import type { FormatDefinition } from '../../_shared/types'
import { multiFrameRenderer } from './renderer'

export const multiFrameFormat: FormatDefinition = {
  type: 'multi-frame',
  name: 'Multi-Frame',
  description: 'Auto-rotating frames highlighting multiple products or features',
  category: 'standard',
  fields: [
    {
      id: 'frames', label: 'Frames', type: 'array', default: [],
      arrayConfig: {
        minItems: 2, maxItems: 6, itemLabel: 'Frame',
        defaultItem: { headline: '', bodyText: '', imageUrl: 'https://picsum.photos/seed/multi-frame/300/250', backgroundColor: '#ffffff' },
        fields: [
          { id: 'headline', label: 'Headline', type: 'text', default: '' },
          { id: 'bodyText', label: 'Body Text', type: 'textarea', default: '' },
          { id: 'imageUrl', label: 'Image', type: 'image', default: 'https://picsum.photos/seed/multi-frame/300/250' },
          { id: 'backgroundColor', label: 'Background Color', type: 'color', default: '#ffffff' },
        ],
      },
    },
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'View All', validation: { max: 30 } },
    { id: 'frameDuration', label: 'Frame Duration (ms)', type: 'number', default: 3000, tab: 'settings', validation: { min: 1000, max: 10000, step: 500 } },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '', tab: 'settings' },
  ],
  renderer: multiFrameRenderer,
  templates: [
    {
      id: 'product-showcase',
      name: 'Product Showcase',
      description: 'Auto-rotating frames highlighting multiple products or features.',
      thumbnailUrl: '',
      sizes: [
        { width: 300, height: 250, label: '300x250' },
        { width: 728, height: 90, label: '728x90' },
      ],
      defaultConfig: {
        type: 'multi-frame',
        frames: [
          { headline: 'Product One', bodyText: 'First product description with key benefits.', imageUrl: 'https://picsum.photos/seed/multi-frame1/300/250', backgroundColor: '#ffffff' },
          { headline: 'Product Two', bodyText: 'Second product description with key benefits.', imageUrl: 'https://picsum.photos/seed/multi-frame2/300/250', backgroundColor: '#f1f5f9' },
          { headline: 'Product Three', bodyText: 'Third product description with key benefits.', imageUrl: 'https://picsum.photos/seed/multi-frame3/300/250', backgroundColor: '#ffffff' },
        ],
        frameDuration: 3000,
        ctaText: 'View All',
        ctaUrl: '',
      },
    },
    {
      id: 'story-sequence',
      name: 'Story Sequence',
      description: 'Sequential storytelling across frames that build a narrative.',
      thumbnailUrl: '',
      sizes: [
        { width: 300, height: 250, label: '300x250' },
        { width: 160, height: 600, label: '160x600' },
      ],
      defaultConfig: {
        type: 'multi-frame',
        frames: [
          { headline: 'Chapter 1', bodyText: 'Set the scene for your story here.', imageUrl: 'https://picsum.photos/seed/multi-frame4/300/250', backgroundColor: '#1e293b' },
          { headline: 'Chapter 2', bodyText: 'Build the narrative with the next scene.', imageUrl: 'https://picsum.photos/seed/multi-frame5/300/250', backgroundColor: '#334155' },
        ],
        frameDuration: 4000,
        ctaText: 'Read More',
        ctaUrl: '',
      },
    },
  ],
}
