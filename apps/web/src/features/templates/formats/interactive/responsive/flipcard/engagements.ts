import type { EngagementDefinition } from '../../../_shared/types'

/**
 * Flipcard engagement definitions.
 * Prefix 17 = flipcard's sequential format number.
 *
 * Each entry declares the DOM event and selector — the bundler auto-generates
 * the listener code at publish time. No tracking code lives in renderer.ts.
 */
export const flipcardEngagements: EngagementDefinition[] = [
  {
    id: '17a',
    name: 'Card Flip',
    description: 'User clicked or tapped the front face to flip the card',
    event: 'click',
    selector: '#st-fc-front',
    once: true,
  },
  {
    id: '17b',
    name: 'Tilt Hover',
    description: 'User hovered over the card triggering the 3D tilt effect (desktop)',
    event: 'mousemove',
    selector: '#st-fc-tilt',
    once: true,
  },
  {
    id: '17c',
    name: 'CTA Click',
    description: 'User clicked the call-to-action button on the back face',
    event: 'click',
    selector: '#st-fc-tilt',
    targetSelector: '.st-fc-cta',
    once: false,
  },
]
