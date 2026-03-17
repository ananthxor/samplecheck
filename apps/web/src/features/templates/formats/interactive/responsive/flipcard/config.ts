import type { FormatDefinition } from '../../../_shared/types'
import { flipcardRenderer } from './renderer'
import { flipcardEngagements } from './engagements'

export const flipcardFormat: FormatDefinition = {
  type: 'flipcard',
  name: 'Flip Card',
  description: 'Interactive 3D card with tilt hover and click-to-flip reveal',
  category: 'interactive',
  fields: [
    // ── Front side ─────────────────────────────────────────────────────────
    { id: '_frontSide', label: 'Front Side', type: 'group', default: null, groupLabel: 'Front Side' },
    { id: 'frontHeadline', label: 'Headline',  type: 'text',     default: 'Unveil the Experience' },
    { id: 'frontBodyText', label: 'Body Text', type: 'textarea', default: 'Hover, tilt, or click to discover.' },
    { id: 'frontImageUrl', label: 'Image',     type: 'image',    default: '' },
    { id: 'hintText',      label: 'Hint Chip Text', type: 'text', default: 'Tap to Flip', validation: { max: 20 } },

    // ── Back side ──────────────────────────────────────────────────────────
    { id: '_backSide',  label: 'Back Side',  type: 'group', default: null, groupLabel: 'Back Side' },
    { id: 'backHeadline', label: 'Headline',  type: 'text',     default: '🔥 Limited Time Deal' },
    { id: 'backBodyText', label: 'Body Text', type: 'textarea', default: 'Get 30% off today only.' },
    { id: 'backImageUrl', label: 'Image',     type: 'image',    default: '' },
    { id: 'ctaText',      label: 'CTA Button Text', type: 'text', default: 'Shop Now', validation: { max: 30 } },
    { id: 'ctaUrl',       label: 'Click-Through URL', type: 'url', default: '', tab: 'settings' },

    // ── Colors ─────────────────────────────────────────────────────────────
    { id: '_frontColors', label: 'Front Colors', type: 'group', default: null, groupLabel: 'Front Gradient', tab: 'style' },
    { id: 'frontColorStart', label: 'Top Color',    type: 'color', default: '#4f46e5', tab: 'style' },
    { id: 'frontColorEnd',   label: 'Bottom Color', type: 'color', default: '#7c3aed', tab: 'style' },

    { id: '_backColors', label: 'Back Colors', type: 'group', default: null, groupLabel: 'Back Gradient', tab: 'style' },
    { id: 'backColorStart', label: 'Top Color',    type: 'color', default: '#1f2937', tab: 'style' },
    { id: 'backColorEnd',   label: 'Bottom Color', type: 'color', default: '#111827', tab: 'style' },
  ],
  renderer: flipcardRenderer,
  engagements: flipcardEngagements,
  templates: [
    {
      id: 'before-after',
      name: 'Before & After',
      description: 'Reveal a dramatic transformation when the user flips the card.',
      thumbnailUrl: '',
      sizes: [
        { width: 300, height: 500, label: '300×500' },
        { width: 300, height: 600, label: '300×600' },
      ],
      defaultConfig: {
        type: 'flipcard',
        frontHeadline:   'Before',
        frontBodyText:   'Tap to see the transformation.',
        frontImageUrl:   '',
        hintText:        'Tap to Flip',
        frontColorStart: '#4f46e5',
        frontColorEnd:   '#7c3aed',
        backHeadline:    'After',
        backBodyText:    'The amazing result revealed.',
        backImageUrl:    '',
        backColorStart:  '#1f2937',
        backColorEnd:    '#111827',
        ctaText:         'Learn More',
        ctaUrl:          '',
      },
    },
    {
      id: 'promo-reveal',
      name: 'Promo Reveal',
      description: 'Tease an offer on the front, reveal the deal on the back.',
      thumbnailUrl: '',
      sizes: [
        { width: 300, height: 500, label: '300×500' },
        { width: 300, height: 600, label: '300×600' },
      ],
      defaultConfig: {
        type: 'flipcard',
        frontHeadline:   'Exclusive Offer Inside',
        frontBodyText:   'Flip to reveal your special discount.',
        frontImageUrl:   '',
        hintText:        'Flip Me!',
        frontColorStart: '#1e40af',
        frontColorEnd:   '#3b82f6',
        backHeadline:    '50% OFF',
        backBodyText:    'Use code FLIP50 at checkout. Today only.',
        backImageUrl:    '',
        backColorStart:  '#7f1d1d',
        backColorEnd:    '#dc2626',
        ctaText:         'Claim Deal',
        ctaUrl:          '',
      },
    },
  ],
}
