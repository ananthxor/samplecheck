import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Plus,
  Tag,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  CheckCircle2,
  Files,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  useCampaign,
  useCampaignCreatives,
  useRemoveCreative,
  useUpdateCampaign,
  useDuplicateCreative,
} from '../hooks/use-campaigns'
import { StatusBadge } from '../components/status-badge'
import { CreativeStatusActions } from '../components/creative-status-actions'
import { AssignCreativesDialog } from '../components/assign-creatives-dialog'
import { TagExportDialog } from '../components/tag-export-dialog'
import { CampaignAnalyticsTab } from '../components/campaign-analytics-tab'
import { CampaignPlacementsTab } from '../components/campaign-placements-tab'
import {
  TrackerConfigSection,
  CreativeTrackers,
} from '../components/tracker-config-section'
import {
  getAvailableCampaignTransitions,
} from '../lib/status-machine'
import type { Tables, Enums } from '@scrolltoday/shared'
import type { DateRangePreset } from '@/features/analytics/lib/analytics-types'

const CAMPAIGN_STATUS_ICON: Record<string, typeof Play> = {
  active: Play,
  paused: Pause,
  completed: CheckCircle2,
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date

  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`

  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

/** Gradient placeholder colors per format family */
const FORMAT_GRADIENTS: Record<string, string> = {
  'static-banner': 'from-blue-400 to-blue-600',
  'multi-frame': 'from-purple-400 to-purple-600',
  'in-feed': 'from-emerald-400 to-emerald-600',
  carousel: 'from-pink-400 to-pink-600',
  cube: 'from-orange-400 to-orange-600',
  scratch: 'from-amber-400 to-amber-600',
  flipcard: 'from-cyan-400 to-cyan-600',
  quiz: 'from-rose-400 to-rose-600',
  slider: 'from-teal-400 to-teal-600',
  accordion: 'from-indigo-400 to-indigo-600',
  'animated-banner': 'from-fuchsia-400 to-fuchsia-600',
  countdown: 'from-red-400 to-red-600',
  'video-endcard': 'from-violet-400 to-violet-600',
  'click-to-play': 'from-sky-400 to-sky-600',
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: campaign, isLoading, error } = useCampaign(id)
  const {
    data: creatives,
    isLoading: creativesLoading,
  } = useCampaignCreatives(id)
  const removeMutation = useRemoveCreative()
  const updateCampaign = useUpdateCampaign()
  const duplicateMutation = useDuplicateCreative()

  const [assignOpen, setAssignOpen] = useState(false)
  const [tagCreative, setTagCreative] = useState<Tables<'creatives'> | null>(
    null
  )
  const [expandedTrackers, setExpandedTrackers] = useState<Set<string>>(
    new Set()
  )
  const [datePreset, setDatePreset] = useState<DateRangePreset>('30d')

  function toggleTrackers(creativeId: string) {
    setExpandedTrackers((prev) => {
      const next = new Set(prev)
      if (next.has(creativeId)) {
        next.delete(creativeId)
      } else {
        next.add(creativeId)
      }
      return next
    })
  }

  function handleRemoveCreative(creativeId: string) {
    removeMutation.mutate(creativeId, {
      onSuccess: () => toast.success('Creative removed from campaign'),
      onError: (err) => toast.error(`Failed to remove: ${err.message}`),
    })
  }

  function handleDuplicate(creativeId: string, creativeName: string) {
    duplicateMutation.mutate(creativeId, {
      onSuccess: () => toast.success(`Duplicated "${creativeName}"`),
      onError: (err) => toast.error(`Failed to duplicate: ${err.message}`),
    })
  }

  function handleCampaignStatusChange(newStatus: Enums<'campaign_status'>) {
    if (!campaign) return
    updateCampaign.mutate(
      { id: campaign.id, updates: { status: newStatus } },
      {
        onSuccess: () =>
          toast.success(`Campaign status changed to ${newStatus}`),
        onError: (err) =>
          toast.error(`Status update failed: ${err.message}`),
      }
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-40" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error || !campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-semibold">Campaign Not Found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {error?.message ?? 'The campaign you are looking for does not exist.'}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate('/campaigns')}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Campaigns
        </Button>
      </div>
    )
  }

  const campaignTransitions = getAvailableCampaignTransitions(campaign.status)

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => navigate('/campaigns')}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <h1 className="text-2xl font-bold">{campaign.name}</h1>

            {/* Campaign status with transition dropdown */}
            {campaignTransitions.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-auto p-0">
                    <StatusBadge status={campaign.status} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {campaignTransitions.map((status) => {
                    const Icon = CAMPAIGN_STATUS_ICON[status]
                    return (
                      <DropdownMenuItem
                        key={status}
                        onClick={() => handleCampaignStatusChange(status)}
                        disabled={updateCampaign.isPending}
                      >
                        {Icon && <Icon className="mr-2 size-4" />}
                        <span className="capitalize">{status}</span>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <StatusBadge status={campaign.status} />
            )}
          </div>
          <p className="ml-10 text-sm text-muted-foreground">
            Created {formatRelativeTime(campaign.created_at)}
          </p>
        </div>
      </div>

      {/* Tabbed content */}
      <Tabs defaultValue="creatives" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="creatives">Creatives</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="placements">Placements</TabsTrigger>
        </TabsList>

        {/* Creatives Tab */}
        <TabsContent value="creatives" className="space-y-6">
          {/* Actions bar */}
          <div className="flex items-center gap-3">
            <Button onClick={() => setAssignOpen(true)}>
              <Plus className="mr-2 size-4" />
              Assign Creatives
            </Button>
            <span className="text-sm text-muted-foreground">
              {creatives?.length ?? 0}{' '}
              {(creatives?.length ?? 0) === 1 ? 'creative' : 'creatives'} assigned
            </span>
          </div>

          {/* Assigned Creatives Grid */}
          {creativesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-52" />
              ))}
            </div>
          ) : !creatives || creatives.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
              <p className="text-sm text-muted-foreground">
                No creatives assigned yet.
              </p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => setAssignOpen(true)}
              >
                <Plus className="mr-2 size-4" />
                Assign Creatives
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {creatives.map((creative) => {
                const gradient =
                  FORMAT_GRADIENTS[creative.format_id] ??
                  'from-gray-400 to-gray-600'
                const canExportTag =
                  creative.status === 'active' || creative.status === 'paused'
                const isTrackersExpanded = expandedTrackers.has(creative.id)

                return (
                  <Card key={creative.id} className="overflow-hidden py-0 gap-0">
                    {/* Thumbnail */}
                    {creative.thumbnail_url ? (
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={creative.thumbnail_url}
                          alt={creative.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className={`flex aspect-video w-full items-center justify-center bg-gradient-to-br ${gradient}`}
                      >
                        <span className="text-sm font-medium text-white/90">
                          {creative.format_name}
                        </span>
                      </div>
                    )}

                    {/* Title + status */}
                    <CardHeader className="px-4 py-3 gap-1">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="truncate text-sm">
                          {creative.name}
                        </CardTitle>
                        <CreativeStatusActions creative={creative} />
                      </div>
                    </CardHeader>

                    {/* Subtitle */}
                    <CardContent className="px-4 pb-0 pt-0 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {creative.format_name}
                        {creative.width && creative.height && (
                          <span>
                            {' '}
                            &middot; {creative.width}&times;{creative.height}
                          </span>
                        )}
                        <span>
                          {' '}
                          &middot; Updated{' '}
                          {formatRelativeTime(creative.updated_at)}
                        </span>
                      </p>

                      {/* Expandable tracker section */}
                      <button
                        type="button"
                        onClick={() => toggleTrackers(creative.id)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isTrackersExpanded ? (
                          <ChevronUp className="size-3" />
                        ) : (
                          <ChevronDown className="size-3" />
                        )}
                        Trackers
                      </button>
                      {isTrackersExpanded && (
                        <div className="pt-1">
                          <CreativeTrackers creativeId={creative.id} />
                        </div>
                      )}
                    </CardContent>

                    {/* Actions */}
                    <CardFooter className="justify-end gap-1 px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={duplicateMutation.isPending}
                        onClick={() => handleDuplicate(creative.id, creative.name)}
                      >
                        <Files className="mr-1 size-3" />
                        Duplicate
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={!canExportTag}
                        onClick={() => setTagCreative(creative)}
                      >
                        <Tag className="mr-1 size-3" />
                        Get Tag
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        asChild
                      >
                        <Link to={`/creatives/${creative.id}/edit`}>
                          <Pencil className="size-3.5" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Remove from Campaign
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Remove "{creative.name}" from this campaign? The
                              creative will still exist and can be reassigned later.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() =>
                                handleRemoveCreative(creative.id)
                              }
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Tracker Configuration Section */}
          <div className="rounded-lg border p-4">
            <TrackerConfigSection />
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <CampaignAnalyticsTab
            campaignId={id!}
            datePreset={datePreset}
            onDatePresetChange={setDatePreset}
          />
        </TabsContent>

        {/* Placements Tab */}
        <TabsContent value="placements">
          <CampaignPlacementsTab
            campaignId={id!}
            creatives={creatives ?? []}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AssignCreativesDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        campaignId={id!}
      />

      {tagCreative && (
        <TagExportDialog
          open={!!tagCreative}
          onOpenChange={(open) => {
            if (!open) setTagCreative(null)
          }}
          creative={tagCreative}
        />
      )}
    </div>
  )
}
