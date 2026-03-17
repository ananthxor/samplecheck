/**
 * Cloudflare Worker — cdn.scrolltoday.com/preview/*
 *
 * Fetches creative preview HTML from Supabase Storage and re-serves it with
 * the correct Content-Type. Supabase's supabase.co gateway enforces a
 * Content-Security-Policy that overrides any HTML Content-Type to text/plain,
 * making it impossible to serve preview HTML directly from their domain.
 * This Worker fetches from storage and re-serves from cdn.scrolltoday.com,
 * which has no such restriction.
 *
 * URL pattern:
 *   cdn.scrolltoday.com/preview/{preview_token}.html
 *   cdn.scrolltoday.com/preview/{preview_token}        (without .html also works)
 *
 * Deployment:
 *   1. Create a Worker at dash.cloudflare.com (or via Wrangler CLI)
 *   2. Paste this file as the Worker script
 *   3. Add a Custom Domain route:  cdn.scrolltoday.com/preview/*
 *   4. Set environment variable: SUPABASE_URL = https://ltiqcyigqlytqeisfoeq.supabase.co
 *
 * Environment variables (set in Cloudflare Dashboard → Worker → Settings → Variables):
 *   SUPABASE_URL — your Supabase project URL (no trailing slash)
 *
 * Once deployed, set VITE_CDN_BASE_URL=https://cdn.scrolltoday.com in your
 * app's production .env to activate CDN preview links.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // ── /geo — return Cloudflare's built-in geo data for the client IP ────────
    // request.cf is populated by Cloudflare automatically — no MMDB required.
    if (url.pathname === '/geo') {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS })
      }
      const cf = request.cf ?? {}
      return new Response(
        JSON.stringify({
          city:         cf.city         ?? null,
          region:       cf.region       ?? null,
          country_code: cf.country      ?? null,
          latitude:     cf.latitude     ? parseFloat(cf.latitude)  : null,
          longitude:    cf.longitude    ? parseFloat(cf.longitude) : null,
        }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Only handle /preview/* paths
    if (!url.pathname.startsWith('/preview/')) {
      return new Response('Not found', { status: 404 })
    }

    // Extract token — strip /preview/ prefix and optional .html suffix
    const token = url.pathname
      .replace('/preview/', '')
      .replace(/\.html$/, '')
      .trim()

    if (!token) {
      return new Response('Missing preview token', { status: 400 })
    }

    const supabaseUrl = env.SUPABASE_URL || 'https://ltiqcyigqlytqeisfoeq.supabase.co'
    const storageUrl = `${supabaseUrl}/storage/v1/object/public/previews/${token}.html`

    let response
    try {
      response = await fetch(storageUrl, {
        headers: { Accept: 'text/html' },
      })
    } catch {
      return new Response('Failed to fetch preview', { status: 502 })
    }

    if (!response.ok) {
      return new Response(
        `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Preview not found</title>
<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f9fafb}.box{text-align:center;color:#6b7280}h1{font-size:1.25rem;font-weight:600;color:#111827;margin-bottom:8px}</style>
</head>
<body><div class="box"><h1>Preview not found</h1><p>This preview link may be invalid or expired.</p></div></body>
</html>`,
        {
          status: 404,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }
      )
    }

    const html = await response.text()

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'X-Frame-Options': 'SAMEORIGIN',
      },
    })
  },
}
