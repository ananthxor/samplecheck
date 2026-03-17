import { supabase } from '@/lib/supabase'
import type { Tables } from '@scrolltoday/shared'
import type { RawCreativeConsumption } from '../lib/billing-types'

// ---------------------------------------------------------------------------
// Billing API
// ---------------------------------------------------------------------------

/**
 * Fetch the current credit balance for an advertiser.
 * Reads the credit_balance column on the advertisers table.
 */
export async function fetchCreditBalance(
  advertiserId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('advertisers')
    .select('credit_balance')
    .eq('id', advertiserId)
    .single()

  if (error) throw new Error(error.message)
  return data.credit_balance as number
}

/**
 * Fetch credit transactions for an advertiser, newest first.
 */
export async function fetchTransactions(
  advertiserId: string
): Promise<Tables<'credit_transactions'>[]> {
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('advertiser_id', advertiserId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

/**
 * Create a Stripe Checkout Session via the create-checkout Edge Function.
 * Returns the hosted checkout URL for redirect.
 */
export async function createCheckoutSession(
  packId: string
): Promise<{ url: string }> {
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { packId },
  })

  if (error) throw new Error(error.message)
  return data as { url: string }
}

// ---------------------------------------------------------------------------
// Phase 14 — Billing Consumption API
// ---------------------------------------------------------------------------

/**
 * Fetch daily_metrics joined with creatives to get per-creative consumption.
 * Returns raw rows; client-side aggregation groups by creative_id.
 * Access nested join result as row.creatives.name and row.creatives.format_id
 * (PostgREST returns embedded objects, NOT flat columns).
 */
export async function fetchCreativeConsumption(
  advertiserId: string,
  startDate: string,
  endDate: string
): Promise<RawCreativeConsumption[]> {
  const { data, error } = await supabase
    .from('daily_metrics')
    .select(`
      creative_id,
      impressions_served,
      impressions_viewable,
      clicks,
      engagements,
      video_plays,
      video_completes,
      creatives!inner(name, format_id)
    `)
    .eq('advertiser_id', advertiserId)
    .gte('metric_date', startDate)
    .lte('metric_date', endDate)

  if (error) throw new Error(error.message)
  return data as unknown as RawCreativeConsumption[]
}
