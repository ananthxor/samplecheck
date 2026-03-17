import { useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Sector,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { CreativePieSlice } from '../lib/analytics-types'

interface CreativePieChartProps {
  data: CreativePieSlice[]
  loading?: boolean
  chartRef?: React.RefObject<HTMLDivElement>
}

const COLORS = [
  '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a',
  '#0891b2', '#d97706', '#9333ea', '#dc2626', '#0d9488',
]

const numberFormatter = new Intl.NumberFormat('en-US')

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  const total = entry.payload._total as number
  const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0'
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-lg text-xs space-y-1">
      <div className="flex items-center gap-2 font-semibold text-foreground mb-1">
        <span className="inline-block w-2 h-2 rounded-full" style={{ background: entry.payload.fill }} />
        {entry.name}
      </div>
      <div className="flex gap-3 text-muted-foreground">
        <span>Impressions: <span className="font-medium text-foreground">{numberFormatter.format(entry.value)}</span></span>
        <span>Share: <span className="font-medium text-foreground">{pct}%</span></span>
      </div>
    </div>
  )
}

function ActiveShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props
  return (
    <g>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.95}
      />
    </g>
  )
}

function CustomLegend({
  data,
  total,
  activeIndex,
  onHover,
}: {
  data: CreativePieSlice[]
  total: number
  activeIndex: number | null
  onHover: (i: number | null) => void
}) {
  return (
    <div className="mt-4 space-y-1.5">
      {data.map((entry, i) => {
        const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0'
        const isActive = activeIndex === i
        return (
          <div
            key={entry.name}
            className="flex items-center gap-2 cursor-pointer rounded px-2 py-1 transition-colors hover:bg-muted/50"
            style={{ opacity: activeIndex !== null && !isActive ? 0.45 : 1 }}
            onMouseEnter={() => onHover(i)}
            onMouseLeave={() => onHover(null)}
          >
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className="text-xs text-muted-foreground truncate flex-1">{entry.name}</span>
            <span className="text-xs font-semibold text-foreground tabular-nums ml-auto shrink-0">
              {pct}%
            </span>
            <span className="text-xs text-muted-foreground tabular-nums shrink-0 w-16 text-right">
              {numberFormatter.format(entry.value)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function CreativePieChart({ data, loading, chartRef }: CreativePieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const total = data.reduce((s, d) => s + d.value, 0)

  // Attach total and fill to each entry for tooltip access
  const enriched = data.map((d, i) => ({
    ...d,
    fill: COLORS[i % COLORS.length],
    _total: total,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Creative Share</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : data.length === 0 ? (
          <div className="text-muted-foreground flex h-[300px] items-center justify-center">
            No impression data for the selected period.
          </div>
        ) : (
          <div ref={chartRef}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={enriched}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="42%"
                  outerRadius="68%"
                  paddingAngle={3}
                  activeShape={<ActiveShape />}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {enriched.map((entry, i) => (
                    <Cell
                      key={`cell-${i}`}
                      fill={entry.fill}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                {/* Centre label */}
                <text
                  x="50%" y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-foreground"
                >
                  <tspan x="50%" dy="-8" fontSize="18" fontWeight="700">
                    {new Intl.NumberFormat('en-US', { notation: 'compact' }).format(total)}
                  </tspan>
                  <tspan x="50%" dy="18" fontSize="11" fill="#6b7280">
                    impressions
                  </tspan>
                </text>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <CustomLegend
              data={data}
              total={total}
              activeIndex={activeIndex}
              onHover={setActiveIndex}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
