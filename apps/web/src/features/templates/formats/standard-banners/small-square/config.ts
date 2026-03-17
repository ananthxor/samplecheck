import type { FormatDefinition } from '../../_shared/types'
import { smallSquareRenderer } from './renderer'
import { smallSquareEngagements } from './engagements'

// Placeholder images — replace with company assets later
const DEFAULT_IMG = 'https://picsum.photos/seed/small-square/200/200'

export const smallSquareFormat: FormatDefinition = {
  type: 'small-square',
  name: 'Small Square',
  description:
    'A compact 200×200 display banner with background image, dark gradient overlay, brand name, headline, optional promo badge, and CTA button. Ideal for sidebar and widget placements.',
  category: 'standard-banners',
  fields: [
    // ── Content ──────────────────────────────────────────────────────────
    { id: 'imageUrl',    label: 'Background Image',   type: 'image',  default: DEFAULT_IMG },
    { id: 'brandName',   label: 'Brand Name',          type: 'text',   default: 'ScrollToday', validation: { max: 20 } },
    { id: 'headline',    label: 'Headline',             type: 'text',   default: "Don't miss this offer", validation: { max: 60 } },
    { id: 'subtitle',    label: 'Subtitle',             type: 'text',   default: 'Use Code:', validation: { max: 40 } },
    { id: 'promoText',   label: 'Promo Badge Text',     type: 'text',   default: 'SAVE30', validation: { max: 30 } },
    { id: 'description', label: 'Description',          type: 'text',   default: 'Get up to 30% off', validation: { max: 60 } },
    { id: 'ctaText',     label: 'CTA Button Text',      type: 'text',   default: 'Get Started', validation: { max: 20 } },

    // ── Style ────────────────────────────────────────────────────────────
    { id: 'textColor',    label: 'Text Color',          type: 'color', default: '#ffffff', tab: 'style' },
    { id: 'accentColor',  label: 'Promo Badge Color',   type: 'color', default: '#00d4ff', tab: 'style' },
    { id: 'ctaBgColor',   label: 'CTA Button Color',    type: 'color', default: '#000000', tab: 'style' },
    { id: 'ctaTextColor', label: 'CTA Text Color',      type: 'color', default: '#ffffff', tab: 'style' },
  ],
  renderer: smallSquareRenderer,
  engagements: smallSquareEngagements,
  templates: [
    {
      id: 'small-sq-promo',
      name: 'Promo Code',
      description: 'Highlight a promotional code over a hero background image.',
      thumbnailUrl: '',
      sizes: [{ width: 200, height: 200, label: '200×200' }],
      defaultConfig: {
        type: 'small-square',
        imageUrl: 'https://picsum.photos/seed/small-square1/200/200',
        brandName: 'ScrollToday',
        headline: "Don't miss this offer",
        subtitle: 'Use Code:',
        promoText: 'SAVE30',
        description: 'Get up to 30% off',
        ctaText: 'Get Started',
        textColor: '#ffffff',
        accentColor: '#00d4ff',
        ctaBgColor: '#000000',
        ctaTextColor: '#ffffff',
      },
    },
    {
      id: 'small-sq-ride',
      name: 'Ride & Transport',
      description: 'Promote ride-sharing or transport services with a promo code.',
      thumbnailUrl: '',
      sizes: [{ width: 200, height: 200, label: '200×200' }],
      defaultConfig: {
        type: 'small-square',
        imageUrl: 'https://picsum.photos/seed/small-square2/200/200',
        brandName: 'RIDES',
        headline: "Don't go home without a ride",
        subtitle: 'Extra Code:',
        promoText: 'FREERIDE',
        description: 'Free first ride up to $30',
        ctaText: 'Ride Now',
        textColor: '#ffffff',
        accentColor: '#22c55e',
        ctaBgColor: '#1e293b',
        ctaTextColor: '#ffffff',
      },
    },
    {
      id: 'small-sq-food',
      name: 'Food & Delivery',
      description: 'Drive orders with a food or delivery offer.',
      thumbnailUrl: '',
      sizes: [{ width: 200, height: 200, label: '200×200' }],
      defaultConfig: {
        type: 'small-square',
        imageUrl: 'https://picsum.photos/seed/small-square3/200/200',
        brandName: 'EATS',
        headline: 'Hungry? Order now',
        subtitle: 'Promo Code:',
        promoText: 'YUMMY50',
        description: '50% off your first order',
        ctaText: 'Order Now',
        textColor: '#ffffff',
        accentColor: '#f59e0b',
        ctaBgColor: '#ef4444',
        ctaTextColor: '#ffffff',
      },
    },
  ],
}
