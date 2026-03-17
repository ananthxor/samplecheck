import type { FormatDefinition } from '../../_shared/types'
import { squareRenderer } from './renderer'
import { squareEngagements } from './engagements'

// Placeholder images — replace with company assets later
const DEFAULT_IMG = 'https://picsum.photos/seed/square/250/250'

export const squareFormat: FormatDefinition = {
  type: 'square',
  name: 'Square',
  description:
    'A 250×250 display banner with background image, dark gradient overlay, logo, brand name, headline, and CTA button. Great for app installs and brand awareness.',
  category: 'standard-banners',
  fields: [
    // ── Content ──────────────────────────────────────────────────────────
    { id: 'imageUrl',   label: 'Background Image',      type: 'image',  default: DEFAULT_IMG },
    { id: 'logoUrl',    label: 'Logo Image',             type: 'image',  default: 'https://picsum.photos/seed/square-logo/100/36' },
    { id: 'brandName',  label: 'Brand Name',             type: 'text',   default: 'ScrollToday', validation: { max: 30 } },
    { id: 'headline',   label: 'Headline',               type: 'text',   default: 'Great deals? Your search ends here', validation: { max: 80 } },
    { id: 'ctaText',    label: 'CTA Button Text',        type: 'text',   default: 'Install Now', validation: { max: 30 } },

    // ── Style ────────────────────────────────────────────────────────────
    { id: 'textColor',     label: 'Text Color',           type: 'color', default: '#ffffff', tab: 'style' },
    { id: 'ctaBgColor',    label: 'CTA Button Color',     type: 'color', default: '#000000', tab: 'style' },
    { id: 'ctaTextColor',  label: 'CTA Text Color',       type: 'color', default: '#ffffff', tab: 'style' },
  ],
  renderer: squareRenderer,
  engagements: squareEngagements,
  templates: [
    {
      id: 'square-app-install',
      name: 'App Install',
      description: 'Drive app downloads with bold branding and a clear install CTA.',
      thumbnailUrl: '',
      sizes: [{ width: 250, height: 250, label: '250×250' }],
      defaultConfig: {
        type: 'square',
        imageUrl: 'https://picsum.photos/seed/square1/250/250',
        logoUrl: 'https://picsum.photos/seed/square-logo1/100/36',
        brandName: 'ScrollToday',
        headline: 'Great deals? Your search ends here',
        ctaText: 'Install Now',
        textColor: '#ffffff',
        ctaBgColor: '#e8553d',
        ctaTextColor: '#ffffff',
      },
    },
    {
      id: 'square-product',
      name: 'Product Highlight',
      description: 'Showcase a product with clean branding on a vibrant background.',
      thumbnailUrl: '',
      sizes: [{ width: 250, height: 250, label: '250×250' }],
      defaultConfig: {
        type: 'square',
        imageUrl: 'https://picsum.photos/seed/square2/250/250',
        logoUrl: 'https://picsum.photos/seed/square-logo2/100/36',
        brandName: 'LUXE',
        headline: 'New arrivals just dropped',
        ctaText: 'Shop Now',
        textColor: '#ffffff',
        ctaBgColor: '#f59e0b',
        ctaTextColor: '#1e293b',
      },
    },
    {
      id: 'square-brand',
      name: 'Brand Awareness',
      description: 'Build brand recognition with a simple logo, tagline, and CTA.',
      thumbnailUrl: '',
      sizes: [{ width: 250, height: 250, label: '250×250' }],
      defaultConfig: {
        type: 'square',
        imageUrl: 'https://picsum.photos/seed/square3/250/250',
        logoUrl: 'https://picsum.photos/seed/square-logo3/100/36',
        brandName: 'STARTER',
        headline: 'Simplify your everyday life',
        ctaText: 'Learn More',
        textColor: '#ffffff',
        ctaBgColor: '#2563eb',
        ctaTextColor: '#ffffff',
      },
    },
  ],
}
