import { utils, writeFile } from 'xlsx'
import type { ConsumptionSummaryRow, CreativeConsumptionRow } from './billing-types'

export function exportBillingXls(
  summaryRows: ConsumptionSummaryRow[],
  creativeRows: CreativeConsumptionRow[],
  dateRange: string
): void {
  const today = new Date().toISOString().split('T')[0]!
  const filename = `billing-statement-${dateRange}-${today}.xlsx`

  const summarySheet = utils.json_to_sheet(
    summaryRows.map((r) => ({
      'Creative Type': r.type,
      'Impressions Used': r.impressions,
      'Credits Consumed': r.credits,
    }))
  )

  const creativeSheet = utils.json_to_sheet(
    creativeRows.map((r) => ({
      Creative: r.creativeName,
      Type: r.bucket,
      Impressions: r.impressions,
      Clicks: r.clicks,
      'CTR (%)': r.ctr,
      'Credits Consumed': r.cost,
    }))
  )

  const wb = utils.book_new()
  utils.book_append_sheet(wb, summarySheet, 'Consumption Summary')
  utils.book_append_sheet(wb, creativeSheet, 'Per-Creative')
  writeFile(wb, filename)
}
