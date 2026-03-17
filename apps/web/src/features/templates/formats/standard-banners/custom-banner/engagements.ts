import type { EngagementDefinition } from '../../_shared/types'

/**
 * Custom Banner engagement definitions.
 * Prefix 49 = custom-banner's sequential format number.
 */
export const customBannerEngagements: EngagementDefinition[] = [
  {
    id: '49a',
    name: 'CTA Click',
    description: 'User clicked the call-to-action button',
    event: 'click',
    selector: '.st-cb-wrap',
    targetSelector: '.st-cb-cta',
    once: false,
  },
  {
    id: '49b',
    name: 'Ad Hover',
    description: 'User hovered over the ad (desktop engagement signal)',
    event: 'mouseenter',
    selector: '.st-cb-wrap',
    once: true,
  },
  {
    id: '49c',
    name: 'Background Image View',
    description: 'User viewed the background image element',
    event: 'load',
    selector: '.st-cb-bg',
    once: true,
  },
]
