import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { DeviceBreakdownPoint } from '../lib/analytics-types'

interface PlatformChartProps {
  data: DeviceBreakdownPoint[]
  loading?: boolean
  chartRef?: React.RefObject<HTMLDivElement>
}

const DEVICE_COLORS: Record<string, { bar: string; grad: string }> = {
  desktop: { bar: '#2563eb', grad: 'platDesktop' },
  mobile:  { bar: '#7c3aed', grad: 'platMobile' },
  tablet:  { bar: '#16a34a', grad: 'platTablet' },
  unknown: { bar: '#9ca3af', grad: 'platUnknown' },
}

function getDeviceStyle(type: string) {
  return DEVICE_COLORS[type.toLowerCase()] ?? { bar: '#6366f1', grad: 'platFallback' }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const numberFormatter = new Intl.NumberFormat('en-US')

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const style = getDeviceStyle(String(label))
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-lg text-xs space-y-1">
      <div className="flex items-center gap-2 font-semibold text-foreground mb-1">
        <span className="inline-block w-2 h-2 rounded-full" style={{ background: style.bar }} />
        {capitalize(String(label))}
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        Impressions:
        <span className="font-medium text-foreground">
          {numberFormatter.format(payload[0].value)}
        </span>
      </div>
    </div>
  )
}

function CustomLegend({ data }: { data: DeviceBreakdownPoint[] }) {
  const total = data.reduce((s, d) => s + Number(d.impressions), 0)
  return (
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 justify-center">
      {data.map((d) => {
        const style = getDeviceStyle(d.device_type)
        const pct = total > 0 ? ((Number(d.impressions) / total) * 100).toFixed(1) : '0'
        return (
          <div key={d.device_type} className="flex items-center gap-1.5 text-xs">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: style.bar }} />
            <span className="text-muted-foreground">{capitalize(d.device_type)}</span>
            <span className="font-semibold text-foreground">{pct}%</span>
          </div>
        )
      })}
    </div>
  )
}

export function PlatformChart({ data, loading, chartRef }: PlatformChartProps) {
  const gradIds = ['platDesktop', 'platMobile', 'platTablet', 'platUnknown', 'platFallback']
  const gradColors = ['#2563eb', '#7c3aed', '#16a34a', '#9ca3af', '#6366f1']

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : data.length === 0 ? (
          <div className="text-muted-foreground flex h-[260px] items-center justify-center">
            No device data available for the selected period.
          </div>
        ) : (
          <div ref={chartRef}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data} layout="vertical" barCategoryGap="35%">
                <defs>
                  {gradIds.map((id, i) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={gradColors[i]} stopOpacity={1} />
                      <stop offset="100%" stopColor={gradColors[i]} stopOpacity={0.55} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  className="text-[10px] font-medium"
                  tickFormatter={(v) =>
                    new Intl.NumberFormat('en-US', { notation: 'compact' }).format(v)
                  }
                />
                <YAxis
                  type="category"
                  dataKey="device_type"
                  tickFormatter={capitalize}
                  axisLine={false}
                  tickLine={false}
                  className="text-[10px] font-medium"
                  width={72}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', radius: 4 }} />
                <Bar dataKey="impressions" radius={[0, 4, 4, 0]} maxBarSize={28}>
                  {data.map((entry) => {
                    const style = getDeviceStyle(entry.device_type)
                    return (
                      <Cell
                        key={entry.device_type}
                        fill={`url(#${style.grad})`}
                      />
                    )
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <CustomLegend data={data} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
