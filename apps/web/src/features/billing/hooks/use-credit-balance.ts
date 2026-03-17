import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import { fetchCreditBalance } from '../api/billing-api'

/**
 * TanStack Query hook for fetching credit balance with 30-second polling.
 * Automatically enabled when the user has an advertiser_id.
 */
export function useCreditBalance() {
  const { profile, effectiveAdvertiserId } = useAuth()

  // Use the selected org when available, fall back to user's home org
  const advertiserId = effectiveAdvertiserId ?? profile?.advertiser_id

  return useQuery({
    queryKey: ['credit-balance', advertiserId],
    queryFn: () => fetchCreditBalance(advertiserId!),
    enabled: !!advertiserId,
    refetchInterval: 30_000,
    staleTime: 10_000,
  })
}
