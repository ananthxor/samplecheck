import type { EngagementDefinition } from '../../_shared/types'

/**
 * Small Square engagement definitions.
 * Prefix 32 = small-square's sequential format number.
 */
export const smallSquareEngagements: EngagementDefinition[] = [
  {
    id: '32a',
    name: 'CTA Click',
    description: 'User clicked the call-to-action button',
    event: 'click',
    selector: '.st-ss-wrap',
    targetSelector: '.st-ss-cta',
    once: false,
  },
  {
    id: '32b',
    name: 'Ad Hover',
    description: 'User hovered over the ad (desktop engagement signal)',
    event: 'mouseenter',
    selector: '.st-ss-wrap',
    once: true,
  },
  {
    id: '32c',
    name: 'Promo Badge View',
    description: 'User viewed the promo badge element',
    event: 'load',
    selector: '.st-ss-bg',
    once: true,
  },
]
