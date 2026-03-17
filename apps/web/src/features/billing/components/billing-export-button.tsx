import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportBillingXls } from '../lib/billing-xls-export'
import type { ConsumptionSummaryRow, CreativeConsumptionRow } from '../lib/billing-types'

interface BillingExportButtonProps {
  summaryRows: ConsumptionSummaryRow[]
  creativeRows: CreativeConsumptionRow[]
  dateRange: string
  disabled?: boolean
}

export function BillingExportButton({
  summaryRows,
  creativeRows,
  dateRange,
  disabled,
}: BillingExportButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled || (summaryRows.every((r) => r.impressions === 0) && creativeRows.length === 0)}
      onClick={() => exportBillingXls(summaryRows, creativeRows, dateRange)}
    >
      <Download className="mr-2 size-4" />
      Download Statement
    </Button>
  )
}
