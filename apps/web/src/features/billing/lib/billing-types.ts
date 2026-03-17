// Creative type buckets for billing consumption breakdown
// Maps format_id values (from creatives.format_id) to billing bucket labels.
// Three buckets only: tracker_configs rows do NOT appear in daily_metrics,
// so a "Trackers" bucket would always be empty. Use "Creatives" as the
// catch-all for all interactive formats not matched below.

export const CREATIVE_TYPE_BUCKETS = {
  Videos: ['video-endcard', 'click-to-play'],
  Static: ['static-banner', 'in-feed', 'multi-frame'],
  // All remaining interactive formats fall into "Creatives"
} as const

export type BillingBucket = 'Creatives' | 'Static' | 'Videos' | 'Trackers'

export function getBillingBucket(formatId: string | null | undefined): BillingBucket {
  if (!formatId) return 'Creatives'
  if ((CREATIVE_TYPE_BUCKETS.Videos as readonly string[]).includes(formatId)) return 'Videos'
  if ((CREATIVE_TYPE_BUCKETS.Static as readonly string[]).includes(formatId)) return 'Static'
  return 'Creatives'
}

export interface ConsumptionSummaryRow {
  type: BillingBucket
  impressions: number
  credits: number // 1 credit = 1 impression_served
}

export interface CreativeConsumptionRow {
  creativeId: string
  creativeName: string
  formatId: string | null
  bucket: BillingBucket
  impressions: number
  clicks: number
  ctr: number // 0-100, 2 decimal places
  engagements: number
  engagementRate: number // 0-100, 2 decimal places
  videoCompletionRate: number // 0-100, 2 decimal places
  cost: number // credits = impressions
}

// Raw Supabase join result shape
export interface RawCreativeConsumption {
  creative_id: string | null
  impressions_served: number
  impressions_viewable: number
  clicks: number
  engagements: number
  video_plays: number
  video_completes: number
  creatives: {
    name: string
    format_id: string | null
  } | null
}
