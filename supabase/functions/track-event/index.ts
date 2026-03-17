/**
 * track-event Edge Function
 *
 * Receives tracking pixels/beacons via GET or POST and returns a 1x1 transparent GIF
 * while asynchronously inserting event data into the ad_events table.
 *
 * Query parameters:
 *   type  - Event type (impression_served, impression_viewable, click, engagement, etc.)
 *   rid   - Request ID (ties events to the original serve-ad request)
 *   cid   - Creative ID
 *   aid   - Advertiser ID
 *   cmpid - Campaign ID (optional)
 *   cb    - Cache buster (ignored, prevents browser caching)
 *
 * Deployed with --no-verify-jwt since requests come from ad tags on publisher pages.
 */

import { createAdminClient } from '../_shared/supabase-admin.ts'
import { parseCookie, extractUtmParams, normalizeDevice } from '../_shared/tracking-utils.ts'

/** Valid event types accepted by the tracker */
const VALID_EVENTS = new Set([
  'impression_served',
  'impression_viewable',
  'engagement',
  'presence',
  'click',
  'video_play',
  'video_pause',
  'video_complete',
  'video_quartile',
  'expand',
  'collapse',
  'close',
])

/** 1x1 transparent GIF (43 bytes) */
const PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b,
])

/** Response headers for the tracking pixel */
const PIXEL_HEADERS: Record<string, string> = {
  'Content-Type': 'image/gif',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Access-Control-Allow-Origin': '*',
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  const url = new URL(req.url)
  const params = url.searchParams

  // Extract required parameters
  const eventType = params.get('type')
  const requestId = params.get('rid')
  const creativeId = params.get('cid')
  const advertiserId = params.get('aid')
  const campaignId = params.get('cmpid') || null

  // If missing required params or invalid event type, still return pixel (never break ad rendering)
  if (!eventType || !VALID_EVENTS.has(eventType) || !requestId || !creativeId || !advertiserId) {
    return new Response(PIXEL, { status: 200, headers: PIXEL_HEADERS })
  }

  // Build contextual extra_data from request headers
  const cookieHeader = req.headers.get('Cookie')
  const userAgent = req.headers.get('User-Agent')
  const referer = req.headers.get('Referer')

  const cookieId = parseCookie(cookieHeader, 'st_uid')
  const device = normalizeDevice(userAgent)
  const utmParams = extractUtmParams(referer)

  // RESERVED params that should not go into extra_data (already have their own columns)
  const RESERVED_PARAMS = new Set(['type', 'rid', 'cid', 'aid', 'cmpid', 'cb', 'uid'])

  const extraData: Record<string, unknown> = {
    ...device,
    ...utmParams,
    ...(cookieId ? { cookie_id: cookieId } : {}),
    ...(userAgent ? { user_agent: userAgent } : {}),
    ...(referer ? { page_url: referer } : {}),
  }

  // Add any other query params to extraData (interactions, quartiles, dwell_time, etc.)
  for (const [key, value] of params.entries()) {
    if (!RESERVED_PARAMS.has(key)) {
      extraData[key] = value
    }
  }

  // Await insert so Deno doesn't kill the worker before it completes (EarlyDrop)
  const admin = createAdminClient()
  const { error: insertError } = await admin
    .from('ad_events')
    .insert({
      event_type: eventType,
      request_id: requestId,
      creative_id: creativeId,
      advertiser_id: advertiserId,
      campaign_id: campaignId,
      extra_data: extraData,
    })

  if (insertError) {
    console.error('[track-event] Failed to insert ad_event:', insertError)
  }

  // Deduct one impression credit when the CDN bundle fires its first impression_served event.
  // (serve-ad handles credit deduction for server-rendered tags; CDN tags track it here.)
  // When deduction fails OR balance hits 0, overwrite the CDN bundle with a no-op JS
  // so subsequent loads from the publisher page don't render anything.
  if (eventType === 'impression_served') {
    // Validate campaign before deducting credits — don't charge for expired/deleted campaigns
    let campaignValid = true
    if (campaignId) {
      const { data: campaign } = await admin
        .from('campaigns')
        .select('id, end_date')
        .eq('id', campaignId)
        .single()
      if (!campaign) {
        campaignValid = false
      } else if (campaign.end_date) {
        const today = new Date().toISOString().split('T')[0]
        if (campaign.end_date < today) campaignValid = false
      }
    } else {
      // No campaign_id means campaign was deleted (SET NULL)
      campaignValid = false
    }

    if (!campaignValid && creativeId) {
      // Overwrite CDN bundle so no more impressions are served
      const noop = new TextEncoder().encode('/* paused - campaign expired or deleted */')
      const { error: uploadErr } = await admin.storage
        .from('ad-bundles')
        .upload(`${creativeId}.js`, noop, { upsert: true, contentType: 'application/javascript' })
      if (uploadErr) console.warn('[track-event] CDN cleanup failed:', uploadErr.message)
      // Still return pixel (don't break publisher page), but skip credit deduction
      return new Response(PIXEL, { status: 200, headers: PIXEL_HEADERS })
    }

    const { data: newBalance, error: creditError } = await admin
      .rpc('deduct_impression_credit', { p_advertiser_id: advertiserId })
    if (creditError) {
      console.error('[track-event] Failed to deduct impression credit:', creditError)
    }
    // newBalance < 0 means already exhausted, newBalance === 0 means last credit just used
    if (creativeId && (newBalance === null || newBalance === undefined || newBalance <= 0)) {
      const noop = new TextEncoder().encode('/* paused - no credits */')
      const { error: uploadErr } = await admin.storage
        .from('ad-bundles')
        .upload(`${creativeId}.js`, noop, { upsert: true, contentType: 'application/javascript' })
      if (uploadErr) console.warn('[track-event] CDN cleanup failed:', uploadErr.message)
    }
  }

  // Return pixel after DB operations complete
  return new Response(PIXEL, { status: 200, headers: PIXEL_HEADERS })
})
