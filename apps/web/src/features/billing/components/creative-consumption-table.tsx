import { useState } from 'react'
import {
  type ColumnDef,
  type SortingState,
  type PaginationState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import type { CreativeConsumptionRow } from '../lib/billing-types'

const fmt = new Intl.NumberFormat('en-US')

const columns: ColumnDef<CreativeConsumptionRow>[] = [
  {
    accessorKey: 'creativeName',
    header: 'Creative',
    cell: ({ getValue }) => (
      <span className="font-medium">{String(getValue())}</span>
    ),
  },
  { accessorKey: 'bucket', header: 'Type' },
  {
    accessorKey: 'impressions',
    header: 'Impressions',
    cell: ({ getValue }) => fmt.format(getValue() as number),
  },
  {
    accessorKey: 'clicks',
    header: 'Clicks',
    cell: ({ getValue }) => fmt.format(getValue() as number),
  },
  {
    accessorKey: 'ctr',
    header: 'CTR (%)',
    cell: ({ getValue }) => `${(getValue() as number).toFixed(2)}%`,
  },
  {
    accessorKey: 'engagementRate',
    header: 'Eng. Rate',
    cell: ({ getValue }) => `${(getValue() as number).toFixed(2)}%`,
  },
  {
    accessorKey: 'videoCompletionRate',
    header: 'Video Comp.',
    cell: ({ getValue }) => {
      const val = getValue() as number
      return val > 0 ? `${val.toFixed(2)}%` : '\u2014'
    },
  },
  {
    accessorKey: 'cost',
    header: 'Credits',
    cell: ({ getValue }) => fmt.format(getValue() as number),
  },
]

interface CreativeConsumptionTableProps {
  data: CreativeConsumptionRow[]
  loading: boolean
}

export function CreativeConsumptionTable({ data, loading }: CreativeConsumptionTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: (f) => {
      setGlobalFilter(f)
      setPagination((prev) => ({ ...prev, pageIndex: 0 })) // reset on search
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
  })

  if (loading) {
    return <Skeleton className="h-48 rounded-md" />
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search creatives..."
        value={globalFilter}
        onChange={(e) => table.setGlobalFilter(e.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No data for selected period.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination controls */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Page {table.getState().pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
