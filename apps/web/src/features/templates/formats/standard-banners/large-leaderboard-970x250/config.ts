import type { FormatDefinition } from '../../_shared/types'
import { largeLeaderboard970x250Renderer } from './renderer'
import { largeLeaderboard970x250Engagements } from './engagements'

// Placeholder images — replace with company assets later
const AUTO_IMG = 'https://picsum.photos/seed/large-leaderboard-970x2501/970/250'
const FASHION_IMG = 'https://picsum.photos/seed/large-leaderboard-970x2502/970/250'
const TECH_IMG = 'https://picsum.photos/seed/large-leaderboard-970x2503/970/250'

export const largeLeaderboard970x250Format: FormatDefinition = {
  type: 'large-leaderboard-970x250',
  name: 'Large Leaderboard 970x250',
  description:
    'A 970×250 wide horizontal banner with full-bleed background image, logo, subtitle, headline, and a pill-shaped CTA button.',
  category: 'standard-banners',
  fields: [
    // ── Content ──────────────────────────────────────────────────────────
    { id: 'imageUrl',  label: 'Background Image', type: 'image', default: 'https://picsum.photos/seed/large-leaderboard-970x250/970/250' },
    { id: 'logoUrl',   label: 'Logo Image',       type: 'image', default: 'https://picsum.photos/seed/large-leaderboard-970x250-logo/100/36' },
    { id: 'subtitle',  label: 'Subtitle',         type: 'text',  default: 'The Legend Continues', validation: { max: 40 } },
    { id: 'headline',  label: 'Headline',          type: 'text',  default: 'SCROLLTODAY', validation: { max: 30 } },
    { id: 'ctaText',   label: 'CTA Text',          type: 'text',  default: 'GET STARTED', validation: { max: 20 } },

    // ── Style ────────────────────────────────────────────────────────────
    { id: 'overlayColor',  label: 'Overlay Color',    type: 'color', default: 'rgba(0,0,0,0.3)', tab: 'style' },
    { id: 'textColor',     label: 'Text Color',       type: 'color', default: '#ffffff', tab: 'style' },
    { id: 'ctaBgColor',    label: 'CTA Background',   type: 'color', default: '#ffffff', tab: 'style' },
    { id: 'ctaTextColor',  label: 'CTA Text Color',   type: 'color', default: '#c41230', tab: 'style' },
  ],
  renderer: largeLeaderboard970x250Renderer,
  engagements: largeLeaderboard970x250Engagements,
  templates: [
    {
      id: 'large-leaderboard-970x250-auto',
      name: 'Automotive',
      description: 'Wide leaderboard for automotive brands with hero car image overlay.',
      thumbnailUrl: '',
      sizes: [{ width: 970, height: 250, label: '970×250' }],
      defaultConfig: {
        type: 'large-leaderboard-970x250',
        imageUrl: AUTO_IMG,
        logoUrl: 'https://picsum.photos/seed/large-leaderboard-970x250-logo1/100/36',
        subtitle: 'The Legend Continues',
        headline: 'SCROLLTODAY',
        ctaText: 'GET STARTED',
        overlayColor: 'rgba(0,0,0,0.3)',
        textColor: '#ffffff',
        ctaBgColor: '#ffffff',
        ctaTextColor: '#c41230',
      },
    },
    {
      id: 'large-leaderboard-970x250-fashion',
      name: 'Fashion & Lifestyle',
      description: 'Wide leaderboard for fashion with elegant image overlay.',
      thumbnailUrl: '',
      sizes: [{ width: 970, height: 250, label: '970×250' }],
      defaultConfig: {
        type: 'large-leaderboard-970x250',
        imageUrl: FASHION_IMG,
        logoUrl: 'https://picsum.photos/seed/large-leaderboard-970x250-logo2/100/36',
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
      id: 'large-leaderboard-970x250-tech',
      name: 'Tech & Gadgets',
      description: 'Wide leaderboard for tech product launches.',
      thumbnailUrl: '',
      sizes: [{ width: 970, height: 250, label: '970×250' }],
      defaultConfig: {
        type: 'large-leaderboard-970x250',
        imageUrl: TECH_IMG,
        logoUrl: 'https://picsum.photos/seed/large-leaderboard-970x250-logo3/100/36',
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
