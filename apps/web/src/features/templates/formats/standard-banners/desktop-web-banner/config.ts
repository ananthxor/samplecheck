import type { FormatDefinition } from '../../_shared/types'
import { desktopWebBannerRenderer } from './renderer'
import { desktopWebBannerEngagements } from './engagements'

// Placeholder images — replace with company assets later
const DEFAULT_IMG = 'https://picsum.photos/seed/desktop-web-banner/1055/180'
const FOOD_IMG = 'https://picsum.photos/seed/desktop-web-banner2/1055/180'
const TRAVEL_IMG = 'https://picsum.photos/seed/desktop-web-banner3/1055/180'

export const desktopWebBannerFormat: FormatDefinition = {
  type: 'desktop-web-banner',
  name: 'Desktop Web Banner',
  description:
    'A 1055×180 wide desktop banner with full-bleed background image, optional text overlay (logo, brand, headline, CTA), and customizable overlay color.',
  category: 'standard-banners',
  fields: [
    // ── Content ──────────────────────────────────────────────────────────
    { id: 'imageUrl',  label: 'Background Image',  type: 'image', default: DEFAULT_IMG },
    { id: 'logoUrl',   label: 'Logo Image',         type: 'image', default: 'https://picsum.photos/seed/desktop-web-banner-logo/100/36' },
    { id: 'brandName', label: 'Brand Name',          type: 'text',  default: 'ScrollToday', validation: { max: 20 } },
    { id: 'headline',  label: 'Headline',            type: 'text',  default: 'Build something great', validation: { max: 50 } },
    { id: 'ctaText',   label: 'CTA Button Text',     type: 'text',  default: 'Get Started', validation: { max: 20 } },

    // ── Style ────────────────────────────────────────────────────────────
    { id: 'overlayColor', label: 'Overlay Color',    type: 'color', default: 'rgba(0,0,0,0.45)', tab: 'style' },
    { id: 'textColor',    label: 'Text Color',       type: 'color', default: '#ffffff', tab: 'style' },
    { id: 'ctaBgColor',   label: 'CTA Button Color', type: 'color', default: '#e23b3b', tab: 'style' },
    { id: 'ctaTextColor', label: 'CTA Text Color',   type: 'color', default: '#ffffff', tab: 'style' },
  ],
  renderer: desktopWebBannerRenderer,
  engagements: desktopWebBannerEngagements,
  templates: [
    {
      id: 'desktop-web-banner-tech',
      name: 'Tech & SaaS',
      description: 'Showcase your tech product with a wide full-bleed background.',
      thumbnailUrl: '',
      sizes: [{ width: 1055, height: 180, label: '1055×180' }],
      defaultConfig: {
        type: 'desktop-web-banner',
        imageUrl: 'https://picsum.photos/seed/desktop-web-banner1/1055/180',
        logoUrl: 'https://picsum.photos/seed/desktop-web-banner-logo1/100/36',
        brandName: 'ScrollToday',
        headline: 'Build something great',
        ctaText: 'Get Started',
        overlayColor: 'rgba(0,0,0,0.45)',
        textColor: '#ffffff',
        ctaBgColor: '#e23b3b',
        ctaTextColor: '#ffffff',
      },
    },
    {
      id: 'desktop-web-banner-food',
      name: 'Food & Delivery',
      description: 'Promote food services with appetizing background imagery.',
      thumbnailUrl: '',
      sizes: [{ width: 1055, height: 180, label: '1055×180' }],
      defaultConfig: {
        type: 'desktop-web-banner',
        imageUrl: FOOD_IMG,
        logoUrl: 'https://picsum.photos/seed/desktop-web-banner-logo2/100/36',
        brandName: 'FOODPANDA',
        headline: 'Delivering happiness to your door',
        ctaText: 'Order Now',
        overlayColor: 'rgba(0,0,0,0.4)',
        textColor: '#ffffff',
        ctaBgColor: '#f59e0b',
        ctaTextColor: '#1e293b',
      },
    },
    {
      id: 'desktop-web-banner-travel',
      name: 'Travel & Booking',
      description: 'Inspire travel with scenic wide-format background imagery.',
      thumbnailUrl: '',
      sizes: [{ width: 1055, height: 180, label: '1055×180' }],
      defaultConfig: {
        type: 'desktop-web-banner',
        imageUrl: TRAVEL_IMG,
        logoUrl: 'https://picsum.photos/seed/desktop-web-banner-logo3/100/36',
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
