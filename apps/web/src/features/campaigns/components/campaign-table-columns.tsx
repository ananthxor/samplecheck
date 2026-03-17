import { Link } from 'react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { CampaignTableRow } from '../api/campaigns-api'

export type { CampaignTableRow }

export function getColumns(opts: {
  onEdit: (campaign: CampaignTableRow) => void
  onDelete: (id: string) => void
}): ColumnDef<CampaignTableRow>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-3"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Link
          to={`/campaigns/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.getValue('name')}
        </Link>
      ),
    },
    {
      accessorKey: 'updated_at',
      sortingFn: 'datetime',
      size: 160,
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-3"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Last Modified
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const value = row.getValue<string>('updated_at')
        return <span>{new Date(value).toLocaleDateString()}</span>
      },
    },
    {
      accessorKey: 'impressions_served',
      size: 140,
      header: ({ column }) => (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Impressions
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const value = row.getValue<number>('impressions_served')
        return <div className="text-center">{new Intl.NumberFormat().format(value)}</div>
      },
    },
    {
      id: 'actions',
      size: 60,
      enableHiding: false,
      cell: ({ row }) => {
        const campaign = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => opts.onEdit(campaign)}>
                <Pencil className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => opts.onDelete(campaign.id)}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
