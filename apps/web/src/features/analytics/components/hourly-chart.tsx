import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { HourlyDataPoint } from '../lib/analytics-types'

interface HourlyChartProps {
  data: HourlyDataPoint[]
  loading?: boolean
  chartRef?: React.RefObject<HTMLDivElement>
}

function formatHour(hour: number): string {
  if (hour === 0) return '12am'
  if (hour < 12) return `${hour}am`
  if (hour === 12) return '12pm'
  return `${hour - 12}pm`
}

const IMP_COLOR = '#3b82f6'
const CLK_COLOR = '#8b5cf6'

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-lg text-xs space-y-1">
      <p className="font-semibold text-foreground mb-1">{formatHour(Number(label))}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: entry.fill }} />
          <span className="text-muted-foreground">
            {entry.dataKey === 'impressions' ? 'Impressions' : 'Clicks'}:
          </span>
          <span className="font-medium text-foreground">
            {new Intl.NumberFormat('en-US').format(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function HourlyChart({ data, loading, chartRef }: HourlyChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hourly Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : data.length === 0 ? (
          <div className="text-muted-foreground flex h-[300px] items-center justify-center">
            No data available for the selected date.
          </div>
        ) : (
          <div ref={chartRef}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} barCategoryGap="30%" barGap={3}>
                <defs>
                  <linearGradient id="hourImpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={IMP_COLOR} stopOpacity={1} />
                    <stop offset="100%" stopColor={IMP_COLOR} stopOpacity={0.5} />
                  </linearGradient>
                  <linearGradient id="hourClkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CLK_COLOR} stopOpacity={1} />
                    <stop offset="100%" stopColor={CLK_COLOR} stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis
                  dataKey="hour_of_day"
                  interval={2}
                  tickFormatter={formatHour}
                  axisLine={false}
                  tickLine={false}
                  className="text-[10px] font-medium"
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  className="text-[10px] font-medium"
                  tickFormatter={(v) =>
                    new Intl.NumberFormat('en-US', { notation: 'compact' }).format(v)
                  }
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', radius: 4 }} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }}
                  formatter={(value: string) =>
                    value === 'impressions' ? 'Impressions' : 'Clicks'
                  }
                />
                <Bar
                  dataKey="impressions"
                  fill="url(#hourImpGrad)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                />
                <Bar
                  dataKey="clicks"
                  fill="url(#hourClkGrad)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
