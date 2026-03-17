import type { FormatDefinition } from '../../_shared/types'
import { inlineRectangleRenderer } from './renderer'
import { inlineRectangleEngagements } from './engagements'

// Placeholder images — replace with company assets later
const DEFAULT_IMG = 'https://picsum.photos/seed/inline-rectangle/300/250'

export const inlineRectangleFormat: FormatDefinition = {
  type: 'inline-rectangle',
  name: 'Inline Rectangle',
  description:
    'A 300×250 standard display banner with background image, dark gradient overlay, brand name, headline, optional promo badge, and CTA button. Ideal for in-article and sidebar placements.',
  category: 'standard-banners',
  fields: [
    // ── Content ──────────────────────────────────────────────────────────
    { id: 'imageUrl',    label: 'Background Image',  type: 'image',    default: DEFAULT_IMG },
    { id: 'brandName',   label: 'Brand Name',         type: 'text',     default: 'ScrollToday', validation: { max: 40 } },
    { id: 'headline',    label: 'Headline',            type: 'text',     default: "Don't miss this exclusive offer", validation: { max: 80 } },
    { id: 'subtitle',    label: 'Subtitle',            type: 'text',     default: 'Use Code:', validation: { max: 60 } },
    { id: 'promoText',   label: 'Promo Badge Text',    type: 'text',     default: 'SAVE30', validation: { max: 40 } },
    { id: 'description', label: 'Description',         type: 'text',     default: 'Get up to 30% off your first order', validation: { max: 80 } },
    { id: 'ctaText',     label: 'CTA Button Text',     type: 'text',     default: 'Book Now', validation: { max: 30 } },

    // ── Style ────────────────────────────────────────────────────────────
    { id: 'textColor',    label: 'Text Color',          type: 'color', default: '#ffffff', tab: 'style' },
    { id: 'accentColor',  label: 'Promo Badge Color',   type: 'color', default: '#00d4ff', tab: 'style' },
    { id: 'ctaColor',     label: 'CTA Button Color',    type: 'color', default: '#000000', tab: 'style' },
    { id: 'ctaTextColor', label: 'CTA Text Color',      type: 'color', default: '#ffffff', tab: 'style' },
  ],
  renderer: inlineRectangleRenderer,
  engagements: inlineRectangleEngagements,
  templates: [
    {
      id: 'inline-rect-promo',
      name: 'Promo Code Banner',
      description: 'Highlight a promotional code or offer over a hero background image.',
      thumbnailUrl: '',
      sizes: [{ width: 300, height: 250, label: '300×250' }],
      defaultConfig: {
        type: 'inline-rectangle',
        imageUrl: 'https://picsum.photos/seed/inline-rectangle1/300/250',
        brandName: 'ScrollToday',
        headline: "Don't miss this exclusive offer",
        subtitle: 'Use Code:',
        promoText: 'SAVE30',
        description: 'Get up to 30% off your first order',
        ctaText: 'Book Now',
        textColor: '#ffffff',
        accentColor: '#00d4ff',
        ctaColor: '#000000',
        ctaTextColor: '#ffffff',
      },
    },
    {
      id: 'inline-rect-product',
      name: 'Product Showcase',
      description: 'Feature a product with clean branding and a single call-to-action.',
      thumbnailUrl: '',
      sizes: [{ width: 300, height: 250, label: '300×250' }],
      defaultConfig: {
        type: 'inline-rectangle',
        imageUrl: 'https://picsum.photos/seed/inline-rectangle2/300/250',
        brandName: 'LUXE',
        headline: 'Discover Something New',
        subtitle: 'Premium Collection',
        promoText: '',
        description: 'Premium quality, delivered to your door.',
        ctaText: 'Shop Now',
        textColor: '#ffffff',
        accentColor: '#f59e0b',
        ctaColor: '#2563eb',
        ctaTextColor: '#ffffff',
      },
    },
    {
      id: 'inline-rect-event',
      name: 'Event Promotion',
      description: 'Drive registrations or ticket sales for an upcoming event.',
      thumbnailUrl: '',
      sizes: [{ width: 300, height: 250, label: '300×250' }],
      defaultConfig: {
        type: 'inline-rectangle',
        imageUrl: 'https://picsum.photos/seed/inline-rectangle3/300/250',
        brandName: 'SUMMIT',
        headline: 'Join Us This Weekend',
        subtitle: 'Limited seats available',
        promoText: 'FREE ENTRY',
        description: 'Register now and save your spot',
        ctaText: 'Register',
        textColor: '#ffffff',
        accentColor: '#22c55e',
        ctaColor: '#1e293b',
        ctaTextColor: '#ffffff',
      },
    },
  ],
}
