import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const popUpPollFormat: FormatDefinition = {
  type: 'desktop-square-pop-up-poll',
  name: 'Pop Up Poll',
  description: 'Pop Up Poll is a square video ad format with a poll card which slides in at the end of the video. The advertiser can ask a question giving up to 5 options to their users. On selecting their answer, users will be able to view the percentage of all answers submitted till then. Clicking anywhere on the video will redirect the user to the advertiser’s landing page.',
  category: 'desktop',
  size: 'square',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
