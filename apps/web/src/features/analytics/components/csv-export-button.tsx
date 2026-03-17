import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportToCsv } from '../lib/csv-export'
import type { DailyMetricRow } from '../lib/analytics-types'

interface CsvExportButtonProps {
  data: DailyMetricRow[]
  dateRange: string
}

const CSV_HEADERS = [
  'Date',
  'Creative ID',
  'Campaign ID',
  'Impressions',
  'Viewable Impressions',
  'Clicks',
  'Engagements',
  'Video Plays',
  'Video Completes',
  'Total Dwell Time (ms)',
]

export function CsvExportButton({ data, dateRange }: CsvExportButtonProps) {
  const handleExport = () => {
    const today = new Date().toISOString().split('T')[0]
    const filename = `analytics-${dateRange}-${today}.csv`

    const rows = data.map((row) => [
      row.metric_date,
      row.creative_id ?? '',
      row.campaign_id ?? '',
      row.impressions_served,
      row.impressions_viewable,
      row.clicks,
      row.engagements,
      row.video_plays,
      row.video_completes,
      row.total_dwell_time_ms,
    ])

    exportToCsv(filename, CSV_HEADERS, rows)
  }

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={data.length === 0}
    >
      <Download className="mr-2 size-4" />
      Export CSV
    </Button>
  )
}
