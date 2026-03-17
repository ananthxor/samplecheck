import type { FormatDefinition } from '../../_shared/types'
import { largeLeaderboardRenderer } from './renderer'
import { largeLeaderboardEngagements } from './engagements'

// Placeholder images — replace with company assets later
const AUTO_IMG = 'https://picsum.photos/seed/large-leaderboard1/728/300'
const FASHION_IMG = 'https://picsum.photos/seed/large-leaderboard2/728/300'
const TECH_IMG = 'https://picsum.photos/seed/large-leaderboard3/728/300'

export const largeLeaderboardFormat: FormatDefinition = {
  type: 'large-leaderboard',
  name: 'Large Leaderboard',
  description:
    'A 728×300 image-overlay banner with full-bleed background, logo, subtitle, headline, and a CTA button.',
  category: 'standard-banners',
  fields: [
    // ── Content ──────────────────────────────────────────────────────────
    { id: 'imageUrl', label: 'Background Image', type: 'image', default: 'https://picsum.photos/seed/large-leaderboard/728/300' },
    { id: 'logoUrl',    label: 'Logo Image',       type: 'image', default: 'https://picsum.photos/seed/large-leaderboard-logo/100/36' },
    { id: 'subtitle',   label: 'Subtitle',             type: 'text', default: 'The Legend Continues', validation: { max: 40 } },
    { id: 'headline',   label: 'Headline',             type: 'text', default: 'SCROLLTODAY', validation: { max: 30 } },
    { id: 'ctaText',    label: 'CTA Text',             type: 'text', default: 'GET STARTED', validation: { max: 20 } },

    // ── Style ────────────────────────────────────────────────────────────
    { id: 'overlayColor',  label: 'Overlay Color',    type: 'color', default: 'rgba(0,0,0,0.3)', tab: 'style' },
    { id: 'textColor',     label: 'Text Color',       type: 'color', default: '#ffffff', tab: 'style' },
    { id: 'ctaBgColor',    label: 'CTA Background',   type: 'color', default: '#ffffff', tab: 'style' },
    { id: 'ctaTextColor',  label: 'CTA Text Color',   type: 'color', default: '#e23b3b', tab: 'style' },
  ],
  renderer: largeLeaderboardRenderer,
  engagements: largeLeaderboardEngagements,
  templates: [
    {
      id: 'large-leaderboard-auto',
      name: 'Automotive',
      description: 'Large leaderboard for automotive brands with hero car image overlay.',
      thumbnailUrl: '',
      sizes: [{ width: 728, height: 300, label: '728×300' }],
      defaultConfig: {
        type: 'large-leaderboard',
        imageUrl: AUTO_IMG,
        logoUrl: 'https://picsum.photos/seed/large-leaderboard-logo1/100/36',
        subtitle: 'The Legend Continues',
        headline: 'SCROLLTODAY',
        ctaText: 'GET STARTED',
        overlayColor: 'rgba(0,0,0,0.3)',
        textColor: '#ffffff',
        ctaBgColor: '#ffffff',
        ctaTextColor: '#e23b3b',
      },
    },
    {
      id: 'large-leaderboard-fashion',
      name: 'Fashion & Lifestyle',
      description: 'Large leaderboard for fashion with elegant image overlay.',
      thumbnailUrl: '',
      sizes: [{ width: 728, height: 300, label: '728×300' }],
      defaultConfig: {
        type: 'large-leaderboard',
        imageUrl: FASHION_IMG,
        logoUrl: 'https://picsum.photos/seed/large-leaderboard-logo2/100/36',
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
      id: 'large-leaderboard-tech',
      name: 'Tech & Gadgets',
      description: 'Large leaderboard for tech product launches.',
      thumbnailUrl: '',
      sizes: [{ width: 728, height: 300, label: '728×300' }],
      defaultConfig: {
        type: 'large-leaderboard',
        imageUrl: TECH_IMG,
        logoUrl: 'https://picsum.photos/seed/large-leaderboard-logo3/100/36',
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
