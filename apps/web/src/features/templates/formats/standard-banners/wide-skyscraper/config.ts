import type { FormatDefinition } from '../../_shared/types'
import { wideSkyscraperRenderer } from './renderer'
import { wideSkyscraperEngagements } from './engagements'

// Placeholder images — replace with company assets later
const DEFAULT_IMG = 'https://picsum.photos/seed/wide-skyscraper/160/600'
const TECH_IMG = 'https://picsum.photos/seed/wide-skyscraper2/160/600'
const TRAVEL_IMG = 'https://picsum.photos/seed/wide-skyscraper3/160/600'

export const wideSkyscraperFormat: FormatDefinition = {
  type: 'wide-skyscraper',
  name: 'Wide Skyscraper',
  description:
    'A 160×600 tall sidebar ad with full-bleed background image, optional brand name, headline, and CTA overlay. Ideal for desktop sidebar placements.',
  category: 'standard-banners',
  fields: [
    // ── Content ──────────────────────────────────────────────────────────
    { id: 'imageUrl',  label: 'Background Image',  type: 'image', default: DEFAULT_IMG },
    { id: 'brandName', label: 'Brand Name',          type: 'text',  default: 'ScrollToday', validation: { max: 15 } },
    { id: 'headline',  label: 'Headline',            type: 'text',  default: 'For a free first ride up to $30', validation: { max: 50 } },
    { id: 'ctaText',   label: 'CTA Button Text',     type: 'text',  default: 'Book Now', validation: { max: 15 } },

    // ── Style ────────────────────────────────────────────────────────────
    { id: 'overlayColor', label: 'Overlay Color',    type: 'color', default: 'rgba(0,0,0,0.5)', tab: 'style' },
    { id: 'textColor',    label: 'Text Color',       type: 'color', default: '#ffffff', tab: 'style' },
    { id: 'ctaBgColor',   label: 'CTA Button Color', type: 'color', default: '#e23b3b', tab: 'style' },
    { id: 'ctaTextColor', label: 'CTA Text Color',   type: 'color', default: '#ffffff', tab: 'style' },
  ],
  renderer: wideSkyscraperRenderer,
  engagements: wideSkyscraperEngagements,
  templates: [
    {
      id: 'wide-skyscraper-default',
      name: 'Rideshare & Transport',
      description: 'Promote rideshare services with full-bleed imagery and a bold CTA.',
      thumbnailUrl: '',
      sizes: [{ width: 160, height: 600, label: '160×600' }],
      defaultConfig: {
        type: 'wide-skyscraper',
        imageUrl: 'https://picsum.photos/seed/wide-skyscraper1/160/600',
        brandName: 'ScrollToday',
        headline: 'For a free first ride up to $30',
        ctaText: 'Book Now',
        overlayColor: 'rgba(0,0,0,0.5)',
        textColor: '#ffffff',
        ctaBgColor: '#e23b3b',
        ctaTextColor: '#ffffff',
      },
    },
    {
      id: 'wide-skyscraper-tech',
      name: 'Tech & SaaS',
      description: 'Drive signups with a tall sidebar image ad and text overlay.',
      thumbnailUrl: '',
      sizes: [{ width: 160, height: 600, label: '160×600' }],
      defaultConfig: {
        type: 'wide-skyscraper',
        imageUrl: TECH_IMG,
        brandName: 'TECHCO',
        headline: 'Get 20% off your first month',
        ctaText: 'Try Free',
        overlayColor: 'rgba(0,0,0,0.5)',
        textColor: '#ffffff',
        ctaBgColor: '#3b82f6',
        ctaTextColor: '#ffffff',
      },
    },
    {
      id: 'wide-skyscraper-travel',
      name: 'Travel & Booking',
      description: 'Inspire travel bookings with scenic sidebar imagery.',
      thumbnailUrl: '',
      sizes: [{ width: 160, height: 600, label: '160×600' }],
      defaultConfig: {
        type: 'wide-skyscraper',
        imageUrl: TRAVEL_IMG,
        brandName: 'WANDERLY',
        headline: 'Fly anywhere from just $99',
        ctaText: 'Book Now',
        overlayColor: 'rgba(0,0,0,0.45)',
        textColor: '#ffffff',
        ctaBgColor: '#f59e0b',
        ctaTextColor: '#1e293b',
      },
    },
  ],
}
