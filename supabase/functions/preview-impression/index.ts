/**
 * preview-impression Edge Function
 *
 * Deducts one impression credit when a creative is viewed via its preview link.
 * Called from the preview page (preview-page.tsx) alongside the analytics
 * tracking pixel. The tracking pixel handles ad_events recording; this
 * function handles the credit deduction only.
 *
 * Query parameters:
 *   token - The creative's preview_token (required)
 *
 * Returns:
 *   - 204 always (fire-and-forget — never breaks the preview page)
 *
 * Deployed with --no-verify-jwt since preview links are publicly accessible.
 */

import { createAdminClient } from '../_shared/supabase-admin.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  const url = new URL(req.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  try {
    const admin = createAdminClient()

    // Fetch the creative by preview_token to get advertiser_id
    const { data: creative, error } = await admin
      .from('creatives')
      .select('id, advertiser_id')
      .eq('preview_token', token)
      .single()

    if (error || !creative) {
      // Unknown token — silent fail
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    // Deduct one impression credit atomically
    // Returns false if balance is zero (no error — just no deduction)
    await admin.rpc('deduct_impression_credit', {
      p_advertiser_id: creative.advertiser_id,
    })
  } catch {
    // Never break the preview experience on errors
  }

  return new Response(null, { status: 204, headers: CORS_HEADERS })
})
