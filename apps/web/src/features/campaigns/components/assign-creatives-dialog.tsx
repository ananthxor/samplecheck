import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  useUnassignedCreatives,
  useAssignCreative,
} from '../hooks/use-campaigns'

const STATUS_VARIANT: Record<
  string,
  'secondary' | 'default' | 'outline' | 'destructive'
> = {
  draft: 'secondary',
  active: 'default',
  paused: 'outline',
  archived: 'destructive',
}

interface AssignCreativesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
}

export function AssignCreativesDialog({
  open,
  onOpenChange,
  campaignId,
}: AssignCreativesDialogProps) {
  const { data: creatives, isLoading } = useUnassignedCreatives()
  const assignMutation = useAssignCreative()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isAssigning, setIsAssigning] = useState(false)

  function toggleSelection(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function handleAssign() {
    if (selected.size === 0) return
    setIsAssigning(true)

    try {
      const ids = Array.from(selected)
      for (const creativeId of ids) {
        await assignMutation.mutateAsync({ creativeId, campaignId })
      }
      toast.success(`${ids.length} creative${ids.length > 1 ? 's' : ''} assigned`)
      setSelected(new Set())
      onOpenChange(false)
    } catch (err) {
      toast.error(
        `Failed to assign creatives: ${err instanceof Error ? err.message : 'Unknown error'}`
      )
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!isAssigning) {
          setSelected(new Set())
          onOpenChange(val)
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Creatives</DialogTitle>
          <DialogDescription>
            Select creatives to assign to this campaign.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : !creatives || creatives.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              All creatives are already assigned to campaigns.
            </p>
          ) : (
            creatives.map((creative) => (
              <label
                key={creative.id}
                className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/50 cursor-pointer"
              >
                <Checkbox
                  checked={selected.has(creative.id)}
                  onCheckedChange={() => toggleSelection(creative.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">
                    {creative.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {creative.format_name}
                    {creative.width && creative.height && (
                      <span>
                        {' '}
                        &middot; {creative.width}&times;{creative.height}
                      </span>
                    )}
                  </p>
                </div>
                <Badge
                  variant={STATUS_VARIANT[creative.status] ?? 'secondary'}
                  className="shrink-0 text-[10px] capitalize"
                >
                  {creative.status}
                </Badge>
              </label>
            ))
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelected(new Set())
              onOpenChange(false)
            }}
            disabled={isAssigning}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={selected.size === 0 || isAssigning}
          >
            {isAssigning ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Assigning...
              </>
            ) : (
              `Assign Selected (${selected.size})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
