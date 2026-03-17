import type { EngagementDefinition } from '../../_shared/types'

/**
 * Mobile Banner 320×100 engagement definitions.
 * Prefix 48 = mobile-banner-320x100's sequential format number.
 */
export const mobileBannerEngagements: EngagementDefinition[] = [
  {
    id: '48a',
    name: 'CTA Click',
    description: 'User clicked the call-to-action button',
    event: 'click',
    selector: '.st-mb-wrap',
    targetSelector: '.st-mb-cta',
    once: false,
  },
  {
    id: '48b',
    name: 'Ad Hover',
    description: 'User hovered over the ad (desktop engagement signal)',
    event: 'mouseenter',
    selector: '.st-mb-wrap',
    once: true,
  },
  {
    id: '48c',
    name: 'Background Image View',
    description: 'User viewed the background image element',
    event: 'load',
    selector: '.st-mb-bg',
    once: true,
  },
]
