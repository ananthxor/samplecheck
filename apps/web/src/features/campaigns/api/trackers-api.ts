import { supabase } from '@/lib/supabase'
import type { Tables, Insertable, Updatable } from '@scrolltoday/shared'

// ---------------------------------------------------------------------------
// Tracker Configs CRUD API
// ---------------------------------------------------------------------------

export async function fetchTrackerConfigs(): Promise<
  Tables<'tracker_configs'>[]
> {
  const { data, error } = await supabase
    .from('tracker_configs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function createTrackerConfig(
  config: Insertable<'tracker_configs'>
): Promise<Tables<'tracker_configs'>> {
  const { data, error } = await supabase
    .from('tracker_configs')
    .insert(config)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateTrackerConfig(
  id: string,
  updates: Updatable<'tracker_configs'>
): Promise<Tables<'tracker_configs'>> {
  const { data, error } = await supabase
    .from('tracker_configs')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteTrackerConfig(id: string): Promise<void> {
  const { error } = await supabase
    .from('tracker_configs')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------------------------
// Creative Trackers CRUD API
// ---------------------------------------------------------------------------

export type CreativeTrackerWithConfig = Tables<'creative_trackers'> & {
  tracker_configs: Tables<'tracker_configs'>
}

export async function fetchCreativeTrackers(
  creativeId: string
): Promise<CreativeTrackerWithConfig[]> {
  const { data, error } = await supabase
    .from('creative_trackers')
    .select('*, tracker_configs(*)')
    .eq('creative_id', creativeId)

  if (error) throw new Error(error.message)
  return data as CreativeTrackerWithConfig[]
}

export async function assignTrackerToCreative(
  creativeId: string,
  trackerConfigId: string,
  fireCondition: string
): Promise<Tables<'creative_trackers'>> {
  const { data, error } = await supabase
    .from('creative_trackers')
    .insert({
      creative_id: creativeId,
      tracker_config_id: trackerConfigId,
      fire_condition: fireCondition,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function removeTrackerFromCreative(id: string): Promise<void> {
  const { error } = await supabase
    .from('creative_trackers')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}
