import type { FormatDefinition } from '../../_shared/types'
import { interstitialRenderer } from './renderer'
import { interstitialEngagements } from './engagements'

// Placeholder images — replace with company assets later
const DEFAULT_PRODUCT = 'https://picsum.photos/seed/interstitial-product1/200/200'
const FOOD_PRODUCT = 'https://picsum.photos/seed/interstitial-product2/200/200'
const GAMING_PRODUCT = 'https://picsum.photos/seed/interstitial-product3/200/200'

export const interstitialFormat: FormatDefinition = {
  type: 'interstitial',
  name: 'Interstitial',
  description:
    'A 320×480 mobile fullscreen ad with solid background color, logo, headline, product image, and a pill-shaped CTA button.',
  category: 'standard-banners',
  fields: [
    // ── Content ──────────────────────────────────────────────────────────
    { id: 'logoUrl',         label: 'Logo Image',     type: 'image', default: 'https://picsum.photos/seed/interstitial-logo/100/36' },
    { id: 'headline',        label: 'Headline',       type: 'text',  default: 'holidays are coming', validation: { max: 40 } },
    { id: 'productImageUrl', label: 'Product Image',  type: 'image', default: 'https://picsum.photos/seed/interstitial-product/200/200' },
    { id: 'ctaText',         label: 'CTA Text',       type: 'text',  default: 'Get Offers', validation: { max: 20 } },

    // ── Style ────────────────────────────────────────────────────────────
    { id: 'bgColor',      label: 'Background Color', type: 'color', default: '#d32f2f', tab: 'style' },
    { id: 'textColor',    label: 'Text Color',       type: 'color', default: '#ffffff', tab: 'style' },
    { id: 'ctaBgColor',   label: 'CTA Background',   type: 'color', default: '#ffffff', tab: 'style' },
    { id: 'ctaTextColor', label: 'CTA Text Color',   type: 'color', default: '#d32f2f', tab: 'style' },
  ],
  renderer: interstitialRenderer,
  engagements: interstitialEngagements,
  templates: [
    {
      id: 'interstitial-promo',
      name: 'Product Promo',
      description: 'Fullscreen interstitial for product promotions with bold colors.',
      thumbnailUrl: '',
      sizes: [{ width: 320, height: 480, label: '320×480' }],
      defaultConfig: {
        type: 'interstitial',
        logoUrl: 'https://picsum.photos/seed/interstitial-logo1/100/36',
        headline: 'holidays are coming',
        productImageUrl: DEFAULT_PRODUCT,
        ctaText: 'Get Offers',
        bgColor: '#d32f2f',
        textColor: '#ffffff',
        ctaBgColor: '#ffffff',
        ctaTextColor: '#d32f2f',
      },
    },
    {
      id: 'interstitial-food',
      name: 'Food & Delivery',
      description: 'Fullscreen interstitial for food delivery with appetizing product.',
      thumbnailUrl: '',
      sizes: [{ width: 320, height: 480, label: '320×480' }],
      defaultConfig: {
        type: 'interstitial',
        logoUrl: 'https://picsum.photos/seed/interstitial-logo2/100/36',
        headline: 'Delivering happiness',
        productImageUrl: FOOD_PRODUCT,
        ctaText: 'Order Now',
        bgColor: '#f59e0b',
        textColor: '#ffffff',
        ctaBgColor: '#ffffff',
        ctaTextColor: '#92400e',
      },
    },
    {
      id: 'interstitial-gaming',
      name: 'Gaming & Entertainment',
      description: 'Fullscreen interstitial for gaming with vibrant product showcase.',
      thumbnailUrl: '',
      sizes: [{ width: 320, height: 480, label: '320×480' }],
      defaultConfig: {
        type: 'interstitial',
        logoUrl: 'https://picsum.photos/seed/interstitial-logo3/100/36',
        headline: 'Level up your game',
        productImageUrl: GAMING_PRODUCT,
        ctaText: 'Play Now',
        bgColor: '#7c3aed',
        textColor: '#ffffff',
        ctaBgColor: '#ffffff',
        ctaTextColor: '#7c3aed',
      },
    },
  ],
}
