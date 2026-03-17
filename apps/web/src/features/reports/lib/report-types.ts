// ---------------------------------------------------------------------------
// Custom Reports — Types and Constants
// ---------------------------------------------------------------------------

export type ReportType = 'display' | 'standard_banner' | 'tracker' | 'placement'
export type ReportResolution = 'hourly' | 'daily'
export type ReportMetric = 'impressions' | 'clicks' | 'ctr' | 'viewability' | 'engagement_rate' | 'video_completion'

export const REPORT_TYPE_OPTIONS: { label: string; value: ReportType }[] = [
  { label: 'Display', value: 'display' },
  { label: 'Standard Banner', value: 'standard_banner' },
  { label: 'Tracker', value: 'tracker' },
  { label: 'Placement', value: 'placement' },
]

export const METRIC_OPTIONS: { label: string; value: ReportMetric }[] = [
  { label: 'Impressions', value: 'impressions' },
  { label: 'Clicks', value: 'clicks' },
  { label: 'CTR', value: 'ctr' },
  { label: 'Viewability %', value: 'viewability' },
  { label: 'Engagement Rate', value: 'engagement_rate' },
  { label: 'Video Comp. Rate', value: 'video_completion' },
]

export interface SavedReport {
  id: string
  advertiser_id: string
  name: string
  report_type: ReportType
  resolution: ReportResolution
  metrics: ReportMetric[]
  date_range_start: string // YYYY-MM-DD
  date_range_end: string   // YYYY-MM-DD
  created_at: string
  updated_at: string
}

export interface CreateReportPayload {
  advertiser_id: string
  name: string
  report_type: ReportType
  resolution: ReportResolution
  metrics: ReportMetric[]
  date_range_start: string
  date_range_end: string
}
