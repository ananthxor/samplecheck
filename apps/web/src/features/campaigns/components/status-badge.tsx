import { Badge } from '@/components/ui/badge'

const STATUS_VARIANT: Record<
  string,
  'secondary' | 'default' | 'outline' | 'destructive'
> = {
  draft: 'secondary',
  active: 'default',
  paused: 'outline',
  archived: 'destructive',
  completed: 'destructive',
}

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge
      variant={STATUS_VARIANT[status] ?? 'secondary'}
      className="shrink-0 text-[10px] capitalize"
    >
      {status}
    </Badge>
  )
}
