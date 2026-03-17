import type { EngagementDefinition } from '../../_shared/types'

/**
 * Desktop Web Banner engagement definitions.
 * Prefix 39 = desktop-web-banner's sequential format number.
 */
export const desktopWebBannerEngagements: EngagementDefinition[] = [
  {
    id: '39a',
    name: 'Ad Click',
    description: 'User clicked anywhere on the banner',
    event: 'click',
    selector: '.st-dw-wrap',
    once: false,
  },
  {
    id: '39b',
    name: 'Ad Hover',
    description: 'User hovered over the banner (desktop engagement signal)',
    event: 'mouseenter',
    selector: '.st-dw-wrap',
    once: true,
  },
  {
    id: '39c',
    name: 'Background Image View',
    description: 'User viewed the background image element',
    event: 'load',
    selector: '.st-dw-bg',
    once: true,
  },
]
