import { useState, useMemo, useRef } from 'react'
import { Info, RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import {
  type DateRangePreset,
  getDateRange,
  aggregateByDate,
  aggregateSummary,
  aggregateByCreative,
} from '../lib/analytics-types'
import {
  useAnalytics,
  useCreativeOptions,
  useCampaignOptions,
  useLifetimeMetrics,
  useHourlyMetrics,
  useDeviceBreakdown,
} from '../hooks/use-analytics'
import { DateRangeSelect } from '../components/date-range-select'
import { KpiCards } from '../components/kpi-cards'
import { MetricsChart } from '../components/metrics-chart'
import { MetricsTable } from '../components/metrics-table'
import { ExportButton } from '../components/export-button'
import { AnalyticsFilters } from '../components/analytics-filters'
import { LifetimeKpiCards } from '../components/lifetime-kpi-cards'
import { HourlyChart } from '../components/hourly-chart'
import { CreativePieChart } from '../components/creative-pie-chart'
import { PlatformChart } from '../components/platform-chart'
import { ChartDownloadButton } from '../components/chart-download-button'

export default function AnalyticsPage() {
  const { effectiveAdvertiserId } = useAuth()
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)
  const [datePreset, setDatePreset] = useState<DateRangePreset>('30d')
  const [creativeId, setCreativeId] = useState<string | undefined>()
  const [campaignId, setCampaignId] = useState<string | undefined>()

  const today = new Date().toISOString().split('T')[0]!
  const [hourlyDate, setHourlyDate] = useState<string>(today)

  const { start, end } = getDateRange(datePreset)

  const { data, isLoading } = useAnalytics(effectiveAdvertiserId, start, end, { creativeId, campaignId })
  const { data: creatives } = useCreativeOptions(effectiveAdvertiserId)
  const { data: campaigns } = useCampaignOptions(effectiveAdvertiserId)
  const { data: lifetimeData, isLoading: lifetimeLoading } = useLifetimeMetrics(effectiveAdvertiserId)
  const { data: hourlyData, isLoading: hourlyLoading } = useHourlyMetrics(effectiveAdvertiserId, hourlyDate)
  const { data: deviceData, isLoading: deviceLoading } = useDeviceBreakdown(effectiveAdvertiserId, start, end)

  const metricsChartRef = useRef<HTMLDivElement>(null)
  const creativePieRef = useRef<HTMLDivElement>(null)
  const platformRef = useRef<HTMLDivElement>(null)
  const hourlyChartRef = useRef<HTMLDivElement>(null)

  const chartData = useMemo(() => aggregateByDate(data ?? []), [data])
  const summary = useMemo(() => aggregateSummary(data ?? []), [data])
  const lifetimeSummary = useMemo(() => aggregateSummary(lifetimeData ?? []), [lifetimeData])

  const creativeNames = useMemo(
    () => Object.fromEntries((creatives ?? []).map((c) => [c.id, c.name])),
    [creatives]
  )
  const campaignNames = useMemo(
    () => Object.fromEntries((campaigns ?? []).map((c) => [c.id, c.name])),
    [campaigns]
  )
  const creativePieData = useMemo(
    () => aggregateByCreative(data ?? [], creativeNames),
    [data, creativeNames]
  )

  const hasData = (data?.length ?? 0) > 0

  async function handleRefresh() {
    setRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: ['analytics'] })
    await queryClient.invalidateQueries({ queryKey: ['analytics-lifetime'] })
    await queryClient.invalidateQueries({ queryKey: ['analytics-hourly'] })
    await queryClient.invalidateQueries({ queryKey: ['analytics-device'] })
    setRefreshing(false)
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Track ad performance across campaigns and creatives
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="shrink-0 gap-2"
        >
          <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      {/* Lifetime Totals section */}
      <LifetimeKpiCards
        impressions={lifetimeSummary.impressions}
        clicks={lifetimeSummary.clicks}
        ctr={lifetimeSummary.ctr}
        loading={lifetimeLoading}
      />

      {/* Controls row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <DateRangeSelect value={datePreset} onChange={setDatePreset} />
        <AnalyticsFilters
          creatives={creatives ?? []}
          campaigns={campaigns ?? []}
          selectedCreativeId={creativeId}
          selectedCampaignId={campaignId}
          onCreativeChange={setCreativeId}
          onCampaignChange={setCampaignId}
        />
        <ExportButton
          data={data ?? []}
          dateRange={datePreset}
          creativeNames={creativeNames}
          campaignNames={campaignNames}
        />
      </div>

      {/* Empty state */}
      {!isLoading && !hasData && (
        <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-4">
          <Info className="text-muted-foreground mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-sm font-medium">No analytics data</p>
            <p className="text-muted-foreground text-sm">
              No analytics data for the selected period. Analytics appear once
              ads start serving.
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
        engagementRate={summary.engagementRate}
        engagementMetrics={summary.engagementMetrics}
        showEngagementBreakdown={!!creativeId}
        totalDwellTimeMs={summary.totalDwellTimeMs}
        loading={isLoading}
      />

      {/* Time-series chart */}
      <MetricsChart
        data={chartData}
        loading={isLoading}
        chartRef={metricsChartRef as React.RefObject<HTMLDivElement>}
      />

      {/* Side-by-side charts: Creative Share + Platform Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span />
            <ChartDownloadButton
              chartRef={creativePieRef as React.RefObject<HTMLDivElement>}
              filename="creative-share"
              disabled={creativePieData.length === 0}
            />
          </div>
          <CreativePieChart
            data={creativePieData}
            loading={isLoading}
            chartRef={creativePieRef as React.RefObject<HTMLDivElement>}
          />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span />
            <ChartDownloadButton
              chartRef={platformRef as React.RefObject<HTMLDivElement>}
              filename="platform-breakdown"
              disabled={(deviceData ?? []).length === 0}
            />
          </div>
          <PlatformChart
            data={deviceData ?? []}
            loading={deviceLoading}
            chartRef={platformRef as React.RefObject<HTMLDivElement>}
          />
        </div>
      </div>

      {/* Hourly Breakdown section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Hourly Breakdown</h3>
            <p className="text-muted-foreground text-sm">
              Select a date to see hourly impression and click distribution
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={hourlyDate}
              onChange={(e) => setHourlyDate(e.target.value)}
              max={today}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
            />
            <ChartDownloadButton
              chartRef={hourlyChartRef as React.RefObject<HTMLDivElement>}
              filename="hourly-breakdown"
              disabled={(hourlyData ?? []).length === 0}
            />
          </div>
        </div>
        <HourlyChart
          data={hourlyData ?? []}
          loading={hourlyLoading}
          chartRef={hourlyChartRef as React.RefObject<HTMLDivElement>}
        />
      </div>

      {/* Metrics breakdown table */}
      <MetricsTable
        data={data ?? []}
        creatives={creatives ?? []}
        campaigns={campaigns ?? []}
        loading={isLoading}
      />
    </div>
  )
}
