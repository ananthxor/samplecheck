import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { fetchTransactions, createCheckoutSession } from '../api/billing-api'

/**
 * TanStack Query hook for fetching credit transaction history.
 */
export function useTransactions() {
  const { profile, effectiveAdvertiserId } = useAuth()

  // Use the selected org when available, fall back to user's home org
  const advertiserId = effectiveAdvertiserId ?? profile?.advertiser_id

  return useQuery({
    queryKey: ['transactions', advertiserId],
    queryFn: () => fetchTransactions(advertiserId!),
    enabled: !!advertiserId,
  })
}

/**
 * Mutation hook for creating a Stripe Checkout Session.
 * On success, redirects to the Stripe-hosted checkout page.
 */
export function useCreateCheckout() {
  return useMutation({
    mutationFn: (packId: string) => createCheckoutSession(packId),
    onSuccess: (data) => {
      window.location.href = data.url
    },
    onError: () => {
      toast.error('Failed to start checkout. Please try again.')
    },
  })
}
