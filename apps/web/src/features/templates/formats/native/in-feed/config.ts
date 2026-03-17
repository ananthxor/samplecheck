import type { FormatDefinition } from '../../_shared/types'
import { inFeedRenderer } from './renderer'

export const inFeedFormat: FormatDefinition = {
  type: 'in-feed',
  name: 'In-Feed',
  description: 'Native ad that blends seamlessly with publisher content feeds',
  category: 'native',
  fields: [
    { id: 'headline', label: 'Headline', type: 'text', default: '', validation: { max: 100 } },
    { id: 'bodyText', label: 'Body Text', type: 'textarea', default: '', validation: { max: 300 } },
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Read More' },
    { id: 'imageUrl', label: 'Content Image', type: 'image', default: '' },
    { id: 'sponsorName', label: 'Sponsor Name', type: 'text', default: '' },
    { id: 'sponsorLogoUrl', label: 'Sponsor Logo', type: 'image', default: '' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '', tab: 'settings' },
  ],
  renderer: inFeedRenderer,
  templates: [
    {
      id: 'content-promo',
      name: 'Content Promo',
      description: 'Blends seamlessly with publisher content feeds.',
      thumbnailUrl: '',
      sizes: [{ width: 0, height: 0, label: 'Responsive' }],
      defaultConfig: {
        type: 'in-feed',
        headline: 'Engaging Article Title That Draws Readers In',
        bodyText: 'Preview text that gives readers a taste of the content they will discover when they click through to learn more.',
        imageUrl: '',
        sponsorName: 'Your Brand',
        sponsorLogoUrl: '',
        ctaText: 'Read Article',
        ctaUrl: '',
      },
    },
    {
      id: 'product-card',
      name: 'Product Card',
      description: 'Native product card that blends with shopping feeds.',
      thumbnailUrl: '',
      sizes: [{ width: 0, height: 0, label: 'Responsive' }],
      defaultConfig: {
        type: 'in-feed',
        headline: 'Product Name - Special Offer',
        bodyText: 'Brief product description highlighting key features and current promotional pricing.',
        imageUrl: '',
        sponsorName: 'Your Store',
        sponsorLogoUrl: '',
        ctaText: 'Shop Now',
        ctaUrl: '',
      },
    },
  ],
}
