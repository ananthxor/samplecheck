import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchCreatives,
  fetchCreativeById,
  createCreative,
  updateCreative,
  deleteCreative,
} from '../api/creatives-api'
import type { Insertable, Updatable } from '@scrolltoday/shared'

export function useCreatives(advertiserId?: string) {
  return useQuery({
    queryKey: ['creatives', advertiserId ?? null],
    queryFn: () => fetchCreatives(advertiserId),
  })
}

export function useCreative(id: string | undefined) {
  return useQuery({
    queryKey: ['creatives', id],
    queryFn: () => fetchCreativeById(id!),
    enabled: !!id,
  })
}

export function useCreateCreative() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (creative: Insertable<'creatives'>) =>
      createCreative(creative),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['creatives'] })
    },
  })
}

export function useUpdateCreative() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: Updatable<'creatives'>
    }) => updateCreative(id, updates),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['creatives'] })
      void queryClient.invalidateQueries({ queryKey: ['creatives', id] })
    },
  })
}

export function useDeleteCreative() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCreative(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['creatives'] })
    },
  })
}
