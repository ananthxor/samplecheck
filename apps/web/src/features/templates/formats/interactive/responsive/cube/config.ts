import type { FormatDefinition } from '../../../_shared/types'
import { cubeRenderer } from './renderer'

export const cubeFormat: FormatDefinition = {
  type: 'cube',
  name: '3D Cube',
  description: 'Rotating 3D cube with content on each face',
  category: 'interactive',
  fields: [
    {
      id: 'faces', label: 'Faces', type: 'array', default: [],
      arrayConfig: {
        minItems: 4, maxItems: 4, itemLabel: 'Face',
        defaultItem: { headline: '', bodyText: '', imageUrl: '' },
        fields: [
          { id: 'headline', label: 'Headline', type: 'text', default: '' },
          { id: 'bodyText', label: 'Body Text', type: 'textarea', default: '' },
          { id: 'imageUrl', label: 'Image', type: 'image', default: '' },
        ],
      },
    },
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Learn More', validation: { max: 30 } },
    { id: 'rotationSpeed', label: 'Rotation Speed (ms)', type: 'number', default: 4000, tab: 'settings', validation: { min: 1000, max: 10000, step: 500 } },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '', tab: 'settings' },
  ],
  renderer: cubeRenderer,
  templates: [
    {
      id: '3d-product-display',
      name: '3D Product Display',
      description: 'Rotating 3D cube with content on each face.',
      thumbnailUrl: '',
      sizes: [{ width: 300, height: 250, label: '300x250' }],
      defaultConfig: {
        type: 'cube',
        faces: [
          { headline: 'Face 1', imageUrl: '', bodyText: 'First cube face content.' },
          { headline: 'Face 2', imageUrl: '', bodyText: 'Second cube face content.' },
          { headline: 'Face 3', imageUrl: '', bodyText: 'Third cube face content.' },
          { headline: 'Face 4', imageUrl: '', bodyText: 'Fourth cube face content.' },
        ],
        rotationSpeed: 4000, ctaText: 'Explore', ctaUrl: '',
      },
    },
  ],
}
