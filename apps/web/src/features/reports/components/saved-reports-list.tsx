import { useState } from 'react'
import { RefreshCw, Download, Trash2, Search } from 'lucide-react'
import { format } from 'date-fns'
import {
  type ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useDeleteReport } from '../hooks/use-reports'
import { exportReportXls } from '../lib/report-xls-export'
import type { SavedReport, ReportType } from '../lib/report-types'
import type { DailyMetricRow } from '@/features/analytics/lib/analytics-types'

interface SavedReportsListProps {
  reports: SavedReport[]
  loading: boolean
  // Called when user clicks Re-run; parent fetches data and shows result
  onReRun: (report: SavedReport) => void
  // Data for the currently re-running report (for XLS export)
  runningData: DailyMetricRow[]
  activeReportId: string | null
}

const TYPE_TABS: { label: string; value: 'all' | ReportType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Display', value: 'display' },
  { label: 'Standard Banner', value: 'standard_banner' },
  { label: 'Tracker', value: 'tracker' },
  { label: 'Placement', value: 'placement' },
]

function ReportRow({
  report,
  isActive,
  onReRun,
  onExport,
  onDelete,
}: {
  report: SavedReport
  isActive: boolean
  onReRun: () => void
  onExport: () => void
  onDelete: () => void
}) {
  return (
    <TableRow className={isActive ? 'bg-muted/50' : undefined}>
      <TableCell className="font-medium">{report.name}</TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">{report.report_type.replace('_', ' ')}</Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {format(new Date(report.date_range_start), 'MMM d, yyyy')} –{' '}
        {format(new Date(report.date_range_end), 'MMM d, yyyy')}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {report.metrics.join(', ')}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" title="Re-run report" onClick={onReRun}>
            <RefreshCw className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Export XLS" onClick={onExport} disabled={!isActive}>
            <Download className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Delete" onClick={onDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function SavedReportsList({
  reports,
  loading,
  onReRun,
  runningData,
  activeReportId,
}: SavedReportsListProps) {
  const deleteReport = useDeleteReport()
  const [activeTab, setActiveTab] = useState<'all' | ReportType>('all')
  const [globalFilter, setGlobalFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const filteredByTab = activeTab === 'all'
    ? reports
    : reports.filter((r) => r.report_type === activeTab)

  const table = useReactTable({
    data: filteredByTab,
    columns: [{ id: 'name', accessorKey: 'name' }] as ColumnDef<SavedReport>[],
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
  })

  const displayRows = table.getRowModel().rows.map((r) => r.original)

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 rounded-md" />)}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          {TYPE_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {displayRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <p className="text-sm">
                {reports.length === 0
                  ? 'No saved reports yet. Create your first report above.'
                  : 'No reports match your search.'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Metrics</TableHead>
                    <TableHead className="w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRows.map((report) => (
                    <ReportRow
                      key={report.id}
                      report={report}
                      isActive={activeReportId === report.id}
                      onReRun={() => onReRun(report)}
                      onExport={() => {
                        const activeReport = reports.find((r) => r.id === activeReportId)
                        if (activeReport) {
                          exportReportXls(runningData, {}, {}, `${activeReport.name}-${activeReport.date_range_start}_${activeReport.date_range_end}`)
                        }
                      }}
                      onDelete={() => setDeleteTarget(report.id)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the saved report configuration. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteTarget) deleteReport.mutate(deleteTarget)
                setDeleteTarget(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
