import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import type { AnalyticsFilters } from '../lib/analytics-types'
import {
  fetchMetricsRange,
  fetchCreativeOptions,
  fetchCampaignOptions,
  fetchHourlyMetrics,
  fetchLifetimeMetrics,
  fetchDeviceBreakdown,
} from '../api/analytics-api'

// ---------------------------------------------------------------------------
// Analytics Hooks
// ---------------------------------------------------------------------------

/**
 * Fetch metrics for a date range with optional filters.
 * advertiserId: explicit org to query. Super admins may pass null to query all orgs.
 */
export function useAnalytics(
  advertiserId: string | null,
  startDate: string,
  endDate: string,
  filters?: AnalyticsFilters
) {
  const { profile, isAdmin } = useAuth()
  const ready = !!profile && (isAdmin || !!advertiserId)

  return useQuery({
    queryKey: ['analytics', advertiserId, startDate, endDate, filters],
    queryFn: () => fetchMetricsRange(advertiserId, startDate, endDate, filters),
    enabled: ready,
    staleTime: Infinity,
  })
}

/**
 * Fetch creative options for the analytics filter dropdown.
 * Super admins: null advertiserId fetches across all orgs.
 * Regular users: always use their own advertiser_id.
 */
export function useCreativeOptions(advertiserId?: string | null) {
  const { profile, isAdmin } = useAuth()
  const aid = isAdmin ? (advertiserId ?? null) : (profile?.advertiser_id ?? null)
  // Super admins are always ready (null = fetch all orgs); regular users need their id
  const ready = !!profile && (isAdmin || !!aid)

  return useQuery({
    queryKey: ['creative-options', aid ?? 'all'],
    queryFn: () => fetchCreativeOptions(aid),
    enabled: ready,
  })
}

/**
 * Fetch campaign options for the analytics filter dropdown.
 * Super admins: null advertiserId fetches across all orgs.
 * Regular users: always use their own advertiser_id.
 */
export function useCampaignOptions(_advertiserId?: string | null) {
  const { profile, isAdmin } = useAuth()
  // Super admins fetch ALL campaigns (no filter) so cross-org references resolve in the table.
  // Regular users only see their own org's campaigns.
  const aid = isAdmin ? null : (profile?.advertiser_id ?? null)
  const ready = !!profile && (isAdmin || !!aid)

  return useQuery({
    queryKey: ['campaign-options', isAdmin ? 'all' : aid],
    queryFn: () => fetchCampaignOptions(aid),
    enabled: ready,
  })
}

// ---------------------------------------------------------------------------
// Phase 13 — Extended Analytics Hooks
// ---------------------------------------------------------------------------

/**
 * Fetch hourly metrics for a specific date. Returns 24 data points (hours 0-23).
 */
export function useHourlyMetrics(advertiserId: string | null, date: string | null) {
  const { profile, isAdmin } = useAuth()
  const ready = !!profile && (isAdmin || !!advertiserId) && !!date

  return useQuery({
    queryKey: ['analytics-hourly', advertiserId, date],
    queryFn: () => fetchHourlyMetrics(advertiserId, date!),
    enabled: ready,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Fetch all-time metrics for lifetime totals and creative pie chart.
 * Super admins pass null to see across all orgs.
 */
export function useLifetimeMetrics(advertiserId: string | null) {
  const { profile, isAdmin } = useAuth()
  const ready = !!profile && (isAdmin || !!advertiserId)

  return useQuery({
    queryKey: ['analytics-lifetime', advertiserId],
    queryFn: () => fetchLifetimeMetrics(advertiserId),
    enabled: ready,
    staleTime: Infinity,
  })
}

/**
 * Fetch device/platform breakdown for a date range.
 */
export function useDeviceBreakdown(
  advertiserId: string | null,
  startDate: string,
  endDate: string
) {
  const { profile, isAdmin } = useAuth()
  const ready = !!profile && (isAdmin || !!advertiserId)

  return useQuery({
    queryKey: ['analytics-device', advertiserId, startDate, endDate],
    queryFn: () => fetchDeviceBreakdown(advertiserId, startDate, endDate),
    enabled: ready,
    staleTime: 5 * 60 * 1000,
  })
}
