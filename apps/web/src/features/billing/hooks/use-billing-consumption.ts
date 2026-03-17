import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import { fetchCreativeConsumption } from '../api/billing-api'
import {
  getBillingBucket,
  type ConsumptionSummaryRow,
  type CreativeConsumptionRow,
  type BillingBucket,
} from '../lib/billing-types'

export function useCreativeConsumption(startDate: string, endDate: string) {
  const { profile, effectiveAdvertiserId } = useAuth()

  // Use the selected org when available, fall back to user's home org
  const advertiserId = effectiveAdvertiserId ?? profile?.advertiser_id

  const query = useQuery({
    queryKey: ['billing-consumption', advertiserId, startDate, endDate],
    queryFn: () =>
      fetchCreativeConsumption(advertiserId!, startDate, endDate),
    enabled: !!advertiserId,
    staleTime: 5 * 60 * 1000,
  })

  // Aggregate raw rows into per-creative consumption rows
  const creativeRows = useMemo<CreativeConsumptionRow[]>(() => {
    if (!query.data) return []
    const byCreative = new Map<
      string,
      { 
        name: string; 
        formatId: string | null; 
        impressions: number; 
        clicks: number;
        engagements: number;
        videoPlays: number;
        videoCompletes: number;
      }
    >()
    for (const row of query.data) {
      const id = row.creative_id ?? 'unknown'
      const existing = byCreative.get(id)
      if (existing) {
        existing.impressions += row.impressions_served
        existing.clicks += row.clicks
        existing.engagements += row.engagements
        existing.videoPlays += row.video_plays
        existing.videoCompletes += row.video_completes
      } else {
        byCreative.set(id, {
          name: row.creatives?.name ?? id.slice(0, 8),
          formatId: row.creatives?.format_id ?? null,
          impressions: row.impressions_served,
          clicks: row.clicks,
          engagements: row.engagements,
          videoPlays: row.video_plays,
          videoCompletes: row.video_completes,
        })
      }
    }
    return Array.from(byCreative.entries()).map(([creativeId, agg]) => ({
      creativeId,
      creativeName: agg.name,
      formatId: agg.formatId,
      bucket: getBillingBucket(agg.formatId),
      impressions: agg.impressions,
      clicks: agg.clicks,
      ctr: agg.impressions > 0
        ? Number(((agg.clicks / agg.impressions) * 100).toFixed(2))
        : 0,
      engagements: agg.engagements,
      engagementRate: agg.impressions > 0
        ? Number(((agg.engagements / agg.impressions) * 100).toFixed(2))
        : 0,
      videoCompletionRate: agg.videoPlays > 0
        ? Number(((agg.videoCompletes / agg.videoPlays) * 100).toFixed(2))
        : 0,
      cost: agg.impressions, // 1 credit = 1 impression
    })).sort((a, b) => b.impressions - a.impressions)
  }, [query.data])

  // Aggregate creative rows into per-bucket summary
  const summaryRows = useMemo<ConsumptionSummaryRow[]>(() => {
    const byBucket = new Map<BillingBucket, { impressions: number; credits: number }>()
    for (const row of creativeRows) {
      const existing = byBucket.get(row.bucket)
      if (existing) {
        existing.impressions += row.impressions
        existing.credits += row.cost
      } else {
        byBucket.set(row.bucket, { impressions: row.impressions, credits: row.cost })
      }
    }
    // Always show all four buckets, even if zero.
    // Trackers always shows zero — tracker_configs do not generate daily_metrics rows.
    const allBuckets: BillingBucket[] = ['Creatives', 'Static', 'Videos', 'Trackers']
    return allBuckets.map((type) => ({
      type,
      impressions: byBucket.get(type)?.impressions ?? 0,
      credits: byBucket.get(type)?.credits ?? 0,
    }))
  }, [creativeRows])

  return { ...query, creativeRows, summaryRows }
}
