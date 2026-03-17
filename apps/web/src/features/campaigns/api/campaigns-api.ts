import { supabase } from '@/lib/supabase'
import type { Tables, Insertable, Updatable, Enums } from '@scrolltoday/shared'
import { canCreativeTransitionTo } from '../lib/status-machine'

// ---------------------------------------------------------------------------
// Campaigns CRUD API
// ---------------------------------------------------------------------------

export async function fetchCampaigns(advertiserId?: string): Promise<Tables<'campaigns'>[]> {
  let query = supabase
    .from('campaigns')
    .select('*')
    .order('updated_at', { ascending: false })

  if (advertiserId) query = query.eq('advertiser_id', advertiserId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

export async function fetchCampaignById(
  id: string
): Promise<Tables<'campaigns'>> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function createCampaign(
  campaign: Insertable<'campaigns'>
): Promise<Tables<'campaigns'>> {
  const { data, error } = await supabase
    .from('campaigns')
    .insert(campaign)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateCampaign(
  id: string,
  updates: Updatable<'campaigns'>
): Promise<Tables<'campaigns'>> {
  const { data, error } = await supabase
    .from('campaigns')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteCampaign(id: string): Promise<void> {
  // Pause all active creatives linked to this campaign and clear their bundle URLs
  // so CDN tags stop serving immediately (same pattern as credit exhaustion)
  await supabase
    .from('creatives')
    .update({ status: 'paused', bundle_url: null, updated_at: new Date().toISOString() })
    .eq('campaign_id', id)
    .eq('status', 'active')

  const { error } = await supabase.from('campaigns').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------------------------
// Campaign with creative count (used by campaign list)
// ---------------------------------------------------------------------------

export type CampaignWithCreativeCount = Tables<'campaigns'> & {
  creative_count: number
}

export async function fetchCampaignsWithCreativeCount(advertiserId?: string): Promise<
  CampaignWithCreativeCount[]
> {
  let query = supabase
    .from('campaigns')
    .select('*, creatives(count)')
    .order('updated_at', { ascending: false })

  if (advertiserId) query = query.eq('advertiser_id', advertiserId)

  const { data, error } = await query

  if (error) throw new Error(error.message)

  return data.map((campaign) => {
    const { creatives, ...rest } = campaign as Tables<'campaigns'> & {
      creatives: { count: number }[]
    }
    return {
      ...rest,
      creative_count: creatives?.[0]?.count ?? 0,
    }
  })
}

// ---------------------------------------------------------------------------
// Campaign table data (with impressions from daily_metrics)
// ---------------------------------------------------------------------------

export type CampaignTableRow = Tables<'campaigns'> & {
  creative_count: number
  impressions_served: number
}

export async function fetchCampaignsForTable(advertiserId?: string): Promise<CampaignTableRow[]> {
  // Fetch campaigns with creative count
  let query = supabase
    .from('campaigns')
    .select('*, creatives(count)')
    .order('updated_at', { ascending: false })

  if (advertiserId) query = query.eq('advertiser_id', advertiserId)

  const { data: rawCampaigns, error: campError } = await query

  if (campError) throw new Error(campError.message)

  // Fetch real-time impressions from ad_events via fetch_metrics_range
  // (daily_metrics is stale — fetch_metrics_range queries ad_events directly)
  const impressionMap = new Map<string, number>()
  if (advertiserId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: metrics, error: metError } = await (supabase.rpc as any)('fetch_metrics_range', {
      p_advertiser_id: advertiserId,
      p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
    if (metError) console.warn('Failed to fetch campaign metrics:', metError.message)
    for (const row of (metrics as unknown as { campaign_id: string | null; impressions_served: number }[]) ?? []) {
      if (row.campaign_id) {
        impressionMap.set(
          row.campaign_id,
          (impressionMap.get(row.campaign_id) ?? 0) + Number(row.impressions_served ?? 0)
        )
      }
    }
  }

  return rawCampaigns.map((campaign) => {
    const { creatives, ...rest } = campaign as Tables<'campaigns'> & {
      creatives: { count: number }[]
    }
    return {
      ...rest,
      creative_count: creatives?.[0]?.count ?? 0,
      impressions_served: impressionMap.get(rest.id) ?? 0,
    }
  })
}

// ---------------------------------------------------------------------------
// Creative Assignment API
// ---------------------------------------------------------------------------

export async function fetchCreativesByCampaign(
  campaignId: string
): Promise<Tables<'creatives'>[]> {
  const { data, error } = await supabase
    .from('creatives')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function fetchUnassignedCreatives(): Promise<
  Tables<'creatives'>[]
> {
  const { data, error } = await supabase
    .from('creatives')
    .select('*')
    .is('campaign_id', null)
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function assignCreativeToCampaign(
  creativeId: string,
  campaignId: string
): Promise<Tables<'creatives'>> {
  const { data, error } = await supabase
    .from('creatives')
    .update({ campaign_id: campaignId })
    .eq('id', creativeId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function removeCreativeFromCampaign(
  creativeId: string
): Promise<Tables<'creatives'>> {
  const { data, error } = await supabase
    .from('creatives')
    .update({ campaign_id: null })
    .eq('id', creativeId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateCreativeStatus(
  creativeId: string,
  newStatus: Enums<'creative_status'>
): Promise<Tables<'creatives'>> {
  // First fetch the current creative to validate transition
  const { data: current, error: fetchError } = await supabase
    .from('creatives')
    .select('status')
    .eq('id', creativeId)
    .single()

  if (fetchError) throw new Error(fetchError.message)

  if (!canCreativeTransitionTo(current.status, newStatus)) {
    throw new Error(
      `Invalid status transition: cannot move from "${current.status}" to "${newStatus}"`
    )
  }

  const { data, error } = await supabase
    .from('creatives')
    .update({ status: newStatus })
    .eq('id', creativeId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ---------------------------------------------------------------------------
// Creative Duplication
// ---------------------------------------------------------------------------

export async function duplicateCreative(
  sourceId: string
): Promise<Tables<'creatives'>> {
  // 1. Fetch the source creative
  const { data: source, error: fetchError } = await supabase
    .from('creatives')
    .select('*')
    .eq('id', sourceId)
    .single()

  if (fetchError) throw new Error(fetchError.message)

  // 2. Build the duplicate -- copy ALL fields, reset status, suffix name
  // Omit: id, created_at, updated_at, preview_token (let DB generate new values)
  const { id, created_at, updated_at, preview_token, ...rest } = source
  const duplicate: Insertable<'creatives'> = {
    ...rest,
    name: `${source.name} (Copy)`,
    status: 'draft', // Always reset to draft regardless of source status
  }

  // 3. Insert the duplicate
  const { data, error } = await supabase
    .from('creatives')
    .insert(duplicate)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
