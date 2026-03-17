import { utils, writeFile } from 'xlsx'
import type { DailyMetricRow } from './analytics-types'
import { exportToCsv } from './csv-export'

// Guard: XLSX max is 1,048,576 rows. Leave headroom.
const XLSX_ROW_LIMIT = 1_000_000

export function exportToXls(
  rows: DailyMetricRow[],
  creativeNames: Record<string, string>,
  campaignNames: Record<string, string>,
  dateRange: string
): void {
  const today = new Date().toISOString().split('T')[0]!
  const filename = `analytics-${dateRange}-${today}`

  // CSV fallback for huge datasets
  if (rows.length > XLSX_ROW_LIMIT) {
    const csvHeaders = [
      'Date',
      'Creative',
      'Campaign',
      'Impressions',
      'Viewable Impressions',
      'Clicks',
      'CTR (%)',
      'Engagements',
      'Video Plays',
      'Video Completes',
    ]
    const csvRows = rows.map((r) => [
      r.metric_date,
      creativeNames[r.creative_id ?? ''] ?? r.creative_id ?? '',
      campaignNames[r.campaign_id ?? ''] ?? r.campaign_id ?? '',
      r.impressions_served,
      r.impressions_viewable,
      r.clicks,
      r.impressions_served > 0
        ? Number(((r.clicks / r.impressions_served) * 100).toFixed(2))
        : 0,
      r.engagements,
      r.video_plays,
      r.video_completes,
    ])
    exportToCsv(`${filename}.csv`, csvHeaders, csvRows as (string | number)[][])
    return
  }

  // Build Daily Metrics sheet
  const sheetData = rows.map((r) => ({
    Date: r.metric_date,
    Creative: creativeNames[r.creative_id ?? ''] ?? r.creative_id ?? '',
    Campaign: campaignNames[r.campaign_id ?? ''] ?? r.campaign_id ?? '',
    Impressions: r.impressions_served,
    'Viewable Impressions': r.impressions_viewable,
    Clicks: r.clicks,
    'CTR (%)':
      r.impressions_served > 0
        ? Number(((r.clicks / r.impressions_served) * 100).toFixed(2))
        : 0,
    Engagements: r.engagements,
    'Video Plays': r.video_plays,
    'Video Completes': r.video_completes,
    'Total Dwell Time (ms)': r.total_dwell_time_ms,
  }))

  const ws = utils.json_to_sheet(sheetData)
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Daily Metrics')
  writeFile(wb, `${filename}.xlsx`)
}
