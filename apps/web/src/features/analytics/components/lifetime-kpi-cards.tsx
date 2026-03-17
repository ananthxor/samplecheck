import { Eye, MousePointerClick, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface LifetimeKpiCardsProps {
  impressions: number
  clicks: number
  ctr: number
  loading?: boolean
}

const numberFormatter = new Intl.NumberFormat('en-US')

export function LifetimeKpiCards({
  impressions,
  clicks,
  ctr,
  loading,
}: LifetimeKpiCardsProps) {
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
  ]

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-lg font-semibold">Lifetime Totals</h3>
        <p className="text-muted-foreground text-sm">
          All-time performance across all date ranges
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
      </div>
    </div>
  )
}
