import type { EngagementDefinition } from '../../_shared/types'

/**
 * Skyscraper engagement definitions.
 * Prefix 36 = skyscraper's sequential format number.
 */
export const skyscraperEngagements: EngagementDefinition[] = [
  {
    id: '36a',
    name: 'CTA Click',
    description: 'User clicked the call-to-action bar',
    event: 'click',
    selector: '.st-sk-wrap',
    targetSelector: '.st-sk-cta',
    once: false,
  },
  {
    id: '36b',
    name: 'Ad Hover',
    description: 'User hovered over the ad (desktop engagement signal)',
    event: 'mouseenter',
    selector: '.st-sk-wrap',
    once: true,
  },
  {
    id: '36c',
    name: 'Background Image View',
    description: 'User viewed the background image element',
    event: 'load',
    selector: '.st-sk-bg',
    once: true,
  },
]
