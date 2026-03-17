import type { EngagementDefinition } from '../../_shared/types'

/**
 * Large Leaderboard 970×250 engagement definitions.
 * Prefix 44 = large-leaderboard-970x250's sequential format number.
 */
export const largeLeaderboard970x250Engagements: EngagementDefinition[] = [
  {
    id: '44a',
    name: 'CTA Click',
    description: 'User clicked the call-to-action button',
    event: 'click',
    selector: '.st-l9-wrap',
    targetSelector: '.st-l9-cta',
    once: false,
  },
  {
    id: '44b',
    name: 'Ad Hover',
    description: 'User hovered over the ad (desktop engagement signal)',
    event: 'mouseenter',
    selector: '.st-l9-wrap',
    once: true,
  },
  {
    id: '44c',
    name: 'Background Image View',
    description: 'User viewed the background image element',
    event: 'load',
    selector: '.st-l9-bg',
    once: true,
  },
]
