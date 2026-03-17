import type { EngagementDefinition } from '../../_shared/types'

/**
 * Square engagement definitions.
 * Prefix 31 = square's sequential format number.
 */
export const squareEngagements: EngagementDefinition[] = [
  {
    id: '31a',
    name: 'CTA Click',
    description: 'User clicked the call-to-action button',
    event: 'click',
    selector: '.st-sq-wrap',
    targetSelector: '.st-sq-cta',
    once: false,
  },
  {
    id: '31b',
    name: 'Ad Hover',
    description: 'User hovered over the ad (desktop engagement signal)',
    event: 'mouseenter',
    selector: '.st-sq-wrap',
    once: true,
  },
  {
    id: '31c',
    name: 'Background Image View',
    description: 'User scrolled the ad into view and the background image loaded',
    event: 'load',
    selector: '.st-sq-bg',
    once: true,
  },
]
