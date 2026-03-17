import type { EngagementDefinition } from '../../_shared/types'

/**
 * Large Leaderboard engagement definitions.
 * Prefix 43 = large-leaderboard's sequential format number.
 */
export const largeLeaderboardEngagements: EngagementDefinition[] = [
  {
    id: '43a',
    name: 'CTA Click',
    description: 'User clicked the CTA button',
    event: 'click',
    selector: '.st-ll-cta',
    once: false,
  },
  {
    id: '43b',
    name: 'Ad Hover',
    description: 'User hovered over the ad (engagement signal)',
    event: 'mouseenter',
    selector: '.st-ll-wrap',
    once: true,
  },
  {
    id: '43c',
    name: 'Banner View',
    description: 'Banner fully rendered and visible',
    event: 'load',
    selector: '.st-ll-wrap',
    once: true,
  },
]
