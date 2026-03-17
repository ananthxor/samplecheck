import { useState } from 'react'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { CalendarIcon } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useCreateReport } from '../hooks/use-reports'
import {
  REPORT_TYPE_OPTIONS,
  METRIC_OPTIONS,
  type ReportType,
  type ReportResolution,
  type ReportMetric,
} from '../lib/report-types'

interface ReportBuilderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DEFAULT_METRICS: ReportMetric[] = ['impressions', 'clicks', 'ctr', 'viewability']

export function ReportBuilderDialog({ open, onOpenChange }: ReportBuilderDialogProps) {
  const createReport = useCreateReport()

  const [name, setName] = useState('')
  const [reportType, setReportType] = useState<ReportType>('display')
  const [resolution, setResolution] = useState<ReportResolution>('daily')
  const [metrics, setMetrics] = useState<ReportMetric[]>(DEFAULT_METRICS)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [nameError, setNameError] = useState('')

  function toggleMetric(metric: ReportMetric) {
    setMetrics((prev) =>
      prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric]
    )
  }

  function handleClose(open: boolean) {
    if (!open) {
      setName('')
      setNameError('')
      setReportType('display')
      setResolution('daily')
      setMetrics(DEFAULT_METRICS)
      setDateRange(undefined)
    }
    onOpenChange(open)
  }

  async function handleSubmit() {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setNameError('Report name is required')
      return
    }
    if (!dateRange?.from || !dateRange?.to) {
      setNameError('Select a date range')
      return
    }
    if (metrics.length === 0) {
      setNameError('Select at least one metric')
      return
    }
    setNameError('')

    await createReport.mutateAsync({
      name: trimmedName,
      report_type: reportType,
      resolution,
      metrics,
      date_range_start: format(dateRange.from, 'yyyy-MM-dd'),
      date_range_end: format(dateRange.to, 'yyyy-MM-dd'),
    })
    handleClose(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Report name */}
          <div className="space-y-1.5">
            <Label htmlFor="report-name">Report Name</Label>
            <Input
              id="report-name"
              placeholder="e.g. Q1 Display Performance"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError('') }}
            />
          </div>

          {/* Report type */}
          <div className="space-y-1.5">
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range */}
          <div className="space-y-1.5">
            <Label>Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-normal">
                  <CalendarIcon className="mr-2 size-4" />
                  {dateRange?.from && dateRange?.to
                    ? `${format(dateRange.from, 'MMM d, yyyy')} – ${format(dateRange.to, 'MMM d, yyyy')}`
                    : 'Pick a date range'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  disabled={{ after: new Date() }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Resolution */}
          <div className="space-y-1.5">
            <Label>Data Resolution</Label>
            <Select value={resolution} onValueChange={(v) => setResolution(v as ReportResolution)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Metrics checkboxes */}
          <div className="space-y-2">
            <Label>Metrics</Label>
            <div className="grid grid-cols-2 gap-2">
              {METRIC_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`metric-${opt.value}`}
                    checked={metrics.includes(opt.value)}
                    onCheckedChange={() => toggleMetric(opt.value)}
                  />
                  <label htmlFor={`metric-${opt.value}`} className="text-sm cursor-pointer">
                    {opt.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {nameError && (
            <p className="text-sm text-destructive">{nameError}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createReport.isPending}>
            {createReport.isPending ? 'Saving...' : 'Save Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
