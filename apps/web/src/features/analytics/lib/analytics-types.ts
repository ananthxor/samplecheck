// ---------------------------------------------------------------------------
// Analytics Types & Utilities
// ---------------------------------------------------------------------------

/**
 * Shape of a single data point for Recharts charts.
 * Aggregated by date from one or more DailyMetricRow rows.
 */
export interface ChartDataPoint {
  date: string // 'YYYY-MM-DD'
  impressions: number
  clicks: number
  ctr: number // percentage 0-100, 2 decimal places
  engagements: number
  engagementRate: number // percentage 0-100, 2 decimal places
  videoPlays: number
  videoCompletes: number
  videoCompletionRate: number // percentage 0-100, 2 decimal places
  viewableImpressions: number
  avgDwellTimeMs: number
  /** Detailed breakdown of engagement types, e.g., { "flip": 10, "swipe": 5 } */
  engagementMetrics: Record<string, number>
}

/**
 * Preset date range options for the analytics date selector.
 */
export type DateRangePreset = '7d' | '30d' | '90d' | 'this-month' | 'last-month'

export const DATE_PRESETS: { label: string; value: DateRangePreset }[] = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'This month', value: 'this-month' },
  { label: 'Last month', value: 'last-month' },
]

/**
 * Compute a { start, end } date range (YYYY-MM-DD) from a preset.
 * Uses native Date API -- no date-fns dependency.
 */
/** Extract YYYY-MM-DD from a Date object */
function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]!
}

export function getDateRange(preset: DateRangePreset): {
  start: string
  end: string
} {
  const now = new Date()
  const today = toDateStr(now)

  switch (preset) {
    case '7d': {
      const start = new Date(now)
      start.setDate(start.getDate() - 6)
      return { start: toDateStr(start), end: today }
    }
    case '30d': {
      const start = new Date(now)
      start.setDate(start.getDate() - 29)
      return { start: toDateStr(start), end: today }
    }
    case '90d': {
      const start = new Date(now)
      start.setDate(start.getDate() - 89)
      return { start: toDateStr(start), end: today }
    }
    case 'this-month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: toDateStr(start), end: today }
    }
    case 'last-month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0) // last day of prev month
      return {
        start: toDateStr(start),
        end: toDateStr(end),
      }
    }
    default:
      return { start: today, end: today }
  }
}

/**
 * Filter controls for analytics queries.
 */
export interface AnalyticsFilters {
  creativeId?: string
  campaignId?: string
  /** Filter to a specific engagement event ID, e.g. "17a" (Card Flip) */
  engagementId?: string
}

/**
 * Raw row shape from the daily_metrics table (used by analytics-api).
 */
export interface DailyMetricRow {
  metric_date: string
  creative_id: string | null
  campaign_id: string | null
  impressions_served: number
  impressions_viewable: number
  clicks: number
  engagements: number
  video_plays: number
  video_completes: number
  total_dwell_time_ms: number
  engagement_metrics: Record<string, number>
}

/**
 * Aggregate DailyMetricRow[] into ChartDataPoint[] grouped by date.
 * Multiple rows for the same date (different creatives/campaigns) are summed.
 */
