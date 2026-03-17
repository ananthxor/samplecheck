import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ConsumptionSummaryRow } from '../lib/billing-types'

const fmt = new Intl.NumberFormat('en-US')

interface ConsumptionSummaryProps {
  rows: ConsumptionSummaryRow[]
  loading: boolean
}

export function ConsumptionSummary({ rows, loading }: ConsumptionSummaryProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {rows.map((row) => (
        <Card key={row.type}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {row.type}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt.format(row.credits)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {fmt.format(row.impressions)} impressions
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
