import type { FormatDefinition } from '../../_shared/types'
import { mobileLeaderboardRenderer } from './renderer'
import { mobileLeaderboardEngagements } from './engagements'

const DEFAULT_IMG = 'https://picsum.photos/seed/mobile-leaderboard/320/50'

export const mobileLeaderboardFormat: FormatDefinition = {
  type: 'mobile-leaderboard',
  name: 'Mobile Leaderboard',
  description:
    'A 320×50 compact mobile banner with a full background image, brand logo, and a CTA pill button aligned to the right.',
  category: 'standard-banners',
  fields: [
    // ── Content ──────────────────────────────────────────────────────────
    { id: 'imageUrl',  label: 'Background Image',  type: 'image', default: DEFAULT_IMG },
    { id: 'logoUrl',   label: 'Logo Image',         type: 'image', default: 'https://picsum.photos/seed/mobile-leaderboard-logo/100/36' },
    { id: 'brandName', label: 'Brand Name',          type: 'text',  default: 'ScrollToday', validation: { max: 15 } },
    { id: 'ctaText',   label: 'CTA Button Text',    type: 'text',  default: 'Get Started', validation: { max: 15 } },

    // ── Style ────────────────────────────────────────────────────────────
    { id: 'bgColor',      label: 'Background Color', type: 'color', default: '#fef9ef', tab: 'style' },
    { id: 'textColor',    label: 'Text Color',        type: 'color', default: '#1e293b', tab: 'style' },
    { id: 'ctaBgColor',   label: 'CTA Button Color',  type: 'color', default: '#e23b3b', tab: 'style' },
    { id: 'ctaTextColor', label: 'CTA Text Color',    type: 'color', default: '#ffffff', tab: 'style' },
  ],
  renderer: mobileLeaderboardRenderer,
  engagements: mobileLeaderboardEngagements,
  templates: [
    {
      id: 'mobile-leaderboard-food',
      name: 'Food & Delivery',
      description: 'Compact mobile banner for food delivery with product imagery.',
      thumbnailUrl: '',
      sizes: [{ width: 320, height: 50, label: '320×50' }],
      defaultConfig: {
        type: 'mobile-leaderboard',
        imageUrl: 'https://picsum.photos/seed/mobile-leaderboard1/320/50',
        logoUrl: 'https://picsum.photos/seed/mobile-leaderboard-logo1/100/36',
        brandName: 'ScrollToday',
        ctaText: 'Get Started',
        bgColor: '#fef9ef',
        textColor: '#1e293b',
        ctaBgColor: '#e23b3b',
        ctaTextColor: '#ffffff',
      },
    },
    {
      id: 'mobile-leaderboard-tech',
      name: 'Tech & SaaS',
      description: 'Compact mobile banner for tech products.',
      thumbnailUrl: '',
      sizes: [{ width: 320, height: 50, label: '320×50' }],
      defaultConfig: {
        type: 'mobile-leaderboard',
        imageUrl: 'https://picsum.photos/seed/mobile-leaderboard2/320/50',
        logoUrl: 'https://picsum.photos/seed/mobile-leaderboard-logo2/100/36',
        brandName: 'TECHCO',
        ctaText: 'Try Free',
        bgColor: '#f8fafc',
        textColor: '#0f172a',
        ctaBgColor: '#2563eb',
        ctaTextColor: '#ffffff',
      },
    },
    {
      id: 'mobile-leaderboard-travel',
      name: 'Travel & Booking',
      description: 'Compact mobile banner for travel and booking services.',
      thumbnailUrl: '',
      sizes: [{ width: 320, height: 50, label: '320×50' }],
      defaultConfig: {
        type: 'mobile-leaderboard',
        imageUrl: 'https://picsum.photos/seed/mobile-leaderboard3/320/50',
        logoUrl: 'https://picsum.photos/seed/mobile-leaderboard-logo3/100/36',
        brandName: 'WANDERLY',
        ctaText: 'Book Now',
        bgColor: '#fffbeb',
        textColor: '#1e293b',
        ctaBgColor: '#f59e0b',
        ctaTextColor: '#1e293b',
      },
    },
  ],
}
