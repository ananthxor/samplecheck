import type { FormatDefinition } from '../../_shared/types'
import { halfPageRenderer } from './renderer'
import { halfPageEngagements } from './engagements'

export const halfPageFormat: FormatDefinition = {
  type: 'half-page',
  name: 'Half Page',
  description:
    'A 300×600 tall vertical ad with solid background color, logo, headline, and a text-style CTA.',
  category: 'standard-banners',
  fields: [
    // ── Content ──────────────────────────────────────────────────────────
    { id: 'logoUrl',   label: 'Logo Image', type: 'image', default: 'https://picsum.photos/seed/half-page-logo/100/36' },
    { id: 'headline',  label: 'Headline',   type: 'text',  default: 'EXPLORE 250+ FORMATS', validation: { max: 50 } },
    { id: 'ctaText',   label: 'CTA Text',   type: 'text',  default: 'KNOW MORE', validation: { max: 20 } },

    // ── Style ────────────────────────────────────────────────────────────
    { id: 'bgColor',   label: 'Background Color', type: 'color', default: '#4caf50', tab: 'style' },
    { id: 'textColor', label: 'Text Color',       type: 'color', default: '#ffffff', tab: 'style' },
    { id: 'ctaColor',  label: 'CTA Color',        type: 'color', default: '#ffffff', tab: 'style' },
  ],
  renderer: halfPageRenderer,
  engagements: halfPageEngagements,
  templates: [
    {
      id: 'half-page-brand',
      name: 'Brand Awareness',
      description: 'Half page ad for brand awareness with bold headline and clean layout.',
      thumbnailUrl: '',
      sizes: [{ width: 300, height: 600, label: '300×600' }],
      defaultConfig: {
        type: 'half-page',
        logoUrl: 'https://picsum.photos/seed/half-page-logo1/100/36',
        headline: 'EXPLORE 250+ FORMATS',
        ctaText: 'KNOW MORE',
        bgColor: '#4caf50',
        textColor: '#ffffff',
        ctaColor: '#ffffff',
      },
    },
    {
      id: 'half-page-fashion',
      name: 'Fashion & Lifestyle',
      description: 'Half page ad for fashion brands with elegant solid color background.',
      thumbnailUrl: '',
      sizes: [{ width: 300, height: 600, label: '300×600' }],
      defaultConfig: {
        type: 'half-page',
        logoUrl: 'https://picsum.photos/seed/half-page-logo2/100/36',
        headline: 'NEW SEASON COLLECTION',
        ctaText: 'SHOP NOW',
        bgColor: '#1a1a2e',
        textColor: '#ffffff',
        ctaColor: '#e0c097',
      },
    },
    {
      id: 'half-page-tech',
      name: 'Tech & SaaS',
      description: 'Half page ad for tech products with modern gradient-style color.',
      thumbnailUrl: '',
      sizes: [{ width: 300, height: 600, label: '300×600' }],
      defaultConfig: {
        type: 'half-page',
        logoUrl: 'https://picsum.photos/seed/half-page-logo3/100/36',
        headline: 'BUILD SOMETHING GREAT',
        ctaText: 'GET STARTED',
        bgColor: '#3b82f6',
        textColor: '#ffffff',
        ctaColor: '#ffffff',
      },
    },
  ],
}
