import { supabase } from '@/lib/supabase'
import type {
  AnalyticsFilters,
  DailyMetricRow,
  HourlyDataPoint,
  DeviceBreakdownPoint,
} from '../lib/analytics-types'

// ---------------------------------------------------------------------------
// Analytics API
// ---------------------------------------------------------------------------

/**
 * Fetch metrics for a date range.
 * advertiserId: null = all orgs (super admin only — enforced by the DB function).
 */
export async function fetchMetricsRange(
  advertiserId: string | null,
  startDate: string | null,
  endDate: string | null,
  filters?: AnalyticsFilters
): Promise<DailyMetricRow[]> {
  const params: Record<string, string> = {
    p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
  if (advertiserId) params.p_advertiser_id = advertiserId
  if (startDate) params.p_start_date = startDate
  if (endDate) params.p_end_date = endDate
  if (filters?.creativeId) params.p_creative_id = filters.creativeId
  if (filters?.campaignId) params.p_campaign_id = filters.campaignId

  const { data, error } = await (supabase.rpc as any)('fetch_metrics_range', params)
  if (error) throw new Error(error.message)
  return data as unknown as DailyMetricRow[]
}

/**
 * Fetch creative options for the filter dropdown.
 * advertiserId: null = all orgs (super admin only).
 */
export async function fetchCreativeOptions(
  advertiserId: string | null
): Promise<{ id: string; name: string }[]> {
  let query = supabase
    .from('creatives')
    .select('id, name')
    .is('deleted_at', null)
    .order('name')

  if (advertiserId) query = query.eq('advertiser_id', advertiserId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

/**
 * Fetch campaign options for the filter dropdown.
 * advertiserId: null = all orgs (super admin only).
 */
export async function fetchCampaignOptions(
  advertiserId: string | null
): Promise<{ id: string; name: string }[]> {
  let query = supabase
    .from('campaigns')
    .select('id, name')
    .order('name')

  if (advertiserId) query = query.eq('advertiser_id', advertiserId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

// ---------------------------------------------------------------------------
// Phase 13 — Extended Analytics API
// ---------------------------------------------------------------------------

/**
 * Fetch hourly metrics for a specific date.
 * advertiserId: null = all orgs (super admin only).
 */
export async function fetchHourlyMetrics(
  advertiserId: string | null,
  date: string
): Promise<HourlyDataPoint[]> {
  const params: Record<string, string> = {
    p_date: date,
    p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
  if (advertiserId) params.p_advertiser_id = advertiserId

  const { data, error } = await (supabase.rpc as any)('fetch_hourly_metrics', params)
  if (error) throw new Error(error.message)
  return data as unknown as HourlyDataPoint[]
}

/**
 * Fetch all-time metrics for lifetime totals and creative pie chart.
 */
export async function fetchLifetimeMetrics(
  advertiserId: string | null
): Promise<DailyMetricRow[]> {
  return fetchMetricsRange(advertiserId, null, null)
}

/**
 * Fetch device/platform breakdown for a date range.
 * advertiserId: null = all orgs (super admin only).
 */
export async function fetchDeviceBreakdown(
  advertiserId: string | null,
  startDate: string,
  endDate: string
): Promise<DeviceBreakdownPoint[]> {
  const params: Record<string, string> = {
    p_start_date: startDate,
    p_end_date: endDate,
  }
  if (advertiserId) params.p_advertiser_id = advertiserId

  const { data, error } = await (supabase.rpc as any)('fetch_device_breakdown', params)
  if (error) throw new Error(error.message)
  return data as unknown as DeviceBreakdownPoint[]
}
