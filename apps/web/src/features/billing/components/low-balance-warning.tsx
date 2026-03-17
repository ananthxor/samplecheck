import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useCreditBalance } from '../hooks/use-credit-balance'
import { useTransactions } from '../hooks/use-billing'

/**
 * Invisible component that detects low credit balance and shows a persistent
 * warning toast. Renders nothing visually -- only manages the toast side-effect.
 *
 * Threshold: 10% of the most recent purchase transaction amount.
 * Uses sonner's `id` option to deduplicate (only one warning at a time).
 */
export function LowBalanceWarning() {
  const { data: balance } = useCreditBalance()
  const { data: transactions } = useTransactions()
  const lastWarningBalance = useRef<number | null>(null)

  useEffect(() => {
    if (balance === undefined || !transactions) return

    // Find the most recent purchase transaction
    const lastPurchase = transactions.find((t) => t.type === 'purchase')
    if (!lastPurchase) return // User hasn't bought credits yet

    const threshold = Math.floor(lastPurchase.amount * 0.1)

    if (balance > 0 && balance <= threshold) {
      // Only show toast if balance changed since last warning
      if (lastWarningBalance.current !== balance) {
        lastWarningBalance.current = balance
        toast.warning(
          `Low credit balance! ${balance.toLocaleString()} impressions remaining. Purchase more credits to keep your ads running.`,
          { id: 'low-balance', duration: Infinity }
        )
      }
    } else {
      // Balance is above threshold or 0 -- dismiss any existing warning
      if (lastWarningBalance.current !== null) {
        lastWarningBalance.current = null
        toast.dismiss('low-balance')
      }
    }
  }, [balance, transactions])

  return null
}
