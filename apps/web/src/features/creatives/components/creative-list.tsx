import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { Tables } from '@scrolltoday/shared'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/auth-context'
import { useCreatives, useDeleteCreative } from '../hooks/use-creatives'
import { CreativeCard } from './creative-card'
import { ShareDialog } from './share-dialog'

export function CreativeList() {
  const navigate = useNavigate()
  const { isAdmin, effectiveAdvertiserId } = useAuth()
  const [shareCreative, setShareCreative] = useState<Tables<'creatives'> | null>(null)

  const { data: creatives, isLoading, error, refetch } = useCreatives(effectiveAdvertiserId ?? undefined)
  const deleteMutation = useDeleteCreative()

  function handleEdit(id: string) {
    navigate(`/creatives/${id}/edit`)
  }

  function handleShare(creative: Tables<'creatives'>) {
    setShareCreative(creative)
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success('Creative deleted successfully')
      },
      onError: (err) => {
        toast.error(`Failed to delete creative: ${err.message}`)
      },
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="mt-1 h-4 w-24" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Creatives</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-destructive text-sm">
            Failed to load creatives: {error.message}
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
          <h1 className="text-2xl font-bold tracking-tight">
            {isAdmin ? 'All Creatives' : 'My Creatives'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {creatives?.length ?? 0}{' '}
            {(creatives?.length ?? 0) === 1 ? 'creative' : 'creatives'}
          </p>
        </div>
        <Button onClick={() => navigate('/creatives/new')}>
          <Plus className="mr-2 size-4" />
          Create New
        </Button>
      </div>

      {/* Grid or empty state */}
      {creatives && creatives.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {creatives.map((creative) => (
            <CreativeCard
              key={creative.id}
              creative={creative}
              onEdit={handleEdit}
              onShare={handleShare}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-lg font-medium text-muted-foreground">
            No creatives yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Start by browsing templates and creating your first creative.
          </p>
          <Button
            className="mt-4"
            onClick={() => navigate('/creatives/new')}
          >
            Browse Templates
          </Button>
        </div>
      )}

      {/* Share dialog */}
      {shareCreative && (
        <ShareDialog
          open={!!shareCreative}
          onOpenChange={(open) => {
            if (!open) setShareCreative(null)
          }}
          creative={shareCreative}
        />
      )}
    </div>
  )
}
