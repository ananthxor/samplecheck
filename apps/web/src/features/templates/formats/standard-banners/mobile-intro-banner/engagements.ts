import type { EngagementDefinition } from '../../_shared/types'

/**
 * Mobile Intro Banner engagement definitions.
 * Prefix 42 = mobile-intro-banner's sequential format number.
 */
export const mobileIntroBannerEngagements: EngagementDefinition[] = [
  {
    id: '42a',
    name: 'Ad Click',
    description: 'User clicked anywhere on the banner',
    event: 'click',
    selector: '.st-mi-wrap',
    once: false,
  },
  {
    id: '42b',
    name: 'Ad Hover',
    description: 'User hovered/tapped the ad (engagement signal)',
    event: 'mouseenter',
    selector: '.st-mi-wrap',
    once: true,
  },
  {
    id: '42c',
    name: 'Banner View',
    description: 'Banner fully rendered and visible',
    event: 'load',
    selector: '.st-mi-wrap',
    once: true,
  },
]
