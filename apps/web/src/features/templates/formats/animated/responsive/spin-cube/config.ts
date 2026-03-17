import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const spinCubeFormat: FormatDefinition = {
  type: 'animated-responsive-spin-cube',
  name: 'Spin Cube',
  description: 'A four-panel spinning cube that rotates through graphic and text content to deliver a dynamic ad message. Each face of the cube presents a unique visual, creating an engaging 3D experience that holds user attention across multiple frames.',
  category: 'animated',
  size: 'responsive',
  fields: [
  {
    id: 'panel_1', label: 'Panel 1', type: 'group', default: {},
    arrayConfig: {
      itemLabel: 'Panel 1',
      fields: [
        { id: 'p1_image', label: 'Panel 1 Image', type: 'image', default: '' },
        { id: 'p1_url', label: 'Panel 1 Link URL', type: 'url', default: '' },
        { id: 'p1_text', label: 'Panel 1 Text', type: 'text', default: '' },
        { id: 'p1_text_color', label: 'Panel 1 Text Color', type: 'color', default: '' },
        { id: 'p1_text_bg', label: 'Panel 1 Text Background Color', type: 'color', default: '' },
      ],
      defaultItem: {},
    },
  },
  {
    id: 'panel_2', label: 'Panel 2', type: 'group', default: {},
    arrayConfig: {
      itemLabel: 'Panel 2',
      fields: [
        { id: 'p2_image', label: 'Panel 2 Image', type: 'image', default: '' },
        { id: 'p2_url', label: 'Panel 2 Link URL', type: 'url', default: '' },
        { id: 'p2_text', label: 'Panel 2 Text', type: 'text', default: '' },
        { id: 'p2_text_color', label: 'Panel 2 Text Color', type: 'color', default: '' },
        { id: 'p2_text_bg', label: 'Panel 2 Text Background Color', type: 'color', default: '' },
      ],
      defaultItem: {},
    },
  },
  {
    id: 'panel_3', label: 'Panel 3', type: 'group', default: {},
    arrayConfig: {
      itemLabel: 'Panel 3',
      fields: [
        { id: 'p3_image', label: 'Panel 3 Image', type: 'image', default: '' },
        { id: 'p3_url', label: 'Panel 3 Link URL', type: 'url', default: '' },
        { id: 'p3_text', label: 'Panel 3 Text', type: 'text', default: '' },
        { id: 'p3_text_color', label: 'Panel 3 Text Color', type: 'color', default: '' },
        { id: 'p3_text_bg', label: 'Panel 3 Text Background Color', type: 'color', default: '' },
      ],
      defaultItem: {},
    },
  },
  {
    id: 'panel_4', label: 'Panel 4', type: 'group', default: {},
    arrayConfig: {
      itemLabel: 'Panel 4',
      fields: [
        { id: 'p4_image', label: 'Panel 4 Image', type: 'image', default: '' },
        { id: 'p4_url', label: 'Panel 4 Link URL', type: 'url', default: '' },
        { id: 'p4_text', label: 'Panel 4 Text', type: 'text', default: '' },
        { id: 'p4_text_color', label: 'Panel 4 Text Color', type: 'color', default: '' },
        { id: 'p4_text_bg', label: 'Panel 4 Text Background Color', type: 'color', default: '' },
      ],
      defaultItem: {},
    },
  },
  { id: 'cta_text', label: 'CTA Button Text', type: 'text', default: '' },
  ],
  templates: [],
}
