import {
  Eye,
  MousePointerClick,
  TrendingUp,
  Activity,
  Clock,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const numberFormatter = new Intl.NumberFormat('en-US')

interface KpiCardsProps {
  impressions: number
  clicks: number
  ctr: number
  engagements: number
  engagementRate: number
  engagementMetrics?: Record<string, number>
  /** Only show per-type breakdown when a single creative is filtered */
  showEngagementBreakdown?: boolean
  totalDwellTimeMs: number
  loading?: boolean
}

export function KpiCards({
  impressions,
  clicks,
  ctr,
  engagements,
  engagementRate,
  engagementMetrics,
  showEngagementBreakdown,
  totalDwellTimeMs,
  loading,
}: KpiCardsProps) {
  const avgDwellSec =
    impressions > 0 ? totalDwellTimeMs / impressions / 1000 : 0

  // Build engagement breakdown string: "flip: 10, hover: 5"
  const engBreakdownEntries = Object.entries(engagementMetrics ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)


  const cards = [
    {
      title: 'Impressions',
      icon: Eye,
      value: numberFormatter.format(impressions),
    },
    {
      title: 'Clicks',
      icon: MousePointerClick,
      value: numberFormatter.format(clicks),
    },
    {
      title: 'CTR',
      icon: TrendingUp,
      value: ctr.toFixed(2) + '%',
    },
    {
      title: 'Engagement Rate',
      icon: Activity,
      value: engagementRate.toFixed(2) + '%',
    },
    {
      title: 'Avg Dwell Time',
      icon: Clock,
      value: avgDwellSec > 0 ? avgDwellSec.toFixed(1) + 's' : '\u2014',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">{card.value}</p>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Engagements breakdown card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Engagements</CardTitle>
          <Zap className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : engagements > 0 ? (
            <div>
              <p className="text-2xl font-bold">{numberFormatter.format(engagements)}</p>
              {showEngagementBreakdown && engBreakdownEntries.length > 0 && (
                <div className="text-muted-foreground mt-1 space-y-0.5 text-xs">
                  {engBreakdownEntries.map(([type, count]) => (
                    <div key={type} className="flex justify-between">
                      <span className="truncate capitalize">{type}</span>
                      <span className="ml-2 font-medium">{numberFormatter.format(count)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-2xl font-bold">{'\u2014'}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
