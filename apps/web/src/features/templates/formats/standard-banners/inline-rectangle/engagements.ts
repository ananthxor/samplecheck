import type { EngagementDefinition } from '../../_shared/types'

/**
 * Inline Rectangle engagement definitions.
 * Prefix 30 = inline-rectangle's sequential format number.
 */
export const inlineRectangleEngagements: EngagementDefinition[] = [
  {
    id: '30a',
    name: 'CTA Click',
    description: 'User clicked the call-to-action button',
    event: 'click',
    selector: '.st-ir-wrap',
    targetSelector: '.st-ir-cta',
    once: false,
  },
  {
    id: '30b',
    name: 'Ad Hover',
    description: 'User hovered over the ad (desktop engagement signal)',
    event: 'mouseenter',
    selector: '.st-ir-wrap',
    once: true,
  },
  {
    id: '30c',
    name: 'Promo Badge View',
    description: 'User saw the promo badge (fires once on load if badge exists)',
    event: 'animationend',
    selector: '.st-ir-promo',
    once: true,
  },
]
