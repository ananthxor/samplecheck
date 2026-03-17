import type { EngagementDefinition } from '../../_shared/types'

/**
 * Large Leaderboard 970×90 engagement definitions.
 * Prefix 47 = large-leaderboard-970x90's sequential format number.
 */
export const largeLeaderboard970x90Engagements: EngagementDefinition[] = [
  {
    id: '47a',
    name: 'CTA Click',
    description: 'User clicked the call-to-action button',
    event: 'click',
    selector: '.st-l0-wrap',
    targetSelector: '.st-l0-cta',
    once: false,
  },
  {
    id: '47b',
    name: 'Ad Hover',
    description: 'User hovered over the ad (desktop engagement signal)',
    event: 'mouseenter',
    selector: '.st-l0-wrap',
    once: true,
  },
  {
    id: '47c',
    name: 'Background Image View',
    description: 'User viewed the background image element',
    event: 'load',
    selector: '.st-l0-bg',
    once: true,
  },
]
