import { Link } from 'react-router'
import { Coins } from 'lucide-react'
import { useCreditBalance } from '../hooks/use-credit-balance'

/**
 * Compact credit balance display for the app header.
 * Shows a formatted number with a coins icon.
 * Links to the /billing page on click.
 */
export function CreditBalanceBadge() {
  const { data: balance, isLoading } = useCreditBalance()

  return (
    <Link
      to="/billing"
      className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
    >
      <Coins className="size-4 text-muted-foreground" />
      {isLoading ? (
        <span className="inline-block h-4 w-12 animate-pulse rounded bg-muted" />
      ) : balance === 0 ? (
        <span className="text-destructive">0</span>
      ) : (
        <span>{Intl.NumberFormat('en-US').format(balance ?? 0)}</span>
      )}
    </Link>
  )
}
