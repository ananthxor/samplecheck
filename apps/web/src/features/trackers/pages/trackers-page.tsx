import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  useTrackerConfigs,
  useDeleteTrackerConfig,
} from '@/features/campaigns/hooks/use-trackers'
import { TrackerTable } from '../components/tracker-table'
import { TrackerFormDialog } from '../components/tracker-form-dialog'
import { TrackerBulkUploadDialog } from '../components/tracker-bulk-upload-dialog'
import type { Tables } from '@scrolltoday/shared'

// ---------------------------------------------------------------------------
// Trackers Page
// ---------------------------------------------------------------------------

export default function TrackersPage() {
  const { data: trackers, isLoading, error, refetch } = useTrackerConfigs()
  const deleteMutation = useDeleteTrackerConfig()

  const [formOpen, setFormOpen] = useState(false)
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)
  const [editingTracker, setEditingTracker] = useState<Tables<'tracker_configs'> | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function handleEdit(tracker: Tables<'tracker_configs'>) {
    setEditingTracker(tracker)
    setFormOpen(true)
  }

  function handleCreate() {
    setEditingTracker(null)
    setFormOpen(true)
  }

  function handleDelete(id: string) {
    setDeleteId(id)
  }

  function confirmDelete() {
    if (!deleteId) return
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        toast.success('Tracker deleted')
        setDeleteId(null)
      },
      onError: (err) => {
        toast.error(`Failed to delete tracker: ${err.message}`)
        setDeleteId(null)
      },
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="mt-1 h-4 w-20" />
          </div>
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="flex gap-1">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-64 rounded-md" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trackers</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-destructive text-sm">
            Failed to load trackers: {error.message}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trackers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {trackers?.length ?? 0}{' '}
            {(trackers?.length ?? 0) === 1 ? 'tracker' : 'trackers'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setBulkUploadOpen(true)}>
            <Upload className="mr-2 size-4" />
            Bulk Upload
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 size-4" />
            Create Tracker
          </Button>
        </div>
      </div>

      {/* Table or empty state */}
      {trackers && trackers.length > 0 ? (
        <TrackerTable
          trackers={trackers}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-lg font-medium text-muted-foreground">
            No trackers yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first tracker to start measuring ad events.
          </p>
          <Button className="mt-4" onClick={handleCreate}>
            Create your first tracker
          </Button>
        </div>
      )}

      {/* Create/Edit dialog */}
      <TrackerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        tracker={editingTracker}
      />

      {/* Bulk upload dialog */}
      <TrackerBulkUploadDialog
        open={bulkUploadOpen}
        onOpenChange={setBulkUploadOpen}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tracker</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tracker? This will remove it
              from all creatives it is assigned to. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
