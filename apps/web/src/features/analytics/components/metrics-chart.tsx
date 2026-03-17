import { useState, useRef, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartDownloadButton } from './chart-download-button'
import type { ChartDataPoint } from '../lib/analytics-types'
import { cn } from '@/lib/utils'

interface MetricsChartProps {
  data: ChartDataPoint[]
  loading?: boolean
  chartRef?: React.RefObject<HTMLDivElement>
}

/**
 * All possible metrics that can be plotted on the chart.
 * Includes base metrics and dynamic engagement types.
 */
interface MetricDefinition {
  id: string
  label: string
  color: string
  type: 'count' | 'percent' | 'duration'
  getData: (point: ChartDataPoint) => number
  /** Calculate period total/average for the toggle card summary */
  getSummary: (data: ChartDataPoint[]) => number
}

const BASE_METRICS: MetricDefinition[] = [
  {
    id: 'impressions',
    label: 'Impressions',
    color: 'var(--chart-1, #2563eb)',
    type: 'count',
    getData: (p) => p.impressions,
    getSummary: (data) => data.reduce((sum, p) => sum + p.impressions, 0),
  },
  {
    id: 'clicks',
    label: 'Clicks',
    color: 'var(--chart-2, #7c3aed)',
    type: 'count',
    getData: (p) => p.clicks,
    getSummary: (data) => data.reduce((sum, p) => sum + p.clicks, 0),
  },
  {
    id: 'ctr',
    label: 'CTR',
    color: 'var(--chart-3, #db2777)',
    type: 'percent',
    getData: (p) => p.ctr,
    getSummary: (data) => {
      const imps = data.reduce((sum, p) => sum + p.impressions, 0)
      const clicks = data.reduce((sum, p) => sum + p.clicks, 0)
      return imps > 0 ? (clicks / imps) * 100 : 0
    },
  },
  {
    id: 'engagements',
    label: 'Total Engagements',
    color: 'var(--chart-4, #ea580c)',
    type: 'count',
    getData: (p) => p.engagements,
    getSummary: (data) => data.reduce((sum, p) => sum + p.engagements, 0),
  },
  {
    id: 'dwell-time',
    label: 'Avg Dwell Time',
    color: 'var(--chart-5, #16a34a)',
    type: 'duration',
    getData: (p) => p.avgDwellTimeMs / 1000,
    getSummary: (data) => {
      const imps = data.reduce((sum, p) => sum + p.impressions, 0)
      const dwell = data.reduce((sum, p) => sum + p.avgDwellTimeMs * p.impressions, 0)
      return imps > 0 ? dwell / imps / 1000 : 0
    },
  },
]

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function MetricsChart({ data, loading, chartRef }: MetricsChartProps) {
  const [activeMetrics, setActiveMetrics] = useState<string[]>(['impressions'])
  const localRef = useRef<HTMLDivElement>(null)
  const resolvedRef = chartRef ?? localRef

  const allMetrics = BASE_METRICS
  const activeDefs = allMetrics.filter((m) => activeMetrics.includes(m.id))

  const toggleMetric = (id: string) => {
    setActiveMetrics((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev // Keep at least one
        return prev.filter((m) => m !== id)
      }
      return [...prev, id]
    })
  }

  // 2. Transform data for Recharts (flatten engagement metrics into top-level keys)
  const chartData = useMemo(() => {
    return data.map((point) => {
      const row: any = { ...point, date: point.date }
      allMetrics.forEach((m) => {
        row[m.id] = m.getData(point)
      })
      return row
    })
  }, [data, allMetrics])

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/20 pb-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          <CardTitle>Performance Over Time</CardTitle>
          <ChartDownloadButton
            chartRef={resolvedRef as React.RefObject<HTMLDivElement>}
            filename="performance-chart"
            disabled={data.length === 0}
          />
        </div>

        {/* GSC-style Multi-select controls */}
        <div className="flex flex-wrap gap-2">
          {allMetrics.map((m) => {
            const isActive = activeMetrics.includes(m.id)
            return (
              <button
                key={m.id}
                onClick={() => toggleMetric(m.id)}
                className={cn(
                  'flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-all hover:bg-muted/50',
                  isActive
                    ? 'border-transparent bg-white shadow-sm ring-2 ring-offset-1'
                    : 'bg-transparent text-muted-foreground grayscale opacity-60'
                )}
                style={{
                  '--tw-ring-color': isActive ? m.color : 'transparent',
                  borderLeft: `4px solid ${m.color}`,
                } as React.CSSProperties}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  {m.label}
                </span>
                <span className="text-lg font-bold tabular-nums">
                  {data.length > 0
                    ? m.type === 'percent'
                      ? m.getSummary(data).toFixed(2) + '%'
                      : m.type === 'duration'
                        ? m.getSummary(data).toFixed(1) + 's'
                        : new Intl.NumberFormat('en-US', { notation: 'compact' }).format(
                            m.getSummary(data)
                          )
                    : '0'}
                </span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : data.length === 0 ? (
          <div className="text-muted-foreground flex h-[400px] items-center justify-center">
            No data available for the selected period.
          </div>
        ) : (
          <div ref={resolvedRef}>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  {activeDefs.map((m) => (
                    <linearGradient key={m.id} id={`grad_${m.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={m.color} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={m.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  className="text-[10px] font-medium"
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  className="text-[10px] font-medium"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) =>
                    new Intl.NumberFormat('en-US', { notation: 'compact' }).format(val)
                  }
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  labelFormatter={(label) =>
                    new Date(String(label) + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  }
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                {activeDefs.map((m) => (
                  <Area
                    key={m.id}
                    type="monotone"
                    dataKey={m.id}
                    name={m.label}
                    stroke={m.color}
                    strokeWidth={2}
                    fill={`url(#grad_${m.id})`}
                    animationDuration={600}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
