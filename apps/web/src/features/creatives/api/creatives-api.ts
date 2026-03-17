import { supabase } from '@/lib/supabase'
import type { Tables, Insertable, Updatable } from '@scrolltoday/shared'

// ---------------------------------------------------------------------------
// Creatives CRUD API
// ---------------------------------------------------------------------------

export async function fetchCreatives(advertiserId?: string): Promise<Tables<'creatives'>[]> {
  let query = supabase
    .from('creatives')
    .select('*')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (advertiserId) {
    query = query.eq('advertiser_id', advertiserId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

export async function fetchCreativeById(
  id: string
): Promise<Tables<'creatives'>> {
  const { data, error } = await supabase
    .from('creatives')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function createCreative(
  creative: Insertable<'creatives'>
): Promise<Tables<'creatives'>> {
  const { data, error } = await supabase
    .from('creatives')
    .insert(creative)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateCreative(
  id: string,
  updates: Updatable<'creatives'>
): Promise<Tables<'creatives'>> {
  const { data, error } = await supabase
    .from('creatives')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteCreative(id: string): Promise<void> {
  const { error } = await supabase
    .from('creatives')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------------------------
// Public preview access (uses anon key, no auth required)
// ---------------------------------------------------------------------------

export async function fetchCreativeByToken(
  token: string
): Promise<Tables<'creatives'>> {
  const { data, error } = await supabase
    .from('creatives')
    .select('*')
    .eq('preview_token', token)
    .single()

  if (error) throw new Error(error.message)
  return data
}
