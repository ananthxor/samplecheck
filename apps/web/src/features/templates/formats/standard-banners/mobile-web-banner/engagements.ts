import type { EngagementDefinition } from '../../_shared/types'

/**
 * Mobile Web Banner engagement definitions.
 * Prefix 40 = mobile-web-banner's sequential format number.
 */
export const mobileWebBannerEngagements: EngagementDefinition[] = [
  {
    id: '40a',
    name: 'Ad Click',
    description: 'User clicked anywhere on the banner',
    event: 'click',
    selector: '.st-mw-wrap',
    once: false,
  },
  {
    id: '40b',
    name: 'Ad Hover',
    description: 'User hovered/tapped the ad (engagement signal)',
    event: 'mouseenter',
    selector: '.st-mw-wrap',
    once: true,
  },
  {
    id: '40c',
    name: 'Banner View',
    description: 'Banner fully rendered and visible',
    event: 'load',
    selector: '.st-mw-wrap',
    once: true,
  },
]
