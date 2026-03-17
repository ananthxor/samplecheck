import type { FormatDefinition } from '../../../_shared/types'

// ──────────────────────────────────────────────────────────────────────────────
// STUB — renderer not yet implemented
// ──────────────────────────────────────────────────────────────────────────────

export const leaderboardSurveyBuilderWithBranchingFormat: FormatDefinition = {
  type: 'desktop-leaderboard-leaderboard-survey-builder-with-branching',
  name: 'Leaderboard Survey Builder with Branching',
  description: 'This is a Survey ad unit that can be used for conducting surveys across a vast audience via display advertising. The survey progresses depending on the user\'s response to each question. The advertiser can customize the flow of the survey. This new template has the option to show the responses of all users and has more answer type options as well. Once the user completes the survey, a custom message appears.',
  category: 'desktop',
  size: 'leaderboard',
  fields: [
    { id: 'ctaText', label: 'CTA Text', type: 'text', default: 'Shop Now' },
    { id: 'ctaUrl', label: 'Click-Through URL', type: 'url', default: '' },
  ],
  templates: [],
}
