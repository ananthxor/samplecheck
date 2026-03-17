import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import {
  fetchSavedReports,
  createSavedReport,
  deleteSavedReport,
} from '../api/reports-api'
import type { CreateReportPayload } from '../lib/report-types'

export function useSavedReports() {
  const { profile } = useAuth()
  return useQuery({
    queryKey: ['saved-reports', profile?.advertiser_id],
    queryFn: () => fetchSavedReports(profile!.advertiser_id!),
    enabled: !!profile?.advertiser_id,
    staleTime: 30 * 1000,
  })
}

export function useCreateReport() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  return useMutation({
    mutationFn: (payload: Omit<CreateReportPayload, 'advertiser_id'>) =>
      createSavedReport({ ...payload, advertiser_id: profile!.advertiser_id! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-reports', profile?.advertiser_id] })
      toast.success('Report saved')
    },
    onError: (err: Error) => toast.error(`Failed to save report: ${err.message}`),
  })
}

export function useDeleteReport() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  return useMutation({
    mutationFn: deleteSavedReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-reports', profile?.advertiser_id] })
      toast.success('Report deleted')
    },
    onError: (err: Error) => toast.error(`Failed to delete: ${err.message}`),
  })
}
