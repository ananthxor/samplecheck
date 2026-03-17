import type { FormatDefinition } from '../../_shared/types'
import { desktopIntroBannerRenderer } from './renderer'
import { desktopIntroBannerEngagements } from './engagements'

// Placeholder images — replace with company assets later
const DEFAULT_IMG = 'https://picsum.photos/seed/desktop-intro-banner/1600/450'
const ECOM_IMG = 'https://picsum.photos/seed/desktop-intro-banner2/1600/450'
const FINTECH_IMG = 'https://picsum.photos/seed/desktop-intro-banner3/1600/450'

export const desktopIntroBannerFormat: FormatDefinition = {
  type: 'desktop-intro-banner',
  name: 'Desktop Intro Banner',
  description:
    'A 1600×450 large desktop intro banner with full-bleed background image, optional text overlay (logo, brand, headline, CTA), and customizable overlay color.',
  category: 'standard-banners',
  fields: [
    // ── Content ──────────────────────────────────────────────────────────
    { id: 'imageUrl',  label: 'Background Image',  type: 'image', default: DEFAULT_IMG },
    { id: 'logoUrl',   label: 'Logo Image',         type: 'image', default: 'https://picsum.photos/seed/desktop-intro-banner-logo/100/36' },
    { id: 'brandName', label: 'Brand Name',          type: 'text',  default: 'ScrollToday', validation: { max: 20 } },
    { id: 'headline',  label: 'Headline',            type: 'text',  default: 'Build something great', validation: { max: 50 } },
    { id: 'ctaText',   label: 'CTA Button Text',     type: 'text',  default: 'Get Started', validation: { max: 20 } },

    // ── Style ────────────────────────────────────────────────────────────
    { id: 'overlayColor', label: 'Overlay Color',    type: 'color', default: 'rgba(0,0,0,0.4)', tab: 'style' },
    { id: 'textColor',    label: 'Text Color',       type: 'color', default: '#ffffff', tab: 'style' },
    { id: 'ctaBgColor',   label: 'CTA Button Color', type: 'color', default: '#e23b3b', tab: 'style' },
    { id: 'ctaTextColor', label: 'CTA Text Color',   type: 'color', default: '#ffffff', tab: 'style' },
  ],
  renderer: desktopIntroBannerRenderer,
  engagements: desktopIntroBannerEngagements,
  templates: [
    {
      id: 'desktop-intro-banner-tech',
      name: 'Tech & SaaS',
      description: 'Large intro banner showcasing a tech product with full-bleed imagery.',
      thumbnailUrl: '',
      sizes: [{ width: 1600, height: 450, label: '1600×450' }],
      defaultConfig: {
        type: 'desktop-intro-banner',
        imageUrl: 'https://picsum.photos/seed/desktop-intro-banner1/1600/450',
        logoUrl: 'https://picsum.photos/seed/desktop-intro-banner-logo1/100/36',
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
      id: 'desktop-intro-banner-ecommerce',
      name: 'E-Commerce',
      description: 'Large intro banner for an online store with product showcase.',
      thumbnailUrl: '',
      sizes: [{ width: 1600, height: 450, label: '1600×450' }],
      defaultConfig: {
        type: 'desktop-intro-banner',
        imageUrl: ECOM_IMG,
        logoUrl: 'https://picsum.photos/seed/desktop-intro-banner-logo2/100/36',
        brandName: 'SHOPWAVE',
        headline: 'Shop smarter, not harder',
        ctaText: 'Shop Now',
        overlayColor: 'rgba(0,0,0,0.45)',
        textColor: '#ffffff',
        ctaBgColor: '#f97316',
        ctaTextColor: '#ffffff',
      },
    },
    {
      id: 'desktop-intro-banner-fintech',
      name: 'Fintech',
      description: 'Large intro banner for financial services with a modern look.',
      thumbnailUrl: '',
      sizes: [{ width: 1600, height: 450, label: '1600×450' }],
      defaultConfig: {
        type: 'desktop-intro-banner',
        imageUrl: FINTECH_IMG,
        logoUrl: 'https://picsum.photos/seed/desktop-intro-banner-logo3/100/36',
        brandName: 'PAYFLOW',
        headline: 'Money moves made simple',
        ctaText: 'Start Free',
        overlayColor: 'rgba(0,0,0,0.4)',
        textColor: '#ffffff',
        ctaBgColor: '#818cf8',
        ctaTextColor: '#ffffff',
      },
    },
  ],
}
