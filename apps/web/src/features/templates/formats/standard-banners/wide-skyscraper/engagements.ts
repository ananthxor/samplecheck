import type { EngagementDefinition } from '../../_shared/types'

/**
 * Wide Skyscraper engagement definitions.
 * Prefix 37 = wide-skyscraper's sequential format number.
 */
export const wideSkyscraperEngagements: EngagementDefinition[] = [
  {
    id: '37a',
    name: 'CTA Click',
    description: 'User clicked the call-to-action button',
    event: 'click',
    selector: '.st-ws-wrap',
    targetSelector: '.st-ws-cta',
    once: false,
  },
  {
    id: '37b',
    name: 'Ad Hover',
    description: 'User hovered over the ad (desktop engagement signal)',
    event: 'mouseenter',
    selector: '.st-ws-wrap',
    once: true,
  },
  {
    id: '37c',
    name: 'Background Image View',
    description: 'User viewed the background image element',
    event: 'load',
    selector: '.st-ws-bg',
    once: true,
  },
]
