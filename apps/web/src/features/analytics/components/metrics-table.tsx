import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { DailyMetricRow } from '../lib/analytics-types'

const numberFormatter = new Intl.NumberFormat('en-US')

interface MetricsTableProps {
  data: DailyMetricRow[]
  creatives: { id: string; name: string }[]
  campaigns: { id: string; name: string }[]
  loading?: boolean
}

type ViewMode = 'by-creative' | 'by-campaign'

interface AggregatedRow {
  id: string
  name: string
  impressions: number
  clicks: number
  ctr: number
  engagements: number
  engagementRate: number
  avgDwellSec: number
  videoCompletionRate: number
}

function aggregateRows(
  rows: DailyMetricRow[],
  view: ViewMode,
  creatives: { id: string; name: string }[],
  campaigns: { id: string; name: string }[]
): AggregatedRow[] {
  const groups = new Map<
    string,
    {
      impressions: number
      clicks: number
      engagements: number
      totalDwellTimeMs: number
      videoPlays: number
      videoCompletes: number
    }
  >()

  for (const row of rows) {
    const key =
      view === 'by-creative'
        ? row.creative_id ?? 'unknown'
        : row.campaign_id ?? 'unassigned'

    const existing = groups.get(key) ?? {
      impressions: 0,
      clicks: 0,
      engagements: 0,
      totalDwellTimeMs: 0,
      videoPlays: 0,
      videoCompletes: 0,
    }
    existing.impressions += row.impressions_served
    existing.clicks += row.clicks
    existing.engagements += row.engagements
    existing.totalDwellTimeMs += row.total_dwell_time_ms
    existing.videoPlays += row.video_plays
    existing.videoCompletes += row.video_completes
    groups.set(key, existing)
  }

  const result: AggregatedRow[] = []
  for (const [id, agg] of groups) {
    let name: string
    if (view === 'by-creative') {
      name =
        creatives.find((c) => c.id === id)?.name ?? (id === 'unknown' ? 'Unknown' : id)
    } else {
      name =
        id === 'unassigned'
          ? 'Unassigned'
          : campaigns.find((c) => c.id === id)?.name ?? id
    }

    const ctr =
      agg.impressions > 0
        ? Number(((agg.clicks / agg.impressions) * 100).toFixed(2))
        : 0
    const engagementRate =
      agg.impressions > 0
        ? Number(((agg.engagements / agg.impressions) * 100).toFixed(2))
        : 0
    const avgDwellSec =
      agg.impressions > 0 ? agg.totalDwellTimeMs / agg.impressions / 1000 : 0
    const videoCompletionRate =
      agg.videoPlays > 0
        ? Number(((agg.videoCompletes / agg.videoPlays) * 100).toFixed(2))
        : 0

    result.push({
      id,
      name,
      impressions: agg.impressions,
      clicks: agg.clicks,
      ctr,
      engagements: agg.engagements,
      engagementRate,
      avgDwellSec,
      videoCompletionRate,
    })
  }

  return result.sort((a, b) => b.impressions - a.impressions)
}

export function MetricsTable({
  data,
  creatives,
  campaigns,
  loading,
}: MetricsTableProps) {
  const [view, setView] = useState<ViewMode>('by-creative')

  const rows = useMemo(
    () => aggregateRows(data, view, creatives, campaigns),
    [data, view, creatives, campaigns]
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Metrics Breakdown</CardTitle>
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as ViewMode)}
          >
            <TabsList>
              <TabsTrigger value="by-creative">By Creative</TabsTrigger>
              <TabsTrigger value="by-campaign">By Campaign</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            No data available for the selected period.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {view === 'by-creative' ? 'Creative' : 'Campaign'}
                </TableHead>
                <TableHead className="text-right">Impressions</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">Eng. Rate</TableHead>
                <TableHead className="text-right">Avg Dwell</TableHead>
                <TableHead className="text-right">Engagements</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-right">
                    {numberFormatter.format(row.impressions)}
                  </TableCell>
                  <TableCell className="text-right">
                    {numberFormatter.format(row.clicks)}
                  </TableCell>
                  <TableCell className="text-right">{row.ctr}%</TableCell>
                  <TableCell className="text-right">{row.engagementRate}%</TableCell>
                  <TableCell className="text-right">
                    {row.avgDwellSec > 0 ? `${row.avgDwellSec.toFixed(1)}s` : '\u2014'}
                  </TableCell>
                  <TableCell className="text-right">
                    {numberFormatter.format(row.engagements)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
