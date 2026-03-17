import { z } from 'zod'

// ---------------------------------------------------------------------------
// Tracker Constants
// ---------------------------------------------------------------------------

export const FIRE_CONDITIONS = [
  'on_load',
  'on_viewable',
  'on_click',
  'on_engagement',
] as const

export type FireCondition = (typeof FIRE_CONDITIONS)[number]

export const FIRE_CONDITION_LABELS: Record<FireCondition, string> = {
  on_load: 'On Load',
  on_viewable: 'On Viewable',
  on_click: 'On Click',
  on_engagement: 'On Engagement',
}

export const TRACKER_TYPES = ['pixel', 'script'] as const

export type TrackerType = (typeof TRACKER_TYPES)[number]

export const TRACKER_TYPE_LABELS: Record<TrackerType, string> = {
  pixel: 'Pixel (1x1 Image)',
  script: 'Script (JS Tag)',
}

export const TRACKER_CATEGORIES = ['conversion', 'impression', 'click'] as const
export type TrackerCategory = (typeof TRACKER_CATEGORIES)[number]
export const TRACKER_CATEGORY_LABELS: Record<TrackerCategory, string> = {
  conversion: 'Conversion',
  impression: 'Impression',
  click: 'Click',
}

// ---------------------------------------------------------------------------
// Zod Schema for Tracker Config Form Validation
// ---------------------------------------------------------------------------
// Note: Uses permissive URL validation to allow macro placeholders like
// %%CACHEBUSTER%%, ${timestamp}, [random] in tracker URLs.
// Do NOT use z.url() which would reject these.
// ---------------------------------------------------------------------------

export const trackerConfigSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  tracker_url: z
    .string()
    .min(1, 'Tracker URL is required')
    .refine((url) => url.startsWith('http://') || url.startsWith('https://'), {
      message: 'URL must start with http:// or https://',
    }),
  tracker_type: z.enum(['pixel', 'script']),
  category: z.enum(['conversion', 'impression', 'click']),
})

export type TrackerConfigFormData = z.infer<typeof trackerConfigSchema>
