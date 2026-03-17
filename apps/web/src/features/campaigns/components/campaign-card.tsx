import { useNavigate } from 'react-router'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { StatusBadge } from './status-badge'
import type { CampaignWithCreativeCount } from '../api/campaigns-api'

interface CampaignCardProps {
  campaign: CampaignWithCreativeCount
  onEdit: (campaign: CampaignWithCreativeCount) => void
  onDelete: (id: string) => void
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

export function CampaignCard({
  campaign,
  onEdit,
  onDelete,
}: CampaignCardProps) {
  const navigate = useNavigate()

  return (
    <Card className="overflow-hidden py-0 gap-0">
      {/* Header with name + status */}
      <CardHeader className="px-4 py-3 gap-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="truncate text-sm">{campaign.name}</CardTitle>
          <StatusBadge status={campaign.status} />
        </div>
      </CardHeader>

      {/* Content: creative count + last updated */}
      <CardContent className="px-4 pb-0 pt-0">
        <p className="text-xs text-muted-foreground">
          {campaign.creative_count}{' '}
          {campaign.creative_count === 1 ? 'creative' : 'creatives'}
          <span> &middot; Updated {formatRelativeTime(campaign.updated_at)}</span>
        </p>
      </CardContent>

      {/* Actions */}
      <CardFooter className="justify-end gap-1 px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => navigate(`/campaigns/${campaign.id}`)}
        >
          <ChevronRight className="size-4" />
          <span className="sr-only">View details</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => onEdit(campaign)}
        >
          <Pencil className="size-4" />
          <span className="sr-only">Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(campaign.id)}
        >
          <Trash2 className="size-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </CardFooter>
    </Card>
  )
}
