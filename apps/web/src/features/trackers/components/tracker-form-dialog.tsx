import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { useAuth } from '@/contexts/auth-context'
import {
  useCreateTrackerConfig,
  useUpdateTrackerConfig,
} from '@/features/campaigns/hooks/use-trackers'
import {
  trackerConfigSchema,
  type TrackerConfigFormData,
  TRACKER_TYPES,
  TRACKER_TYPE_LABELS,
  TRACKER_CATEGORIES,
  TRACKER_CATEGORY_LABELS,
} from '@/features/campaigns/lib/tracker-types'
import type { Tables } from '@scrolltoday/shared'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TrackerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tracker?: Tables<'tracker_configs'> | null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TrackerFormDialog({
  open,
  onOpenChange,
  tracker,
}: TrackerFormDialogProps) {
  const { profile } = useAuth()
  const createMutation = useCreateTrackerConfig()
  const updateMutation = useUpdateTrackerConfig()

  const isEditing = !!tracker
  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<TrackerConfigFormData>({
    resolver: zodResolver(trackerConfigSchema),
    defaultValues: {
      name: '',
      tracker_url: '',
      tracker_type: 'pixel',
      category: 'impression',
    },
  })

  // Reset form when dialog opens or tracker changes
  useEffect(() => {
    if (open) {
      if (tracker) {
        form.reset({
          name: tracker.name,
          tracker_url: tracker.tracker_url,
          tracker_type: tracker.tracker_type as 'pixel' | 'script',
          category: tracker.category as 'conversion' | 'impression' | 'click',
        })
      } else {
        form.reset({
          name: '',
          tracker_url: '',
          tracker_type: 'pixel',
          category: 'impression',
        })
      }
    }
  }, [open, tracker, form])

  function onSubmit(values: TrackerConfigFormData) {
    if (isEditing && tracker) {
      updateMutation.mutate(
        {
          id: tracker.id,
          updates: {
            name: values.name,
            tracker_url: values.tracker_url,
            tracker_type: values.tracker_type,
            category: values.category,
          },
        },
        {
          onSuccess: () => {
            toast.success('Tracker updated')
            onOpenChange(false)
          },
          onError: (err) => {
            toast.error(`Failed to update tracker: ${err.message}`)
          },
        }
      )
    } else {
      if (!profile?.advertiser_id) {
        toast.error('No advertiser account found')
        return
      }
      createMutation.mutate(
        {
          name: values.name,
          tracker_url: values.tracker_url,
          tracker_type: values.tracker_type,
          category: values.category,
          advertiser_id: profile.advertiser_id,
        },
        {
          onSuccess: () => {
            toast.success('Tracker created')
            onOpenChange(false)
          },
          onError: (err) => {
            toast.error(`Failed to create tracker: ${err.message}`)
          },
        }
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Tracker' : 'Create Tracker'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the tracker configuration details.'
              : 'Create a new tracker configuration to assign to creatives.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Google Analytics Conversion"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TRACKER_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {TRACKER_CATEGORY_LABELS[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type */}
            <FormField
              control={form.control}
              name="tracker_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TRACKER_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {TRACKER_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tracker URL */}
            <FormField
              control={form.control}
              name="tracker_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tracker URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://tracking.example.com/pixel?cb=%%CACHEBUSTER%%"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : isEditing ? (
                  'Update Tracker'
                ) : (
                  'Create Tracker'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
