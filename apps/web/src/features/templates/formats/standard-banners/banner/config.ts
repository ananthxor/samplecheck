import type { FormatDefinition } from '../../_shared/types'
import { bannerRenderer } from './renderer'
import { bannerEngagements } from './engagements'

// Placeholder images — replace with company assets later
const DEFAULT_IMG = 'https://picsum.photos/seed/banner/468/60'

export const bannerFormat: FormatDefinition = {
  type: 'banner',
  name: 'Banner',
  description:
    'A 468×60 standard display banner with full background image, logo, brand name, optional tagline, and CTA button. Classic horizontal format for header and content placements.',
  category: 'standard-banners',
  fields: [
    // ── Content ──────────────────────────────────────────────────────────
    { id: 'imageUrl',  label: 'Background Image',   type: 'image',  default: DEFAULT_IMG },
    { id: 'logoUrl',   label: 'Logo Image',          type: 'image',  default: 'https://picsum.photos/seed/banner-logo/100/36' },
    { id: 'brandName', label: 'Brand Name',           type: 'text',   default: 'ScrollToday', validation: { max: 20 } },
    { id: 'tagline',   label: 'Tagline',              type: 'text',   default: '', validation: { max: 40 } },
    { id: 'ctaText',   label: 'CTA Button Text',      type: 'text',   default: 'Get Started', validation: { max: 20 } },

    // ── Style ────────────────────────────────────────────────────────────
    { id: 'textColor',    label: 'Text Color',        type: 'color', default: '#222222', tab: 'style' },
    { id: 'ctaBgColor',   label: 'CTA Button Color',  type: 'color', default: '#e23b3b', tab: 'style' },
    { id: 'ctaTextColor', label: 'CTA Text Color',    type: 'color', default: '#ffffff', tab: 'style' },
  ],
  renderer: bannerRenderer,
  engagements: bannerEngagements,
  templates: [
    {
      id: 'banner-food',
      name: 'Food & Delivery',
      description: 'Promote food delivery or restaurant services with appetizing imagery.',
      thumbnailUrl: '',
      sizes: [{ width: 468, height: 60, label: '468×60' }],
      defaultConfig: {
        type: 'banner',
        imageUrl: 'https://picsum.photos/seed/banner1/468/60',
        logoUrl: 'https://picsum.photos/seed/banner-logo1/100/36',
        brandName: 'ScrollToday',
        tagline: '',
        ctaText: 'Get Started',
        textColor: '#222222',
        ctaBgColor: '#e23b3b',
        ctaTextColor: '#ffffff',
      },
    },
    {
      id: 'banner-tech',
      name: 'Tech & SaaS',
      description: 'Drive signups for tech products or SaaS platforms.',
      thumbnailUrl: '',
      sizes: [{ width: 468, height: 60, label: '468×60' }],
      defaultConfig: {
        type: 'banner',
        imageUrl: 'https://picsum.photos/seed/banner2/468/60',
        logoUrl: 'https://picsum.photos/seed/banner-logo2/100/36',
        brandName: 'TECHCO',
        tagline: 'Start your free trial',
        ctaText: 'Try Free',
        textColor: '#ffffff',
        ctaBgColor: '#2563eb',
        ctaTextColor: '#ffffff',
      },
    },
    {
      id: 'banner-travel',
      name: 'Travel & Booking',
      description: 'Inspire travel with scenic imagery and a booking CTA.',
      thumbnailUrl: '',
      sizes: [{ width: 468, height: 60, label: '468×60' }],
      defaultConfig: {
        type: 'banner',
        imageUrl: 'https://picsum.photos/seed/banner3/468/60',
        logoUrl: 'https://picsum.photos/seed/banner-logo3/100/36',
        brandName: 'WANDERLY',
        tagline: 'Explore the world',
        ctaText: 'Book Now',
        textColor: '#1e293b',
        ctaBgColor: '#f59e0b',
        ctaTextColor: '#1e293b',
      },
    },
  ],
}
