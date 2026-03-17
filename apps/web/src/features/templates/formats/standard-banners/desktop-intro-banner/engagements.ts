import type { EngagementDefinition } from '../../_shared/types'

/**
 * Desktop Intro Banner engagement definitions.
 * Prefix 41 = desktop-intro-banner's sequential format number.
 */
export const desktopIntroBannerEngagements: EngagementDefinition[] = [
  {
    id: '41a',
    name: 'Ad Click',
    description: 'User clicked anywhere on the banner',
    event: 'click',
    selector: '.st-di-wrap',
    once: false,
  },
  {
    id: '41b',
    name: 'Ad Hover',
    description: 'User hovered over the ad (engagement signal)',
    event: 'mouseenter',
    selector: '.st-di-wrap',
    once: true,
  },
  {
    id: '41c',
    name: 'Banner View',
    description: 'Banner fully rendered and visible',
    event: 'load',
    selector: '.st-di-wrap',
    once: true,
  },
]
