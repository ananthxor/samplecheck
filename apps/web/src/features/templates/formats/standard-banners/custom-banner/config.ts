import type { FormatDefinition, TemplateSize } from '../../_shared/types'
import { customBannerRenderer } from './renderer'
import { customBannerEngagements } from './engagements'

/** Common preset sizes available in the toolbar dropdown */
const PRESET_SIZES: TemplateSize[] = [
  { width: 300, height: 250, label: '300×250 (Medium Rectangle)' },
  { width: 728, height: 90, label: '728×90 (Leaderboard)' },
  { width: 160, height: 600, label: '160×600 (Wide Skyscraper)' },
  { width: 970, height: 250, label: '970×250 (Billboard)' },
  { width: 320, height: 100, label: '320×100 (Mobile Banner)' },
  { width: 300, height: 600, label: '300×600 (Half Page)' },
]

export const customBannerFormat: FormatDefinition = {
  type: 'custom-banner',
  name: 'Custom Banner',
  description:
    'A fully responsive image-overlay banner with user-defined dimensions. Choose from common preset sizes or specify your own custom width and height.',
  category: 'standard-banners',
  customSizable: true,
  fields: [
    // ── Content ──────────────────────────────────────────────────────────
    { id: 'imageUrl',  label: 'Background Image', type: 'image', default: 'https://picsum.photos/seed/custom-banner/300/250' },
    { id: 'logoUrl',   label: 'Logo Image',       type: 'image', default: 'https://picsum.photos/seed/custom-banner-logo/100/36' },
    { id: 'subtitle',  label: 'Subtitle',         type: 'text',  default: 'Your Story, Your Size', validation: { max: 40 } },
    { id: 'headline',  label: 'Headline',         type: 'text',  default: 'SCROLLTODAY', validation: { max: 30 } },
    { id: 'ctaText',   label: 'CTA Text',         type: 'text',  default: 'LEARN MORE', validation: { max: 20 } },

    // ── Style ────────────────────────────────────────────────────────────
    { id: 'overlayColor',  label: 'Overlay Color',    type: 'color', default: 'rgba(0,0,0,0.4)',  tab: 'style' },
    { id: 'textColor',     label: 'Text Color',       type: 'color', default: '#ffffff',           tab: 'style' },
    { id: 'ctaBgColor',    label: 'CTA Background',   type: 'color', default: '#ffffff',           tab: 'style' },
    { id: 'ctaTextColor',  label: 'CTA Text Color',   type: 'color', default: '#e23b3b',           tab: 'style' },
  ],
  renderer: customBannerRenderer,
  engagements: customBannerEngagements,
  templates: [
    {
      id: 'custom-banner-brand',
      name: 'Brand Awareness',
      description: 'Versatile custom-size banner for brand campaigns. Choose any dimension to fit your placement.',
      thumbnailUrl: '',
      sizes: PRESET_SIZES,
      defaultConfig: {
        type: 'custom-banner',
        imageUrl: 'https://picsum.photos/seed/custom-banner1/300/250',
        logoUrl: 'https://picsum.photos/seed/custom-banner-logo1/100/36',
        subtitle: 'Your Story, Your Size',
        headline: 'SCROLLTODAY',
        ctaText: 'LEARN MORE',
        overlayColor: 'rgba(0,0,0,0.4)',
        textColor: '#ffffff',
        ctaBgColor: '#ffffff',
        ctaTextColor: '#e23b3b',
      },
    },
    {
      id: 'custom-banner-fashion',
      name: 'Fashion & Lifestyle',
      description: 'Custom-size banner for fashion brands with elegant styling.',
      thumbnailUrl: '',
      sizes: PRESET_SIZES,
      defaultConfig: {
        type: 'custom-banner',
        imageUrl: 'https://picsum.photos/seed/custom-banner2/300/250',
        logoUrl: 'https://picsum.photos/seed/custom-banner-logo2/100/36',
        subtitle: 'New Collection',
        headline: 'SUMMER ESSENTIALS',
        ctaText: 'SHOP NOW',
        overlayColor: 'rgba(0,0,0,0.35)',
        textColor: '#ffffff',
        ctaBgColor: '#f5f5f5',
        ctaTextColor: '#1a1a1a',
      },
    },
    {
      id: 'custom-banner-tech',
      name: 'Tech & Gadgets',
      description: 'Custom-size banner for tech product launches.',
      thumbnailUrl: '',
      sizes: PRESET_SIZES,
      defaultConfig: {
        type: 'custom-banner',
        imageUrl: 'https://picsum.photos/seed/custom-banner3/300/250',
        logoUrl: 'https://picsum.photos/seed/custom-banner-logo3/100/36',
        subtitle: 'Introducing the Future',
        headline: 'NEXT GEN PRO',
        ctaText: 'PRE-ORDER',
        overlayColor: 'rgba(0,0,0,0.45)',
        textColor: '#ffffff',
        ctaBgColor: '#3b82f6',
        ctaTextColor: '#ffffff',
      },
    },
  ],
}
