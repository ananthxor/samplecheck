import type { EngagementDefinition } from '../../_shared/types'

/**
 * Leaderboard engagement definitions.
 * Prefix 34 = leaderboard's sequential format number.
 */
export const leaderboardEngagements: EngagementDefinition[] = [
  {
    id: '34a',
    name: 'CTA Click',
    description: 'User clicked the call-to-action button',
    event: 'click',
    selector: '.st-lb-wrap',
    targetSelector: '.st-lb-cta',
    once: false,
  },
  {
    id: '34b',
    name: 'Ad Hover',
    description: 'User hovered over the ad (desktop engagement signal)',
    event: 'mouseenter',
    selector: '.st-lb-wrap',
    once: true,
  },
  {
    id: '34c',
    name: 'Background Image View',
    description: 'User viewed the background image element',
    event: 'load',
    selector: '.st-lb-bg',
    once: true,
  },
]
