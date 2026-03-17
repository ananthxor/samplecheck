import type { FormatDefinition } from '../../_shared/types'
import { leaderboardRenderer } from './renderer'
import { leaderboardEngagements } from './engagements'

// Placeholder images — replace with company assets later
const DEFAULT_IMG = 'https://picsum.photos/seed/leaderboard/728/90'
const FOOD_IMG = 'https://picsum.photos/seed/leaderboard2/728/90'
const TRAVEL_IMG = 'https://picsum.photos/seed/leaderboard3/728/90'

export const leaderboardFormat: FormatDefinition = {
  type: 'leaderboard',
  name: 'Leaderboard',
  description:
    'A 728×90 standard display leaderboard with full-bleed background image, optional text overlay (logo, headline, CTA), and customizable overlay color.',
  category: 'standard-banners',
  fields: [
    // ── Content ──────────────────────────────────────────────────────────
    { id: 'imageUrl',  label: 'Background Image',  type: 'image', default: DEFAULT_IMG },
    { id: 'logoUrl',   label: 'Logo Image',         type: 'image', default: 'https://picsum.photos/seed/leaderboard-logo/100/36' },
    { id: 'headline',  label: 'Headline',           type: 'text',  default: 'Your search ends here', validation: { max: 40 } },
    { id: 'ctaText',   label: 'CTA Button Text',    type: 'text',  default: 'Install Now', validation: { max: 20 } },

    // ── Style ────────────────────────────────────────────────────────────
    { id: 'overlayColor', label: 'Overlay Color',    type: 'color', default: 'rgba(0,0,0,0.4)', tab: 'style' },
    { id: 'textColor',    label: 'Text Color',       type: 'color', default: '#ffffff', tab: 'style' },
    { id: 'ctaBgColor',   label: 'CTA Button Color', type: 'color', default: '#e23b3b', tab: 'style' },
    { id: 'ctaTextColor', label: 'CTA Text Color',   type: 'color', default: '#ffffff', tab: 'style' },
  ],
  renderer: leaderboardRenderer,
  engagements: leaderboardEngagements,
  templates: [
    {
      id: 'leaderboard-default',
      name: 'App Install',
      description: 'Drive app downloads with a full-bleed background and bold CTA overlay.',
      thumbnailUrl: '',
      sizes: [{ width: 728, height: 90, label: '728×90' }],
      defaultConfig: {
        type: 'leaderboard',
        imageUrl: 'https://picsum.photos/seed/leaderboard1/728/90',
        logoUrl: 'https://picsum.photos/seed/leaderboard-logo1/100/36',
        headline: 'Your search ends here',
        ctaText: 'Install Now',
        overlayColor: 'rgba(0,0,0,0.4)',
        textColor: '#ffffff',
        ctaBgColor: '#e23b3b',
        ctaTextColor: '#ffffff',
      },
    },
    {
      id: 'leaderboard-food',
      name: 'Food & Delivery',
      description: 'Promote food delivery with appetizing background imagery.',
      thumbnailUrl: '',
      sizes: [{ width: 728, height: 90, label: '728×90' }],
      defaultConfig: {
        type: 'leaderboard',
        imageUrl: FOOD_IMG,
        logoUrl: 'https://picsum.photos/seed/leaderboard-logo2/100/36',
        headline: 'Delicious food at your doorstep',
        ctaText: 'Order Now',
        overlayColor: 'rgba(0,0,0,0.45)',
        textColor: '#ffffff',
        ctaBgColor: '#f59e0b',
        ctaTextColor: '#1e293b',
      },
    },
    {
      id: 'leaderboard-travel',
      name: 'Travel & Booking',
      description: 'Inspire travel bookings with scenic background imagery.',
      thumbnailUrl: '',
      sizes: [{ width: 728, height: 90, label: '728×90' }],
      defaultConfig: {
        type: 'leaderboard',
        imageUrl: TRAVEL_IMG,
        logoUrl: 'https://picsum.photos/seed/leaderboard-logo3/100/36',
        headline: 'Explore the world',
        ctaText: 'Book Now',
        overlayColor: 'rgba(0,0,0,0.35)',
        textColor: '#ffffff',
        ctaBgColor: '#2563eb',
        ctaTextColor: '#ffffff',
      },
    },
  ],
}
