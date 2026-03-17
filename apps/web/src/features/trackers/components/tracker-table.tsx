import { useState } from 'react'
import { Search, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  TRACKER_CATEGORIES,
  TRACKER_CATEGORY_LABELS,
  TRACKER_TYPE_LABELS,
  type TrackerCategory,
} from '@/features/campaigns/lib/tracker-types'
import type { Tables } from '@scrolltoday/shared'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TrackerTableProps {
  trackers: Tables<'tracker_configs'>[]
  onEdit: (tracker: Tables<'tracker_configs'>) => void
  onDelete: (id: string) => void
}

// ---------------------------------------------------------------------------
// Category badge variant mapping
// ---------------------------------------------------------------------------

const categoryBadgeVariant: Record<
  string,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  conversion: 'default',
  impression: 'secondary',
  click: 'outline',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TrackerTable({ trackers, onEdit, onDelete }: TrackerTableProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [search, setSearch] = useState('')

  // Client-side filtering
  const filtered = trackers.filter((t) => {
    const matchesCategory =
      activeCategory === 'all' || t.category === activeCategory
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-4">
      {/* Category filter tabs + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant={activeCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory('all')}
          >
            All
          </Button>
          {TRACKER_CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat)}
            >
              {TRACKER_CATEGORY_LABELS[cat]}
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search trackers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">No trackers found.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden md:table-cell">URL</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((tracker) => (
                <TableRow key={tracker.id}>
                  <TableCell className="font-medium">{tracker.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        categoryBadgeVariant[tracker.category] ?? 'secondary'
                      }
                    >
                      {TRACKER_CATEGORY_LABELS[
                        tracker.category as TrackerCategory
                      ] ?? tracker.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {TRACKER_TYPE_LABELS[
                      tracker.tracker_type as keyof typeof TRACKER_TYPE_LABELS
                    ] ?? tracker.tracker_type}
                  </TableCell>
                  <TableCell className="hidden max-w-[200px] truncate md:table-cell">
                    <span className="text-xs text-muted-foreground">
                      {tracker.tracker_url.length > 50
                        ? `${tracker.tracker_url.slice(0, 50)}...`
                        : tracker.tracker_url}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(tracker)}>
                          <Pencil className="mr-2 size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onDelete(tracker.id)}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} tracker{filtered.length !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
