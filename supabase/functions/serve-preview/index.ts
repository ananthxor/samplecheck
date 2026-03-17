/**
 * serve-preview Edge Function
 *
 * Returns the creative's rendered_html directly as a standalone HTML page,
 * identified by its preview_token. No authentication required — designed to
 * be shared publicly.
 *
 * No tracking, no credit deduction. Pure visual preview.
 *
 * Query parameters:
 *   token - The creative's preview_token (UUID)
 *
 * Deployed with --no-verify-jwt since this is a public endpoint.
 */

import { createAdminClient } from '../_shared/supabase-admin.ts'

function notFoundPage(): Response {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Preview not found</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center;
           justify-content: center; height: 100vh; margin: 0; background: #f9fafb; }
    .box { text-align: center; color: #6b7280; }
    h1 { font-size: 1.25rem; font-weight: 600; color: #111827; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="box">
    <h1>Preview not found</h1>
    <p>This preview link may be invalid or expired.</p>
  </div>
</body>
</html>`,
    { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    })
  }

  const url = new URL(req.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return notFoundPage()
  }

  const admin = createAdminClient()

  const { data: creative, error } = await admin
    .from('creatives')
    .select('id, name, rendered_html')
    .eq('preview_token', token)
    .single()

  if (error || !creative || !creative.rendered_html) {
    return notFoundPage()
  }

  // Return the rendered_html directly — it's already a complete standalone HTML
  // document produced by the ad bundler. No wrapper needed.
  //
  // Inject a script at the top of <head> to neutralise any tracking URL that
  // may have been baked in before the renderer.ts empty-trackUrl fix, by
  // replacing window.initStandardTracking with a no-op before the ad-sdk runs.
  const disableTrackingScript =
    '<script>window.initStandardTracking=function(){};</script>'

  let html = creative.rendered_html as string
  if (html.includes('<head>')) {
    html = html.replace('<head>', '<head>' + disableTrackingScript)
  }

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache',
      'Access-Control-Allow-Origin': '*',
    },
  })
})
