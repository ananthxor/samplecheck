import type { FormatDefinition } from '../../_shared/types'
import { mobileIntroBannerRenderer } from './renderer'
import { mobileIntroBannerEngagements } from './engagements'

// Placeholder images — replace with company assets later
const DEFAULT_IMG = 'https://picsum.photos/seed/mobile-intro-banner/540/350'
const FOOD_IMG = 'https://picsum.photos/seed/mobile-intro-banner2/540/350'
const TRAVEL_IMG = 'https://picsum.photos/seed/mobile-intro-banner3/540/350'

export const mobileIntroBannerFormat: FormatDefinition = {
  type: 'mobile-intro-banner',
  name: 'Mobile Intro Banner',
  description:
    'A 540×350 mobile-friendly intro banner with full-bleed background image, optional text overlay (brand, headline, CTA), and customizable overlay color.',
  category: 'standard-banners',
  fields: [
    // ── Content ──────────────────────────────────────────────────────────
    { id: 'imageUrl',  label: 'Background Image',  type: 'image', default: DEFAULT_IMG },
    { id: 'brandName', label: 'Brand Name',          type: 'text',  default: 'ScrollToday', validation: { max: 20 } },
    { id: 'headline',  label: 'Headline',            type: 'text',  default: 'Build something great', validation: { max: 40 } },
    { id: 'ctaText',   label: 'CTA Button Text',     type: 'text',  default: 'Get Started', validation: { max: 20 } },

    // ── Style ────────────────────────────────────────────────────────────
    { id: 'overlayColor', label: 'Overlay Color',    type: 'color', default: 'rgba(0,0,0,0.4)', tab: 'style' },
    { id: 'textColor',    label: 'Text Color',       type: 'color', default: '#ffffff', tab: 'style' },
    { id: 'ctaBgColor',   label: 'CTA Button Color', type: 'color', default: '#e23b3b', tab: 'style' },
    { id: 'ctaTextColor', label: 'CTA Text Color',   type: 'color', default: '#ffffff', tab: 'style' },
  ],
  renderer: mobileIntroBannerRenderer,
  engagements: mobileIntroBannerEngagements,
  templates: [
    {
      id: 'mobile-intro-banner-tech',
      name: 'Tech & SaaS',
      description: 'Mobile intro banner showcasing a tech product with full-bleed imagery.',
      thumbnailUrl: '',
      sizes: [{ width: 540, height: 350, label: '540×350' }],
      defaultConfig: {
        type: 'mobile-intro-banner',
        imageUrl: 'https://picsum.photos/seed/mobile-intro-banner1/540/350',
        brandName: 'ScrollToday',
        headline: 'Build something great',
        ctaText: 'Get Started',
        overlayColor: 'rgba(0,0,0,0.4)',
        textColor: '#ffffff',
        ctaBgColor: '#e23b3b',
        ctaTextColor: '#ffffff',
      },
    },
    {
      id: 'mobile-intro-banner-food',
      name: 'Food & Delivery',
      description: 'Mobile intro banner for food delivery with appetizing background.',
      thumbnailUrl: '',
      sizes: [{ width: 540, height: 350, label: '540×350' }],
      defaultConfig: {
        type: 'mobile-intro-banner',
        imageUrl: FOOD_IMG,
        brandName: 'FOODPANDA',
        headline: 'Delivering happiness',
        ctaText: 'Order Now',
        overlayColor: 'rgba(0,0,0,0.4)',
        textColor: '#ffffff',
        ctaBgColor: '#f59e0b',
        ctaTextColor: '#1e293b',
      },
    },
    {
      id: 'mobile-intro-banner-travel',
      name: 'Travel & Booking',
      description: 'Mobile intro banner for travel services with scenic background.',
      thumbnailUrl: '',
      sizes: [{ width: 540, height: 350, label: '540×350' }],
      defaultConfig: {
        type: 'mobile-intro-banner',
        imageUrl: TRAVEL_IMG,
        brandName: 'WANDERLY',
        headline: 'Your journey starts here',
        ctaText: 'Book Now',
        overlayColor: 'rgba(0,0,0,0.35)',
        textColor: '#ffffff',
        ctaBgColor: '#2563eb',
        ctaTextColor: '#ffffff',
      },
    },
  ],
}
