import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { useAnalytics } from '@/features/analytics/hooks/use-analytics'
import { useSavedReports } from '../hooks/use-reports'
import { ReportBuilderDialog } from '../components/report-builder-dialog'
import { SavedReportsList } from '../components/saved-reports-list'
import type { SavedReport } from '../lib/report-types'
import type { DailyMetricRow } from '@/features/analytics/lib/analytics-types'

export default function ReportsPage() {
  const { data: reports = [], isLoading } = useSavedReports()
  const { activeAdvertiserId } = useAuth()
  const [builderOpen, setBuilderOpen] = useState(false)
  const [activeReport, setActiveReport] = useState<SavedReport | null>(null)

  // Pull dates out so we can check them in the enabled condition
  const startDate = activeReport?.date_range_start ?? ''
  const endDate = activeReport?.date_range_end ?? ''

  // Re-run analytics for the active report's date range.
  // useAnalytics is always enabled when profile exists, so we only consume
  // the result when activeReport is set (non-empty dates).
  const { data: reportData = [], isLoading: reportLoading } = useAnalytics(
    activeAdvertiserId ?? null,
    startDate,
    endDate,
  )

  // Only treat reportData as valid when activeReport is set with real dates.
  // This prevents rendering stale/empty cards from a spurious load on page init.
  const hasActiveReport = !!activeReport && !!startDate && !!endDate
  const safeReportData: DailyMetricRow[] = hasActiveReport ? (reportData as DailyMetricRow[]) : []

  function handleReRun(report: SavedReport) {
    setActiveReport(report)
  }

  const fmt = new Intl.NumberFormat('en-US')
  const totalImpressions = safeReportData.reduce((sum, r) => sum + (r.impressions_served ?? 0), 0)
  const totalClicks = safeReportData.reduce((sum, r) => sum + (r.clicks ?? 0), 0)
  const totalEngagements = safeReportData.reduce((sum, r) => sum + (r.engagements ?? 0), 0)
  const totalVideoPlays = safeReportData.reduce((sum, r) => sum + (r.video_plays ?? 0), 0)
  const totalVideoCompletes = safeReportData.reduce((sum, r) => sum + (r.video_completes ?? 0), 0)
  const totalViewable = safeReportData.reduce((sum, r) => sum + (r.impressions_viewable ?? 0), 0)

  const ctr = totalImpressions > 0
    ? ((totalClicks / totalImpressions) * 100).toFixed(2)
    : '0.00'
  const engagementRate = totalImpressions > 0
    ? ((totalEngagements / totalImpressions) * 100).toFixed(2)
    : '0.00'
  const videoCompRate = totalVideoPlays > 0
    ? ((totalVideoCompletes / totalVideoPlays) * 100).toFixed(2)
    : '0.00'
  const viewabilityRate = totalImpressions > 0
    ? ((totalViewable / totalImpressions) * 100).toFixed(2)
    : '0.00'

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Build, save, and re-run custom analytics reports
          </p>
        </div>
        <Button onClick={() => setBuilderOpen(true)}>
          <Plus className="mr-2 size-4" />
          New Report
        </Button>
      </div>

      {/* Active report result (shown after re-run) */}
      {activeReport && (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">{activeReport.name}</h2>
            <p className="text-sm text-muted-foreground">
              {activeReport.date_range_start} to {activeReport.date_range_end} · {activeReport.resolution}
            </p>
          </div>
          {reportLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[...Array(activeReport.metrics.length)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {activeReport.metrics.includes('impressions') && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Impressions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{fmt.format(totalImpressions)}</p>
                  </CardContent>
                </Card>
              )}
              {activeReport.metrics.includes('clicks') && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Clicks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{fmt.format(totalClicks)}</p>
                  </CardContent>
                </Card>
              )}
              {activeReport.metrics.includes('ctr') && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">CTR</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{ctr}%</p>
                  </CardContent>
                </Card>
              )}
              {activeReport.metrics.includes('engagement_rate') && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Eng. Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{engagementRate}%</p>
                  </CardContent>
                </Card>
              )}
              {activeReport.metrics.includes('video_completion') && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Video Comp.</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{videoCompRate}%</p>
                  </CardContent>
                </Card>
              )}
              {activeReport.metrics.includes('viewability') && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Viewability</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{viewabilityRate}%</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* Saved reports list */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Saved Reports</h2>
        <SavedReportsList
          reports={reports}
          loading={isLoading}
          onReRun={handleReRun}
          runningData={safeReportData}
          activeReportId={activeReport?.id ?? null}
        />
      </section>

      <ReportBuilderDialog open={builderOpen} onOpenChange={setBuilderOpen} />
    </div>
  )
}
