import { toast } from 'sonner'
import { Play, Pause, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from './status-badge'
import { getAvailableCreativeTransitions } from '../lib/status-machine'
import { useUpdateCreativeStatus } from '../hooks/use-campaigns'
import type { Tables, Enums } from '@scrolltoday/shared'

const STATUS_ICON: Record<string, typeof Play> = {
  active: Play,
  paused: Pause,
  archived: Archive,
}

interface CreativeStatusActionsProps {
  creative: Tables<'creatives'>
  onStatusChange?: () => void
}

export function CreativeStatusActions({
  creative,
  onStatusChange,
}: CreativeStatusActionsProps) {
  const updateStatus = useUpdateCreativeStatus()
  const transitions = getAvailableCreativeTransitions(creative.status)

  if (transitions.length === 0) {
    return <StatusBadge status={creative.status} />
  }

  function handleTransition(newStatus: Enums<'creative_status'>) {
    updateStatus.mutate(
      { creativeId: creative.id, newStatus },
      {
        onSuccess: () => {
          toast.success(`Creative status changed to ${newStatus}`)
          onStatusChange?.()
        },
        onError: (err) => {
          toast.error(`Status update failed: ${err.message}`)
        },
      }
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto p-0">
          <StatusBadge status={creative.status} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {transitions.map((status) => {
          const Icon = STATUS_ICON[status]
          return (
            <DropdownMenuItem
              key={status}
              onClick={() => handleTransition(status)}
              disabled={updateStatus.isPending}
            >
              {Icon && <Icon className="mr-2 size-4" />}
              <span className="capitalize">{status}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
