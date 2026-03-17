import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { useCreateCampaign, useUpdateCampaign } from '../hooks/use-campaigns'
import type { Tables } from '@scrolltoday/shared'

const campaignFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  advertiser_name: z.string().max(100).optional().or(z.literal('')),
  start_date: z.date().optional().nullable(),
  end_date: z.date().optional().nullable(),
})

type CampaignFormValues = z.infer<typeof campaignFormSchema>

interface CampaignFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign?: Tables<'campaigns'> | null
  /** Called with the newly created campaign (not called on edit) */
  onCreated?: (campaign: Tables<'campaigns'>) => void
}

export function CampaignFormDialog({
  open,
  onOpenChange,
  campaign,
  onCreated,
}: CampaignFormDialogProps) {
  const { activeAdvertiserId } = useAuth()
  const createMutation = useCreateCampaign()
  const updateMutation = useUpdateCampaign()
  const isEditMode = !!campaign

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: campaign?.name ?? '',
      advertiser_name: campaign?.advertiser_name ?? '',
      start_date: campaign?.start_date ? new Date(campaign.start_date) : null,
      end_date: campaign?.end_date ? new Date(campaign.end_date) : null,
    },
  })

  // Reset form when campaign prop changes (edit vs create)
  useEffect(() => {
    if (open) {
      form.reset({
        name: campaign?.name ?? '',
        advertiser_name: campaign?.advertiser_name ?? '',
        start_date: campaign?.start_date
          ? new Date(campaign.start_date)
          : null,
        end_date: campaign?.end_date ? new Date(campaign.end_date) : null,
      })
    }
  }, [open, campaign, form])

  function onSubmit(values: CampaignFormValues) {
    const advertiserName =
      values.advertiser_name && values.advertiser_name.trim() !== ''
        ? values.advertiser_name.trim()
        : null
    const startDate = values.start_date
      ? values.start_date.toISOString().split('T')[0]
      : null
    const endDate = values.end_date
      ? values.end_date.toISOString().split('T')[0]
      : null

    if (isEditMode && campaign) {
      updateMutation.mutate(
        {
          id: campaign.id,
          updates: {
            name: values.name,
            advertiser_name: advertiserName,
            start_date: startDate,
            end_date: endDate,
          },
        },
        {
          onSuccess: () => {
            toast.success('Campaign updated')
            onOpenChange(false)
          },
          onError: (err) => {
            toast.error(`Failed to update campaign: ${err.message}`)
          },
        }
      )
    } else {
      if (!activeAdvertiserId) {
        toast.error('Please select an organization first')
        return
      }
      createMutation.mutate(
        {
          name: values.name,
          advertiser_id: activeAdvertiserId,
          advertiser_name: advertiserName,
          start_date: startDate,
          end_date: endDate,
        },
        {
          onSuccess: (created) => {
            toast.success('Campaign created')
            onCreated?.(created)
            onOpenChange(false)
          },
          onError: (err) => {
            toast.error(`Failed to create campaign: ${err.message}`)
          },
        }
      )
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Campaign' : 'Create Campaign'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update campaign details.'
              : 'Set up your campaign to get started.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Campaign Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Summer Sale 2026"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Advertiser / Brand Name */}
            <FormField
              control={form.control}
              name="advertiser_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Advertiser / Brand Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Nike" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start Date */}
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value
                            ? format(field.value, 'PPP')
                            : 'Pick a date'}
                          <CalendarIcon className="ml-auto size-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ?? undefined}
                        onSelect={(date) => field.onChange(date ?? null)}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* End Date */}
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value
                            ? format(field.value, 'PPP')
                            : 'Pick a date'}
                          <CalendarIcon className="ml-auto size-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ?? undefined}
                        onSelect={(date) => field.onChange(date ?? null)}
                      />
                    </PopoverContent>
                  </Popover>
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
                {isPending
                  ? 'Saving...'
                  : isEditMode
                    ? 'Save Changes'
                    : 'Create Campaign'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
