/**
 * click-redirect Edge Function
 *
 * Logs a click event to ad_events and 302 redirects to the destination URL.
 * Supports GAM click URL chaining: if a `click` param is provided (GAM click
 * tracking URL), the destination is appended to the GAM URL so both Airtory
 * and GAM record the click.
 *
 * Query parameters:
 *   dest  - Destination URL (landing page)
 *   rid   - Request ID (ties to serve-ad request)
 *   cid   - Creative ID
 *   aid   - Advertiser ID
 *   cmpid - Campaign ID (optional)
 *   click - GAM click tracking URL (optional, prepended to dest)
 *
 * Deployed with --no-verify-jwt since requests come from ad tags on publisher pages.
 */

import { createAdminClient } from '../_shared/supabase-admin.ts'
import { parseCookie } from '../_shared/tracking-utils.ts'

Deno.serve((req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  const url = new URL(req.url)
  const params = url.searchParams

  // Extract parameters
  const dest = params.get('dest')
  const requestId = params.get('rid')
  const creativeId = params.get('cid')
  const advertiserId = params.get('aid')
  const campaignId = params.get('cmpid') || null
  const gamClickUrl = params.get('click') || null

  // dest and rid are required
  if (!dest || !requestId) {
    return new Response(
      JSON.stringify({ error: 'Missing required parameters: dest and rid' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  }

  // Fire-and-forget insert to ad_events (never block redirect response)
  if (creativeId && advertiserId) {
    const cookieHeader = req.headers.get('Cookie')
    const userAgent = req.headers.get('User-Agent')
    const cookieId = parseCookie(cookieHeader, 'st_uid')

    const extraData: Record<string, unknown> = {
      destination_url: dest,
      ...(cookieId ? { cookie_id: cookieId } : {}),
      ...(userAgent ? { user_agent: userAgent } : {}),
    }

    const admin = createAdminClient()
    admin
      .from('ad_events')
      .insert({
        event_type: 'click',
        request_id: requestId,
        creative_id: creativeId,
        advertiser_id: advertiserId,
        campaign_id: campaignId,
        extra_data: extraData,
      })
      .then(() => {})
      .catch((err: unknown) => {
        console.error('[click-redirect] Failed to insert click event:', err)
      })
  }

  // Build final redirect URL with optional GAM click chain
  // If GAM click URL provided, prepend it so GAM records the click first,
  // then redirects to the actual destination
  const finalUrl = gamClickUrl
    ? gamClickUrl + encodeURIComponent(dest)
    : dest

  // 302 redirect to destination
  return new Response(null, {
    status: 302,
    headers: {
      'Location': finalUrl,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    },
  })
})
