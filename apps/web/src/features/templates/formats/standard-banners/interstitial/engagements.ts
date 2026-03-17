import type { EngagementDefinition } from '../../_shared/types'

/**
 * Interstitial engagement definitions.
 * Prefix 45 = interstitial's sequential format number.
 */
export const interstitialEngagements: EngagementDefinition[] = [
  {
    id: '45a',
    name: 'CTA Click',
    description: 'User clicked the call-to-action button',
    event: 'click',
    selector: '.st-it-wrap',
    targetSelector: '.st-it-cta',
    once: false,
  },
  {
    id: '45b',
    name: 'Ad Hover',
    description: 'User hovered over the ad (desktop engagement signal)',
    event: 'mouseenter',
    selector: '.st-it-wrap',
    once: true,
  },
  {
    id: '45c',
    name: 'Product Image View',
    description: 'User viewed the product image element',
    event: 'load',
    selector: '.st-it-product img',
    once: true,
  },
]
