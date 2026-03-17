import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/auth-context'
import {
  useTrackerConfigs,
  useCreateTrackerConfig,
  useDeleteTrackerConfig,
  useCreativeTrackers,
  useAssignTracker,
  useRemoveTracker,
} from '../hooks/use-trackers'
import {
  trackerConfigSchema,
  type TrackerConfigFormData,
  TRACKER_TYPE_LABELS,
  FIRE_CONDITIONS,
  FIRE_CONDITION_LABELS,
} from '../lib/tracker-types'

// ---------------------------------------------------------------------------
// Tracker Library (advertiser-level)
// ---------------------------------------------------------------------------

export function TrackerConfigSection() {
  const { profile } = useAuth()
  const { data: configs, isLoading } = useTrackerConfigs()
  const createMutation = useCreateTrackerConfig()
  const deleteMutation = useDeleteTrackerConfig()
  const [showForm, setShowForm] = useState(false)

  const form = useForm<TrackerConfigFormData>({
    resolver: zodResolver(trackerConfigSchema),
    defaultValues: {
      name: '',
      tracker_url: '',
      tracker_type: 'pixel',
    },
  })

  function onSubmit(values: TrackerConfigFormData) {
    if (!profile?.advertiser_id) {
      toast.error('No advertiser account found')
      return
    }
    createMutation.mutate(
      {
        name: values.name,
        tracker_url: values.tracker_url,
        tracker_type: values.tracker_type,
        advertiser_id: profile.advertiser_id,
      },
      {
        onSuccess: () => {
          toast.success('Tracker config created')
          form.reset()
          setShowForm(false)
        },
        onError: (err) => {
          toast.error(`Failed to create tracker: ${err.message}`)
        },
      }
    )
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success('Tracker config deleted'),
      onError: (err) => toast.error(`Failed to delete: ${err.message}`),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Tracker Configurations</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(true)}
        >
          <Plus className="mr-1 size-3" />
          Add Tracker
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      ) : !configs || configs.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No tracker configurations yet. Add one to start tracking ad events.
        </p>
      ) : (
        <div className="space-y-2">
          {configs.map((config) => (
            <div
              key={config.id}
              className="flex items-center gap-3 rounded-md border px-3 py-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{config.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {config.tracker_url}
                </p>
              </div>
              <Badge variant="outline" className="shrink-0 text-[10px]">
                {TRACKER_TYPE_LABELS[config.tracker_type as keyof typeof TRACKER_TYPE_LABELS] ?? config.tracker_type}
              </Badge>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Tracker Config</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove "{config.name}" and unlink it from all
                      creatives. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => handleDelete(config.id)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      )}

      {/* Add Tracker Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Tracker Configuration</DialogTitle>
            <DialogDescription>
              Create a new tracker to assign to creatives.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. DoubleVerify Viewability" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tracker_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tracker URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://tracker.example.com/pixel?cb=%%CACHEBUSTER%%"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tracker_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pixel">
                          {TRACKER_TYPE_LABELS.pixel}
                        </SelectItem>
                        <SelectItem value="script">
                          {TRACKER_TYPE_LABELS.script}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Tracker'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Creative Tracker Assignments (per-creative)
// ---------------------------------------------------------------------------

interface CreativeTrackersProps {
  creativeId: string
}

export function CreativeTrackers({ creativeId }: CreativeTrackersProps) {
  const { data: trackers, isLoading } = useCreativeTrackers(creativeId)
  const { data: configs } = useTrackerConfigs()
  const assignMutation = useAssignTracker()
  const removeMutation = useRemoveTracker()
  const [showAssign, setShowAssign] = useState(false)
  const [selectedConfig, setSelectedConfig] = useState('')
  const [selectedCondition, setSelectedCondition] = useState('')

  function handleAssign() {
    if (!selectedConfig || !selectedCondition) return
    assignMutation.mutate(
      {
        creativeId,
        trackerConfigId: selectedConfig,
        fireCondition: selectedCondition,
      },
      {
        onSuccess: () => {
          toast.success('Tracker assigned')
          setShowAssign(false)
          setSelectedConfig('')
          setSelectedCondition('')
        },
        onError: (err) => {
          toast.error(`Failed to assign tracker: ${err.message}`)
        },
      }
    )
  }

  function handleRemove(id: string) {
    removeMutation.mutate(id, {
      onSuccess: () => toast.success('Tracker removed'),
      onError: (err) => toast.error(`Failed to remove: ${err.message}`),
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-2">
        <Loader2 className="size-3 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Trackers
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={() => setShowAssign(true)}
          disabled={!configs || configs.length === 0}
        >
          <Plus className="mr-1 size-3" />
          Assign
        </Button>
      </div>

      {trackers && trackers.length > 0 ? (
        <div className="space-y-1">
          {trackers.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2 rounded border px-2 py-1.5 text-xs"
            >
              <span className="flex-1 truncate font-medium">
                {t.tracker_configs.name}
              </span>
              <Badge variant="secondary" className="text-[9px] shrink-0">
                {FIRE_CONDITION_LABELS[t.fire_condition as keyof typeof FIRE_CONDITION_LABELS] ?? t.fire_condition}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="size-5 text-destructive hover:text-destructive"
                onClick={() => handleRemove(t.id)}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">No trackers assigned</p>
      )}

      {/* Assign Tracker Dialog */}
      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Tracker</DialogTitle>
            <DialogDescription>
              Select a tracker and fire condition.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tracker</label>
              <Select value={selectedConfig} onValueChange={setSelectedConfig}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tracker" />
                </SelectTrigger>
                <SelectContent>
                  {configs?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fire Condition</label>
              <Select
                value={selectedCondition}
                onValueChange={setSelectedCondition}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {FIRE_CONDITIONS.map((fc) => (
                    <SelectItem key={fc} value={fc}>
                      {FIRE_CONDITION_LABELS[fc]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAssign(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={
                !selectedConfig ||
                !selectedCondition ||
                assignMutation.isPending
              }
            >
              {assignMutation.isPending ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
