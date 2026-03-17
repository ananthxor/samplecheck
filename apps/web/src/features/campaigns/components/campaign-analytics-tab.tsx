import { useMemo } from 'react'
import { Info } from 'lucide-react'
import {
  type DateRangePreset,
  getDateRange,
  aggregateByDate,
  aggregateSummary,
} from '@/features/analytics/lib/analytics-types'
import { useAnalytics } from '@/features/analytics/hooks/use-analytics'
import { DateRangeSelect } from '@/features/analytics/components/date-range-select'
import { KpiCards } from '@/features/analytics/components/kpi-cards'
import { MetricsChart } from '@/features/analytics/components/metrics-chart'

interface CampaignAnalyticsTabProps {
  campaignId: string
  datePreset: DateRangePreset
  onDatePresetChange: (preset: DateRangePreset) => void
}

export function CampaignAnalyticsTab({
  campaignId,
  datePreset,
  onDatePresetChange,
}: CampaignAnalyticsTabProps) {
  const { start, end } = getDateRange(datePreset)

  const { data, isLoading } = useAnalytics(null, start, end, { campaignId })

  const chartData = useMemo(() => aggregateByDate(data ?? []), [data])
  const summary = useMemo(() => aggregateSummary(data ?? []), [data])

  return (
    <div className="space-y-6">
      {/* Date range selector */}
      <DateRangeSelect value={datePreset} onChange={onDatePresetChange} />

      {/* Empty state */}
      {!isLoading && (data?.length ?? 0) === 0 && (
        <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-4">
          <Info className="text-muted-foreground mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-sm font-medium">No analytics data</p>
            <p className="text-muted-foreground text-sm">
              No analytics data for this campaign in the selected period.
              Analytics appear once ads start serving.
            </p>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <KpiCards
        impressions={summary.impressions}
        clicks={summary.clicks}
        ctr={summary.ctr}
        engagements={summary.engagements}
        engagementRate={summary.impressions > 0 ? (summary.engagements / summary.impressions) * 100 : 0}
        totalDwellTimeMs={summary.totalDwellTimeMs}
        loading={isLoading}
      />

      {/* Time-series chart */}
      <MetricsChart data={chartData} loading={isLoading} />
    </div>
  )
}
