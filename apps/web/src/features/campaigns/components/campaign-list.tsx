import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
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
import { useAuth } from '@/contexts/auth-context'
import { useCampaignsForTable, useDeleteCampaign } from '../hooks/use-campaigns'
import { CampaignDataTable } from './campaign-data-table'
import { getColumns } from './campaign-table-columns'
import { CampaignFormDialog } from './campaign-form-dialog'
import type { CampaignTableRow } from '../api/campaigns-api'

export function CampaignList() {
  const { effectiveAdvertiserId } = useAuth()
  const { data: campaigns, isLoading, error, refetch } = useCampaignsForTable(effectiveAdvertiserId ?? undefined)
  const deleteMutation = useDeleteCampaign()

  const [formOpen, setFormOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] =
    useState<CampaignTableRow | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function handleEdit(campaign: CampaignTableRow) {
    setEditingCampaign(campaign)
    setFormOpen(true)
  }

  function handleCreate() {
    setEditingCampaign(null)
    setFormOpen(true)
  }

  function handleDelete(id: string) {
    setDeleteId(id)
  }

  function confirmDelete() {
    if (!deleteId) return
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        toast.success('Campaign deleted')
        setDeleteId(null)
      },
      onError: (err) => {
        toast.error(`Failed to delete campaign: ${err.message}`)
        setDeleteId(null)
      },
    })
  }

  const columns = useMemo(
    () => getColumns({ onEdit: handleEdit, onDelete: handleDelete }),
    []
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="mt-1 h-4 w-24" />
          </div>
          <Skeleton className="h-9 w-36" />
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
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-destructive text-sm">
            Failed to load campaigns: {error.message}
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
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {campaigns?.length ?? 0}{' '}
            {(campaigns?.length ?? 0) === 1 ? 'campaign' : 'campaigns'}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 size-4" />
          Create Campaign
        </Button>
      </div>

      {/* Data table or empty state */}
      {campaigns && campaigns.length > 0 ? (
        <CampaignDataTable columns={columns} data={campaigns} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-lg font-medium text-muted-foreground">
            No campaigns yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first campaign to organize your creatives.
          </p>
          <Button className="mt-4" onClick={handleCreate}>
            Create your first campaign
          </Button>
        </div>
      )}

      {/* Create/Edit dialog */}
      <CampaignFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        campaign={editingCampaign}
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
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this campaign? This action cannot
              be undone. All active creatives in this campaign will be paused and
              their ads will stop serving.
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
