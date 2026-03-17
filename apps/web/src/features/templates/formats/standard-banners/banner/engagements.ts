import type { EngagementDefinition } from '../../_shared/types'

/**
 * Banner engagement definitions.
 * Prefix 33 = banner's sequential format number.
 */
export const bannerEngagements: EngagementDefinition[] = [
  {
    id: '33a',
    name: 'CTA Click',
    description: 'User clicked the call-to-action button',
    event: 'click',
    selector: '.st-bn-wrap',
    targetSelector: '.st-bn-cta',
    once: false,
  },
  {
    id: '33b',
    name: 'Ad Hover',
    description: 'User hovered over the ad (desktop engagement signal)',
    event: 'mouseenter',
    selector: '.st-bn-wrap',
    once: true,
  },
  {
    id: '33c',
    name: 'Background Image View',
    description: 'User scrolled the ad into view and the background image loaded',
    event: 'load',
    selector: '.st-bn-bg',
    once: true,
  },
]
