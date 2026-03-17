import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const displayShelfFormat: FormatDefinition = {
  type: 'animated-banner-display-shelf',
  name: 'Display Shelf',
  description: 'Banner showcasing multiple products on an animated shelf layout with individual product links. Each product slot rolls into view on a shared background, creating a mini storefront experience that drives multi-product discovery.',
  category: 'animated',
  size: 'banner',
  fields: [
  { id: 'bg_image', label: 'Background Image', type: 'image', default: '' },
  { id: 'shelf_label', label: 'Shelf Label', type: 'text', default: '' },
  { id: 'shelf_label_color', label: 'Shelf Label Text Color', type: 'color', default: '' },
  { id: 'shelf_label_bg', label: 'Shelf Label Background Color', type: 'color', default: '' },
  {
    id: 'product_1', label: 'Product 1', type: 'group', default: {},
    arrayConfig: {
      itemLabel: 'Product 1',
      fields: [
        { id: 'prod1_image', label: 'Product Image', type: 'image', default: '' },
        { id: 'prod1_url', label: 'Product Link URL', type: 'url', default: '' },
        { id: 'prod1_name', label: 'Product Name', type: 'text', default: '' },
        { id: 'prod1_name_color', label: 'Product Name Color', type: 'color', default: '' },
        { id: 'prod1_name_bg', label: 'Product Name Background Color', type: 'color', default: '' },
      ],
      defaultItem: {},
    },
  },
  {
    id: 'product_2', label: 'Product 2', type: 'group', default: {},
    arrayConfig: {
      itemLabel: 'Product 2',
      fields: [
        { id: 'prod2_image', label: 'Product Image', type: 'image', default: '' },
        { id: 'prod2_url', label: 'Product Link URL', type: 'url', default: '' },
        { id: 'prod2_name', label: 'Product Name', type: 'text', default: '' },
        { id: 'prod2_name_color', label: 'Product Name Color', type: 'color', default: '' },
        { id: 'prod2_name_bg', label: 'Product Name Background Color', type: 'color', default: '' },
      ],
      defaultItem: {},
    },
  },
  {
    id: 'product_3', label: 'Product 3', type: 'group', default: {},
    arrayConfig: {
      itemLabel: 'Product 3',
      fields: [
        { id: 'prod3_image', label: 'Product Image', type: 'image', default: '' },
        { id: 'prod3_url', label: 'Product Link URL', type: 'url', default: '' },
        { id: 'prod3_name', label: 'Product Name', type: 'text', default: '' },
        { id: 'prod3_name_color', label: 'Product Name Color', type: 'color', default: '' },
        { id: 'prod3_name_bg', label: 'Product Name Background Color', type: 'color', default: '' },
      ],
      defaultItem: {},
    },
  },
  { id: 'cta_text', label: 'CTA Button Text', type: 'text', default: '' },
  ],
  templates: [],
}
