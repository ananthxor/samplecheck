import type { Tables } from '@scrolltoday/shared'
import { Share2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreativeActions } from './creative-actions'

interface CreativeCardProps {
  creative: Tables<'creatives'>
  onEdit: (id: string) => void
  onShare: (creative: Tables<'creatives'>) => void
  onDelete: (id: string) => void
}

const STATUS_VARIANT: Record<
  string,
  'secondary' | 'default' | 'outline' | 'destructive'
> = {
  draft: 'secondary',
  active: 'default',
  paused: 'outline',
  archived: 'destructive',
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

export function CreativeCard({
  creative,
  onEdit,
  onShare,
  onDelete,
}: CreativeCardProps) {
  const gradient =
    FORMAT_GRADIENTS[creative.format_id] ?? 'from-gray-400 to-gray-600'

  return (
    <Card
      className="overflow-hidden py-0 gap-0 cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => onEdit(creative.id)}
    >
      {/* Thumbnail area */}
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
          <CardTitle className="truncate text-sm">{creative.name}</CardTitle>
          <Badge
            variant={STATUS_VARIANT[creative.status] ?? 'secondary'}
            className="shrink-0 text-[10px] capitalize"
          >
            {creative.status}
          </Badge>
        </div>
      </CardHeader>

      {/* Subtitle */}
      <CardContent className="px-4 pb-0 pt-0">
        <p className="text-xs text-muted-foreground">
          {creative.format_name}
          {creative.width && creative.height && (
            <span>
              {' '}
              &middot; {creative.width}&times;{creative.height}
            </span>
          )}
          <span> &middot; Updated {formatRelativeTime(creative.updated_at)}</span>
        </p>
      </CardContent>

      {/* Actions */}
      <CardFooter className="justify-between px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onShare(creative)}
        >
          <Share2 className="mr-1 size-3.5" />
          Share
        </Button>
        <CreativeActions
          creativeId={creative.id}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </CardFooter>
    </Card>
  )
}
