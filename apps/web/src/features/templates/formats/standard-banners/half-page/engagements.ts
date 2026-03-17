import type { EngagementDefinition } from '../../_shared/types'

/**
 * Half Page engagement definitions.
 * Prefix 46 = half-page's sequential format number.
 */
export const halfPageEngagements: EngagementDefinition[] = [
  {
    id: '46a',
    name: 'CTA Click',
    description: 'User clicked the call-to-action text',
    event: 'click',
    selector: '.st-hp-wrap',
    targetSelector: '.st-hp-cta',
    once: false,
  },
  {
    id: '46b',
    name: 'Ad Hover',
    description: 'User hovered over the ad (desktop engagement signal)',
    event: 'mouseenter',
    selector: '.st-hp-wrap',
    once: true,
  },
  {
    id: '46c',
    name: 'Logo View',
    description: 'User viewed the logo image element',
    event: 'load',
    selector: '.st-hp-logo',
    once: true,
  },
]