export function aggregateByDate(rows: DailyMetricRow[]): ChartDataPoint[] {
  const byDate = new Map<
    string,
    {
      impressions: number
      clicks: number
      engagements: number
      videoPlays: number
      videoCompletes: number
      viewableImpressions: number
      totalDwellTimeMs: number
      engagementMetrics: Record<string, number>
    }
  >()

  for (const row of rows) {
    const existing = byDate.get(row.metric_date) ?? {
      impressions: 0,
      clicks: 0,
      engagements: 0,
      videoPlays: 0,
      videoCompletes: 0,
      viewableImpressions: 0,
      totalDwellTimeMs: 0,
      engagementMetrics: {},
    }
    existing.impressions += row.impressions_served
    existing.clicks += row.clicks
    existing.engagements += row.engagements
    existing.videoPlays += row.video_plays
    existing.videoCompletes += row.video_completes
    existing.viewableImpressions += row.impressions_viewable
    existing.totalDwellTimeMs += row.total_dwell_time_ms

    // Merge engagement metrics
    if (row.engagement_metrics) {
      for (const [key, val] of Object.entries(row.engagement_metrics)) {
        existing.engagementMetrics[key] = (existing.engagementMetrics[key] ?? 0) + val
      }
    }

    byDate.set(row.metric_date, existing)
  }

  const points: ChartDataPoint[] = []
  for (const [date, agg] of byDate) {
    const ctr =
      agg.impressions > 0
        ? Number(((agg.clicks / agg.impressions) * 100).toFixed(2))
        : 0
    const engagementRate =
      agg.impressions > 0
        ? Number(((agg.engagements / agg.impressions) * 100).toFixed(2))
        : 0
    const videoCompletionRate =
      agg.videoPlays > 0
        ? Number(((agg.videoCompletes / agg.videoPlays) * 100).toFixed(2))
        : 0
    const avgDwellTimeMs =
      agg.impressions > 0
        ? Math.round(agg.totalDwellTimeMs / agg.impressions)
        : 0

    points.push({
      date,
      impressions: agg.impressions,
      clicks: agg.clicks,
      ctr,
      engagements: agg.engagements,
      engagementRate,
      videoPlays: agg.videoPlays,
      videoCompletes: agg.videoCompletes,
      videoCompletionRate,
      viewableImpressions: agg.viewableImpressions,
      avgDwellTimeMs,
      engagementMetrics: agg.engagementMetrics,
    })
  }

  return points.sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Aggregate all rows into a single summary object.
 */
export function aggregateSummary(rows: DailyMetricRow[]): {
  impressions: number
  clicks: number
  ctr: number
  engagements: number
  engagementRate: number
  videoPlays: number
  videoCompletes: number
  videoCompletionRate: number
  viewableImpressions: number
  totalDwellTimeMs: number
  engagementMetrics: Record<string, number>
} {
  let impressions = 0
  let clicks = 0
  let engagements = 0
  let videoPlays = 0
  let videoCompletes = 0
  let viewableImpressions = 0
  let totalDwellTimeMs = 0
  const engagementMetrics: Record<string, number> = {}

  for (const row of rows) {
    impressions += row.impressions_served
    clicks += row.clicks
    engagements += row.engagements
    videoPlays += row.video_plays
    videoCompletes += row.video_completes
    viewableImpressions += row.impressions_viewable
    totalDwellTimeMs += row.total_dwell_time_ms

    if (row.engagement_metrics) {
      for (const [key, val] of Object.entries(row.engagement_metrics)) {
        engagementMetrics[key] = (engagementMetrics[key] ?? 0) + val
      }
    }
  }

  const ctr =
    impressions > 0
      ? Number(((clicks / impressions) * 100).toFixed(2))
      : 0
  const engagementRate =
    impressions > 0
      ? Number(((engagements / impressions) * 100).toFixed(2))
      : 0
  const videoCompletionRate =
    videoPlays > 0
      ? Number(((videoCompletes / videoPlays) * 100).toFixed(2))
      : 0

  return { 
    impressions, 
    clicks, 
    ctr, 
    engagements, 
    engagementRate, 
    videoPlays, 
    videoCompletes, 
    videoCompletionRate, 
    viewableImpressions, 
    totalDwellTimeMs,
    engagementMetrics
  }
}

// ---------------------------------------------------------------------------
// Phase 13 — Extended Analytics Types
// ---------------------------------------------------------------------------

/**
 * A single hourly data point returned by fetch_hourly_metrics RPC.
 * 24 rows guaranteed (hours 0-23) with zero-fill.
 */
export interface HourlyDataPoint {
  hour_of_day: number // 0-23
  impressions: number
  clicks: number
}

/**
 * A single slice for the creative pie chart, aggregated by creative.
 */
export interface CreativePieSlice {
  name: string // creative name or truncated ID
  creativeId: string
  value: number // impressions_served
  share: number // 0-100, one decimal place
}

/**
 * A single data point for the device/platform breakdown chart.
 */
export interface DeviceBreakdownPoint {
  device_type: string // 'desktop' | 'mobile' | 'tablet' | 'unknown'
  impressions: number
}

/**
 * Aggregate DailyMetricRow[] into CreativePieSlice[] by creative.
 * Caps at top 8 creatives; groups remainder as "Other".
 * Used by CreativePieChart (ANLYT-10).
 */
export function aggregateByCreative(
  rows: DailyMetricRow[],
  creativeNames: Record<string, string>
): CreativePieSlice[] {
  const byCreative = new Map<string, number>()
  for (const row of rows) {
    const id = row.creative_id ?? 'unknown'
    byCreative.set(id, (byCreative.get(id) ?? 0) + row.impressions_served)
  }
  const total = Array.from(byCreative.values()).reduce((a, b) => a + b, 0)
  const sorted = Array.from(byCreative.entries())
    .map(([creativeId, value]) => ({
      name: creativeNames[creativeId] ?? creativeId.slice(0, 8),
      creativeId,
      value,
      share: total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.value - a.value)

  if (sorted.length <= 8) return sorted

  const top8 = sorted.slice(0, 8)
  const otherValue = sorted.slice(8).reduce((sum, s) => sum + s.value, 0)
  const otherShare = total > 0 ? Number(((otherValue / total) * 100).toFixed(1)) : 0
  return [...top8, { name: 'Other', creativeId: 'other', value: otherValue, share: otherShare }]
}
