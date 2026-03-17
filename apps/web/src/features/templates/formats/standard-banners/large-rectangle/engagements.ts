import type { EngagementDefinition } from '../../_shared/types'

/**
 * Large Rectangle engagement definitions.
 * Prefix 35 = large-rectangle's sequential format number.
 */
export const largeRectangleEngagements: EngagementDefinition[] = [
  {
    id: '35a',
    name: 'CTA Click',
    description: 'User clicked the call-to-action bar',
    event: 'click',
    selector: '.st-lr-wrap',
    targetSelector: '.st-lr-cta',
    once: false,
  },
  {
    id: '35b',
    name: 'Ad Hover',
    description: 'User hovered over the ad (desktop engagement signal)',
    event: 'mouseenter',
    selector: '.st-lr-wrap',
    once: true,
  },
  {
    id: '35c',
    name: 'Background Image View',
    description: 'User viewed the background image element',
    event: 'load',
    selector: '.st-lr-bg',
    once: true,
  },
]
