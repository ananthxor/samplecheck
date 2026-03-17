import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportToXls } from '../lib/xls-export'
import type { DailyMetricRow } from '../lib/analytics-types'

// Note: CsvExportButton is kept for backward compat (used in campaign detail tabs);
// this component replaces it only on the main analytics page.

interface ExportButtonProps {
  data: DailyMetricRow[]
  dateRange: string
  creativeNames: Record<string, string>
  campaignNames: Record<string, string>
}

export function ExportButton({
  data,
  dateRange,
  creativeNames,
  campaignNames,
}: ExportButtonProps) {
  const handleExport = () => {
    exportToXls(data, creativeNames, campaignNames, dateRange)
  }

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={data.length === 0}
    >
      <Download className="mr-2 size-4" />
      Export XLS
    </Button>
  )
}
