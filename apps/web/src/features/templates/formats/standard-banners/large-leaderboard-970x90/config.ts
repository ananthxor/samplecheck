import type { FormatDefinition } from '../../_shared/types'
import { largeLeaderboard970x90Renderer } from './renderer'
import { largeLeaderboard970x90Engagements } from './engagements'

export const largeLeaderboard970x90Format: FormatDefinition = {
  type: 'large-leaderboard-970x90',
  name: 'Large Leaderboard 970×90',
  description:
    'A 970×90 wide image-overlay banner with full-bleed background, logo, subtitle, headline, and a CTA button.',
  category: 'standard-banners',
  fields: [
    // ── Content ──────────────────────────────────────────────────────────
    { id: 'imageUrl',  label: 'Background Image', type: 'image', default: 'https://picsum.photos/seed/large-leaderboard-970x90/970/90' },
    { id: 'logoUrl',   label: 'Logo Image',       type: 'image', default: 'https://picsum.photos/seed/large-leaderboard-970x90-logo/100/36' },
    { id: 'subtitle',  label: 'Subtitle',         type: 'text',  default: 'The Legend Continues', validation: { max: 40 } },
    { id: 'headline',  label: 'Headline',         type: 'text',  default: 'SCROLLTODAY', validation: { max: 30 } },
    { id: 'ctaText',   label: 'CTA Text',         type: 'text',  default: 'GET STARTED', validation: { max: 20 } },

    // ── Style ────────────────────────────────────────────────────────────
    { id: 'overlayColor',  label: 'Overlay Color',    type: 'color', default: 'rgba(0,0,0,0.35)', tab: 'style' },
    { id: 'textColor',     label: 'Text Color',       type: 'color', default: '#ffffff',           tab: 'style' },
    { id: 'ctaBgColor',    label: 'CTA Background',   type: 'color', default: '#ffffff',           tab: 'style' },
    { id: 'ctaTextColor',  label: 'CTA Text Color',   type: 'color', default: '#e23b3b',           tab: 'style' },
  ],
  renderer: largeLeaderboard970x90Renderer,
  engagements: largeLeaderboard970x90Engagements,
  templates: [
    {
      id: 'large-leaderboard-970x90-brand',
      name: 'Brand Awareness',
      description: 'Wide image-overlay banner for brand awareness with bold headline and CTA.',
      thumbnailUrl: '',
      sizes: [{ width: 970, height: 90, label: '970×90' }],
      defaultConfig: {
        type: 'large-leaderboard-970x90',
        imageUrl: 'https://picsum.photos/seed/large-leaderboard-970x901/970/90',
        logoUrl: 'https://picsum.photos/seed/large-leaderboard-970x90-logo1/100/36',
        subtitle: 'The Legend Continues',
        headline: 'SCROLLTODAY',
        ctaText: 'GET STARTED',
        overlayColor: 'rgba(0,0,0,0.35)',
        textColor: '#ffffff',
        ctaBgColor: '#ffffff',
        ctaTextColor: '#e23b3b',
      },
    },
    {
      id: 'large-leaderboard-970x90-fashion',
      name: 'Fashion & Lifestyle',
      description: 'Wide image-overlay banner for fashion brands with elegant styling.',
      thumbnailUrl: '',
      sizes: [{ width: 970, height: 90, label: '970×90' }],
      defaultConfig: {
        type: 'large-leaderboard-970x90',
        imageUrl: 'https://picsum.photos/seed/large-leaderboard-970x902/970/90',
        logoUrl: 'https://picsum.photos/seed/large-leaderboard-970x90-logo2/100/36',
        subtitle: 'New Season Collection',
        headline: 'SUMMER ESSENTIALS',
        ctaText: 'SHOP NOW',
        overlayColor: 'rgba(0,0,0,0.35)',
        textColor: '#ffffff',
        ctaBgColor: '#f5f5f5',
        ctaTextColor: '#1a1a1a',
      },
    },
    {
      id: 'large-leaderboard-970x90-tech',
      name: 'Tech & Gadgets',
      description: 'Wide image-overlay banner for tech product launches.',
      thumbnailUrl: '',
      sizes: [{ width: 970, height: 90, label: '970×90' }],
      defaultConfig: {
        type: 'large-leaderboard-970x90',
        imageUrl: 'https://picsum.photos/seed/large-leaderboard-970x903/970/90',
        logoUrl: 'https://picsum.photos/seed/large-leaderboard-970x90-logo3/100/36',
        subtitle: 'Introducing the Future',
        headline: 'GALAXY S25 ULTRA',
        ctaText: 'PRE-ORDER NOW',
        overlayColor: 'rgba(0,0,0,0.4)',
        textColor: '#ffffff',
        ctaBgColor: '#3b82f6',
        ctaTextColor: '#ffffff',
      },
    },
  ],
}
