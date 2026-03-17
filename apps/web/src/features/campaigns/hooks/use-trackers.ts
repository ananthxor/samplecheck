import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchTrackerConfigs,
  createTrackerConfig,
  updateTrackerConfig,
  deleteTrackerConfig,
  fetchCreativeTrackers,
  assignTrackerToCreative,
  removeTrackerFromCreative,
} from '../api/trackers-api'
import type { Insertable, Updatable } from '@scrolltoday/shared'

// ---------------------------------------------------------------------------
// Tracker Config Hooks
// ---------------------------------------------------------------------------

export function useTrackerConfigs() {
  return useQuery({
    queryKey: ['tracker-configs'],
    queryFn: fetchTrackerConfigs,
  })
}

export function useCreateTrackerConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (config: Insertable<'tracker_configs'>) =>
      createTrackerConfig(config),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tracker-configs'] })
    },
  })
}

export function useUpdateTrackerConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: Updatable<'tracker_configs'>
    }) => updateTrackerConfig(id, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tracker-configs'] })
    },
  })
}

export function useDeleteTrackerConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTrackerConfig(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tracker-configs'] })
    },
  })
}

// ---------------------------------------------------------------------------
// Creative Tracker Hooks
// ---------------------------------------------------------------------------

export function useCreativeTrackers(creativeId: string | undefined) {
  return useQuery({
    queryKey: ['creative-trackers', creativeId],
    queryFn: () => fetchCreativeTrackers(creativeId!),
    enabled: !!creativeId,
  })
}

export function useAssignTracker() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      creativeId,
      trackerConfigId,
      fireCondition,
    }: {
      creativeId: string
      trackerConfigId: string
      fireCondition: string
    }) => assignTrackerToCreative(creativeId, trackerConfigId, fireCondition),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['creative-trackers'] })
    },
  })
}

export function useRemoveTracker() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => removeTrackerFromCreative(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['creative-trackers'] })
    },
  })
}
