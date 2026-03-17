import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchCampaignsWithCreativeCount,
  fetchCampaignsForTable,
  fetchCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  fetchCreativesByCampaign,
  fetchUnassignedCreatives,
  assignCreativeToCampaign,
  removeCreativeFromCampaign,
  updateCreativeStatus,
  duplicateCreative,
} from '../api/campaigns-api'
import type { Insertable, Updatable, Enums } from '@scrolltoday/shared'

export function useCampaigns(advertiserId?: string) {
  return useQuery({
    queryKey: ['campaigns', advertiserId ?? null],
    queryFn: () => fetchCampaignsWithCreativeCount(advertiserId),
  })
}

export function useCampaignsForTable(advertiserId?: string) {
  return useQuery({
    queryKey: ['campaigns', 'table', advertiserId ?? null],
    queryFn: () => fetchCampaignsForTable(advertiserId),
  })
}

export function useCampaign(id: string | undefined) {
  return useQuery({
    queryKey: ['campaigns', id],
    queryFn: () => fetchCampaignById(id!),
    enabled: !!id,
  })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (campaign: Insertable<'campaigns'>) =>
      createCampaign(campaign),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: Updatable<'campaigns'>
    }) => updateCampaign(id, updates),
    onSuccess: async (_data, { id }) => {
      await queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      await queryClient.invalidateQueries({ queryKey: ['campaigns', id] })
    },
  })
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCampaign(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}

// ---------------------------------------------------------------------------
// Creative Assignment Hooks
// ---------------------------------------------------------------------------

export function useCampaignCreatives(campaignId: string | undefined) {
  return useQuery({
    queryKey: ['campaign-creatives', campaignId],
    queryFn: () => fetchCreativesByCampaign(campaignId!),
    enabled: !!campaignId,
  })
}

export function useUnassignedCreatives() {
  return useQuery({
    queryKey: ['unassigned-creatives'],
    queryFn: fetchUnassignedCreatives,
  })
}

export function useAssignCreative() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      creativeId,
      campaignId,
    }: {
      creativeId: string
      campaignId: string
    }) => assignCreativeToCampaign(creativeId, campaignId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaign-creatives'] })
      void queryClient.invalidateQueries({ queryKey: ['unassigned-creatives'] })
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      void queryClient.invalidateQueries({ queryKey: ['creatives'] })
    },
  })
}

export function useRemoveCreative() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (creativeId: string) =>
      removeCreativeFromCampaign(creativeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaign-creatives'] })
      void queryClient.invalidateQueries({ queryKey: ['unassigned-creatives'] })
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      void queryClient.invalidateQueries({ queryKey: ['creatives'] })
    },
  })
}

export function useUpdateCreativeStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      creativeId,
      newStatus,
    }: {
      creativeId: string
      newStatus: Enums<'creative_status'>
    }) => updateCreativeStatus(creativeId, newStatus),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaign-creatives'] })
      void queryClient.invalidateQueries({ queryKey: ['creatives'] })
    },
  })
}

export function useDuplicateCreative() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sourceId: string) => duplicateCreative(sourceId),
    onSuccess: () => {
      // Invalidate all 3 cache keys: campaign-creatives (current list), campaigns (counts), creatives (global list)
      void queryClient.invalidateQueries({ queryKey: ['campaign-creatives'] })
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      void queryClient.invalidateQueries({ queryKey: ['creatives'] })
    },
  })
}
