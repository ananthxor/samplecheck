import type { EngagementDefinition } from '../../_shared/types'

/**
 * Mobile Leaderboard engagement definitions.
 * Prefix 38 = mobile-leaderboard's sequential format number.
 */
export const mobileLeaderboardEngagements: EngagementDefinition[] = [
  {
    id: '38a',
    name: 'CTA Click',
    description: 'User clicked the call-to-action button',
    event: 'click',
    selector: '.st-ml-wrap',
    targetSelector: '.st-ml-cta',
    once: false,
  },
  {
    id: '38b',
    name: 'Ad Hover',
    description: 'User hovered/tapped the ad (engagement signal)',
    event: 'mouseenter',
    selector: '.st-ml-wrap',
    once: true,
  },
  {
    id: '38c',
    name: 'Background Image View',
    description: 'User viewed the background image element',
    event: 'load',
    selector: '.st-ml-bg',
    once: true,
  },
]
