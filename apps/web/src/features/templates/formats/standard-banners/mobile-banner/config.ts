import type { FormatDefinition } from '../../_shared/types'
import { mobileBannerRenderer } from './renderer'
import { mobileBannerEngagements } from './engagements'

export const mobileBannerFormat: FormatDefinition = {
  type: 'mobile-banner-320x100',
  name: 'Mobile Banner 320×100',
  description:
    'A 320×100 compact image-overlay mobile banner with full-bleed background, subtitle, headline, logo badge, and a CTA pill.',
  category: 'standard-banners',
  fields: [
    // ── Content ──────────────────────────────────────────────────────────
    { id: 'imageUrl',  label: 'Background Image', type: 'image', default: 'https://picsum.photos/seed/mobile-banner-320x100/320/100' },
    { id: 'logoUrl',   label: 'Logo Image',       type: 'image', default: 'https://picsum.photos/seed/mobile-banner-320x100-logo/100/36' },
    { id: 'subtitle',  label: 'Subtitle',         type: 'text',  default: 'The Legend Continues', validation: { max: 35 } },
    { id: 'headline',  label: 'Headline',         type: 'text',  default: 'SCROLLTODAY', validation: { max: 25 } },
    { id: 'ctaText',   label: 'CTA Text',         type: 'text',  default: 'SHOP NOW', validation: { max: 15 } },

    // ── Style ────────────────────────────────────────────────────────────
    { id: 'overlayColor',  label: 'Overlay Color',    type: 'color', default: 'rgba(0,0,0,0.4)',  tab: 'style' },
    { id: 'textColor',     label: 'Text Color',       type: 'color', default: '#ffffff',           tab: 'style' },
    { id: 'ctaBgColor',    label: 'CTA Background',   type: 'color', default: '#ffffff',           tab: 'style' },
    { id: 'ctaTextColor',  label: 'CTA Text Color',   type: 'color', default: '#e23b3b',           tab: 'style' },
  ],
  renderer: mobileBannerRenderer,
  engagements: mobileBannerEngagements,
  templates: [
    {
      id: 'mobile-banner-320x100-brand',
      name: 'Brand Awareness',
      description: 'Compact mobile banner for brand awareness with bold headline and logo.',
      thumbnailUrl: '',
      sizes: [{ width: 320, height: 100, label: '320×100' }],
      defaultConfig: {
        type: 'mobile-banner-320x100',
        imageUrl: 'https://picsum.photos/seed/mobile-banner-320x1001/320/100',
        logoUrl: 'https://picsum.photos/seed/mobile-banner-320x100-logo1/100/36',
        subtitle: 'The Legend Continues',
        headline: 'SCROLLTODAY',
        ctaText: 'SHOP NOW',
        overlayColor: 'rgba(0,0,0,0.4)',
        textColor: '#ffffff',
        ctaBgColor: '#ffffff',
        ctaTextColor: '#e23b3b',
      },
    },
    {
      id: 'mobile-banner-320x100-fashion',
      name: 'Fashion & Lifestyle',
      description: 'Compact mobile banner for fashion brands with elegant styling.',
      thumbnailUrl: '',
      sizes: [{ width: 320, height: 100, label: '320×100' }],
      defaultConfig: {
        type: 'mobile-banner-320x100',
        imageUrl: 'https://picsum.photos/seed/mobile-banner-320x1002/320/100',
        logoUrl: 'https://picsum.photos/seed/mobile-banner-320x100-logo2/100/36',
        subtitle: 'New Season Drop',
        headline: 'SUMMER VIBES',
        ctaText: 'EXPLORE',
        overlayColor: 'rgba(0,0,0,0.35)',
        textColor: '#ffffff',
        ctaBgColor: '#f5f5f5',
        ctaTextColor: '#1a1a1a',
      },
    },
    {
      id: 'mobile-banner-320x100-tech',
      name: 'Tech & Gadgets',
      description: 'Compact mobile banner for tech product launches and promotions.',
      thumbnailUrl: '',
      sizes: [{ width: 320, height: 100, label: '320×100' }],
      defaultConfig: {
        type: 'mobile-banner-320x100',
        imageUrl: 'https://picsum.photos/seed/mobile-banner-320x1003/320/100',
        logoUrl: 'https://picsum.photos/seed/mobile-banner-320x100-logo3/100/36',
        subtitle: 'Just Released',
        headline: 'PIXEL PRO 9',
        ctaText: 'PRE-ORDER',
        overlayColor: 'rgba(0,0,0,0.45)',
        textColor: '#ffffff',
        ctaBgColor: '#3b82f6',
        ctaTextColor: '#ffffff',
      },
    },
  ],
}
