import type { FormatDefinition } from '../../_shared/types'
import { skyscraperRenderer } from './renderer'
import { skyscraperEngagements } from './engagements'

// Placeholder images — replace with company assets later
const DEFAULT_IMG = 'https://picsum.photos/seed/skyscraper/120/600'
const FOOD_IMG = 'https://picsum.photos/seed/skyscraper2/120/600'
const TRAVEL_IMG = 'https://picsum.photos/seed/skyscraper3/120/600'

export const skyscraperFormat: FormatDefinition = {
  type: 'skyscraper',
  name: 'Skyscraper',
  description:
    'A 120×600 tall sidebar ad with full-bleed background image, optional headline and CTA overlay. Very narrow — ideal for sidebar placements.',
  category: 'standard-banners',
  fields: [
    // ── Content ──────────────────────────────────────────────────────────
    { id: 'imageUrl', label: 'Background Image',  type: 'image', default: DEFAULT_IMG },
    { id: 'headline', label: 'Headline',           type: 'text',  default: 'Your search ends here', validation: { max: 30 } },
    { id: 'ctaText',  label: 'CTA Button Text',    type: 'text',  default: 'Install Now', validation: { max: 15 } },

    // ── Style ────────────────────────────────────────────────────────────
    { id: 'overlayColor', label: 'Overlay Color',    type: 'color', default: 'rgba(0,0,0,0.45)', tab: 'style' },
    { id: 'textColor',    label: 'Text Color',       type: 'color', default: '#ffffff', tab: 'style' },
    { id: 'ctaBgColor',   label: 'CTA Button Color', type: 'color', default: '#e23b3b', tab: 'style' },
    { id: 'ctaTextColor', label: 'CTA Text Color',   type: 'color', default: '#ffffff', tab: 'style' },
  ],
  renderer: skyscraperRenderer,
  engagements: skyscraperEngagements,
  templates: [
    {
      id: 'skyscraper-default',
      name: 'App Install',
      description: 'Drive app downloads with a tall sidebar image ad and CTA overlay.',
      thumbnailUrl: '',
      sizes: [{ width: 120, height: 600, label: '120×600' }],
      defaultConfig: {
        type: 'skyscraper',
        imageUrl: 'https://picsum.photos/seed/skyscraper1/120/600',
        headline: 'Your search ends here',
        ctaText: 'Install Now',
        overlayColor: 'rgba(0,0,0,0.45)',
        textColor: '#ffffff',
        ctaBgColor: '#e23b3b',
        ctaTextColor: '#ffffff',
      },
    },
    {
      id: 'skyscraper-food',
      name: 'Food & Delivery',
      description: 'Promote food delivery in a tall sidebar with appetizing imagery.',
      thumbnailUrl: '',
      sizes: [{ width: 120, height: 600, label: '120×600' }],
      defaultConfig: {
        type: 'skyscraper',
        imageUrl: FOOD_IMG,
        headline: 'Hungry? Order now',
        ctaText: 'Order Now',
        overlayColor: 'rgba(0,0,0,0.5)',
        textColor: '#ffffff',
        ctaBgColor: '#f59e0b',
        ctaTextColor: '#1e293b',
      },
    },
    {
      id: 'skyscraper-travel',
      name: 'Travel & Booking',
      description: 'Inspire travel in a tall sidebar with scenic imagery.',
      thumbnailUrl: '',
      sizes: [{ width: 120, height: 600, label: '120×600' }],
      defaultConfig: {
        type: 'skyscraper',
        imageUrl: TRAVEL_IMG,
        headline: 'Explore the world',
        ctaText: 'Book Now',
        overlayColor: 'rgba(0,0,0,0.4)',
        textColor: '#ffffff',
        ctaBgColor: '#2563eb',
        ctaTextColor: '#ffffff',
      },
    },
  ],
}
