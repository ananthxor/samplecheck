import type { FormatDefinition } from '../../_shared/types'
import { largeRectangleRenderer } from './renderer'
import { largeRectangleEngagements } from './engagements'

// Placeholder images — replace with company assets later
const DEFAULT_IMG = 'https://picsum.photos/seed/large-rectangle/336/280'

export const largeRectangleFormat: FormatDefinition = {
  type: 'large-rectangle',
  name: 'Large Rectangle',
  description:
    'A 336×280 standard display ad with full-bleed background image, optional text overlay (logo, brand, headline, CTA), and customizable overlay color.',
  category: 'standard-banners',
  fields: [
    // ── Content ──────────────────────────────────────────────────────────
    { id: 'imageUrl',  label: 'Background Image',  type: 'image', default: DEFAULT_IMG },
    { id: 'logoUrl',   label: 'Logo Image',         type: 'image', default: 'https://picsum.photos/seed/large-rectangle-logo/100/36' },
    { id: 'brandName', label: 'Brand Name',          type: 'text',  default: 'ScrollToday', validation: { max: 20 } },
    { id: 'headline',  label: 'Headline',            type: 'text',  default: 'Need a reason to dash?', validation: { max: 40 } },
    { id: 'ctaText',   label: 'CTA Button Text',     type: 'text',  default: 'Get Started', validation: { max: 20 } },

    // ── Style ────────────────────────────────────────────────────────────
    { id: 'overlayColor', label: 'Overlay Color',    type: 'color', default: 'rgba(0,0,0,0.5)', tab: 'style' },
    { id: 'textColor',    label: 'Text Color',       type: 'color', default: '#ffffff', tab: 'style' },
    { id: 'ctaBgColor',   label: 'CTA Button Color', type: 'color', default: '#e23b3b', tab: 'style' },
    { id: 'ctaTextColor', label: 'CTA Text Color',   type: 'color', default: '#ffffff', tab: 'style' },
  ],
  renderer: largeRectangleRenderer,
  engagements: largeRectangleEngagements,
  templates: [
    {
      id: 'large-rectangle-default',
      name: 'App Install',
      description: 'Drive app downloads with a full-bleed background and bold CTA overlay.',
      thumbnailUrl: '',
      sizes: [{ width: 336, height: 280, label: '336×280' }],
      defaultConfig: {
        type: 'large-rectangle',
        imageUrl: 'https://picsum.photos/seed/large-rectangle1/336/280',
        logoUrl: 'https://picsum.photos/seed/large-rectangle-logo1/100/36',
        brandName: 'ScrollToday',
        headline: 'Need a reason to dash?',
        ctaText: 'Get Started',
        overlayColor: 'rgba(0,0,0,0.5)',
        textColor: '#ffffff',
        ctaBgColor: '#e23b3b',
        ctaTextColor: '#ffffff',
      },
    },
    {
      id: 'large-rectangle-fashion',
      name: 'Fashion & Lifestyle',
      description: 'Showcase fashion products with full-bleed lifestyle imagery.',
      thumbnailUrl: '',
      sizes: [{ width: 336, height: 280, label: '336×280' }],
      defaultConfig: {
        type: 'large-rectangle',
        imageUrl: 'https://picsum.photos/seed/large-rectangle2/336/280',
        logoUrl: 'https://picsum.photos/seed/large-rectangle-logo2/100/36',
        brandName: 'LUXE',
        headline: 'New arrivals just dropped',
        ctaText: 'Shop Now',
        overlayColor: 'rgba(0,0,0,0.45)',
        textColor: '#ffffff',
        ctaBgColor: '#f59e0b',
        ctaTextColor: '#1e293b',
      },
    },
    {
      id: 'large-rectangle-travel',
      name: 'Travel & Booking',
      description: 'Inspire travel bookings with scenic background imagery.',
      thumbnailUrl: '',
      sizes: [{ width: 336, height: 280, label: '336×280' }],
      defaultConfig: {
        type: 'large-rectangle',
        imageUrl: 'https://picsum.photos/seed/large-rectangle3/336/280',
        logoUrl: 'https://picsum.photos/seed/large-rectangle-logo3/100/36',
        brandName: 'WANDERLY',
        headline: 'Your adventure awaits',
        ctaText: 'Book Now',
        overlayColor: 'rgba(0,0,0,0.4)',
        textColor: '#ffffff',
        ctaBgColor: '#2563eb',
        ctaTextColor: '#ffffff',
      },
    },
  ],
}
