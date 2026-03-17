/**
 * serve-ad Edge Function
 *
 * The core ad serving endpoint. Called by ad tags on publisher pages via
 * <script src="...serve-ad?id=..."> tags. Returns application/javascript
 * that creates a sandboxed iframe with the creative's pre-rendered HTML.
 *
 * It passes runtime telemetry configuration to the Ad Tag Bundler via 
 * window.__ST_SERVE_CONFIG__ and injects any third-party trackers.
 */

import { createAdminClient } from '../_shared/supabase-admin.ts'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { parseCookie } from '../_shared/tracking-utils.ts'

const NOOP_JS = new TextEncoder().encode('/* paused - no credits */')

/**
 * Overwrites a single creative's CDN bundle with a no-op JS file.
 * Called when a creative's campaign is deleted or expired.
 */
async function cleanupCreativeCdnBundle(admin: SupabaseClient, creativeId: string) {
  const { error } = await admin.storage
    .from('ad-bundles')
    .upload(`${creativeId}.js`, NOOP_JS, { upsert: true, contentType: 'application/javascript' })
  if (error) console.warn('[serve-ad] CDN cleanup failed for', creativeId, error.message)
}

/**
 * Overwrites all CDN bundle files for an advertiser's creatives with a no-op JS file.
 * Called when credits are exhausted so static CDN tags stop rendering ads.
 */
async function cleanupCdnBundles(admin: SupabaseClient, advertiserId: string) {
  const { data: creatives } = await admin
    .from('creatives')
    .select('id')
    .eq('advertiser_id', advertiserId)
    .in('status', ['paused', 'active'])

  if (!creatives || creatives.length === 0) return

  for (const c of creatives) {
    const { error } = await admin.storage
      .from('ad-bundles')
      .upload(`${c.id}.js`, NOOP_JS, { upsert: true, contentType: 'application/javascript' })
    if (error) console.warn('[serve-ad] CDN cleanup failed for', c.id, error.message)
  }
}

interface CreativeRow {
  id: string
  advertiser_id: string
  campaign_id: string | null
  format_id: string | null
  template_data: Record<string, unknown> | null
  rendered_html: string
  width: number | null
  height: number | null
}

interface TrackerRow {
  tracker_url: string
  tracker_type: string // 'pixel' | 'script'
  fire_condition: string // 'on_load' | 'on_viewable' | 'on_click' | 'on_engagement'
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Injects the runtime configuration and third-party trackers into the bundle.
 */
function injectRuntimeConfigAndTrackers(
  creative: CreativeRow,
  serveConfig: Record<string, string>,
  clickBaseUrl: string,
  gamClickUrl: string,
  trackers: TrackerRow[],
): string {
  let html = creative.rendered_html

  // 1. Prepend the runtime telemetry config
  const configScript = `<script>window.__ST_SERVE_CONFIG__ = ${JSON.stringify(serveConfig)};</script>`
  html = configScript + html

  // 2. Rewrite CTA click URLs through server-side click-redirect (robust fallback for async tracking)
  const templateData = (creative.template_data || {}) as Record<string, unknown>
  const ctaUrl = (templateData.ctaUrl as string) || 'https://scrolltoday.com'

  if (ctaUrl) {
    const encodedDest = encodeURIComponent(ctaUrl)
    const clickTrackUrl = `${clickBaseUrl}?rid=${serveConfig.requestId}&cid=${creative.id}&aid=${creative.advertiser_id}&cmpid=${creative.campaign_id || ''}&dest=${encodedDest}`
      + (gamClickUrl ? `&click=${encodeURIComponent(gamClickUrl)}` : '')

    html = html.replace(
      new RegExp(`href="${escapeRegex(ctaUrl)}"`, 'g'),
      `href="${clickTrackUrl}" target="_top"`,
    )
  }

  // 3. Inject third-party trackers
  let onLoadTrackers = ''
  for (const tracker of trackers.filter(t => t.fire_condition === 'on_load')) {
    const url = tracker.tracker_url.replace(/%%CACHEBUSTER%%/g, String(Date.now()))
    if (tracker.tracker_type === 'pixel') {
      onLoadTrackers += `<img src="${url}" width="1" height="1" style="position:absolute;left:-9999px" alt="" />`
    } else if (tracker.tracker_type === 'script') {
      onLoadTrackers += `<script src="${url}"><\/script>`
    }
  }

  // For on_viewable, we hook into the IntersectionObserver. Since Telemetry handles 1st party,
  // we just inject a simple standalone observer for 3rd party viewability if needed.
  const onViewableTrackers = trackers.filter(t => t.fire_condition === 'on_viewable')
  let viewabilityScript = ''
  if (onViewableTrackers.length > 0) {
    let viewableFires = ''
    for (const tracker of onViewableTrackers) {
      const url = tracker.tracker_url.replace(/%%CACHEBUSTER%%/g, "'+Date.now()+'")
      if (tracker.tracker_type === 'pixel') {
        viewableFires += `new Image().src='${url}';`
      } else {
        viewableFires += `var ts=document.createElement('script');ts.src='${url}';document.body.appendChild(ts);`
      }
    }
    viewabilityScript = `<script>(function(){var root=document.getElementById('creative-root')||document.body;if(!root||!window.IntersectionObserver)return;var fired=false;var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(fired)return;if(entry.isIntersecting&&entry.intersectionRatio>=0.5){setTimeout(function(){if(!fired){fired=true;${viewableFires}observer.disconnect();}},1000);}});},{threshold:0.5});observer.observe(root);})();<\/script>`
  }

  const onClickTrackers = trackers.filter(t => t.fire_condition === 'on_click')
  let clickTrackerScript = ''
  if (onClickTrackers.length > 0) {
    let clickTrackerFires = ''
    for (const tracker of onClickTrackers) {
      const url = tracker.tracker_url.replace(/%%CACHEBUSTER%%/g, "'+Date.now()+'")
      if (tracker.tracker_type === 'pixel') {
        clickTrackerFires += `new Image().src='${url}';`
      } else {
        clickTrackerFires += `var cs=document.createElement('script');cs.src='${url}';document.body.appendChild(cs);`
      }
    }
    clickTrackerScript = `<script>(function(){var root=document.getElementById('creative-root')||document.body;if(root){root.addEventListener('click',function(){${clickTrackerFires}});}})();<\/script>`
  }

  const onEngagementTrackers = trackers.filter(t => t.fire_condition === 'on_engagement')
  let engagementTrackerScript = ''
  if (onEngagementTrackers.length > 0) {
    let engagementFires = ''
    for (const tracker of onEngagementTrackers) {
      const url = tracker.tracker_url.replace(/%%CACHEBUSTER%%/g, "'+Date.now()+'")
      if (tracker.tracker_type === 'pixel') {
        engagementFires += `new Image().src='${url}';`
      } else {
        engagementFires += `var es=document.createElement('script');es.src='${url}';document.body.appendChild(es);`
      }
    }
    engagementTrackerScript = `<script>(function(){window.addEventListener('st:engagement',function(){${engagementFires}});})();<\/script>`
  }

  const trackingBlock = [
    onLoadTrackers,
    clickTrackerScript,
    engagementTrackerScript,
    viewabilityScript,
  ].filter(Boolean).join('\n')

  if (trackingBlock) {
    html = html.replace('</body>', `${trackingBlock}\n</body>`)
  }

  return html
}

function buildAdScript(
  adHtml: string,
  width: string,
  height: string,
): string {
  const escapedHtml = JSON.stringify(adHtml)
  return `(function(){
var c=document.currentScript.parentElement;
if(!c)return;
var f=document.createElement('iframe');
f.width='${width}';
f.height='${height}';
f.frameBorder='0';
f.scrolling='no';
f.style.border='none';
f.style.overflow='hidden';
f.setAttribute('sandbox','allow-scripts allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation');
f.allow='autoplay';
f.srcdoc=${escapedHtml};
c.appendChild(f);
})();`
}

Deno.serve(async (req: Request) => {
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

  const creativeId = params.get('id')
  const width = params.get('w') || '300'
  const height = params.get('h') || '250'
  const gamClickUrl = params.get('click') || ''

  if (!creativeId) {
    return new Response(null, { status: 204 })
  }

  const admin = createAdminClient()

  const { data: creative, error } = await admin
    .from('creatives')
    .select('id, advertiser_id, campaign_id, format_id, template_data, rendered_html, width, height, advertisers!inner(id, credit_balance)')
    .eq('id', creativeId)
    .eq('status', 'active')
    .single()

  if (error || !creative || !creative.rendered_html) {
    return new Response(null, { status: 204 })
  }

  // Device targeting — check enabledDevices from template_data against User-Agent
  const templateData = (creative.template_data || {}) as Record<string, unknown>
  const enabledDevices = templateData.enabledDevices as string[] | undefined
  if (enabledDevices && enabledDevices.length > 0) {
    const ua = (req.headers.get('user-agent') || '').toLowerCase()
    const isMobile = /mobile|android|iphone|ipod/.test(ua) && !/tablet|ipad/.test(ua)
    const isTablet = /tablet|ipad/.test(ua) || (/android/.test(ua) && !/mobile/.test(ua))
    const isDesktop = !isMobile && !isTablet
    // Determine orientation from viewport hint or default to portrait
    const isLandscape = /landscape/.test(ua) // Rare in UA, but some browsers include it

    let allowed = false
    if (isMobile && enabledDevices.includes('mobile-portrait')) allowed = true
    if (isMobile && isLandscape && enabledDevices.includes('mobile-landscape')) allowed = true
    if (isTablet && enabledDevices.includes('tablet-portrait')) allowed = true
    if (isTablet && isLandscape && enabledDevices.includes('tablet-landscape')) allowed = true
    if (isDesktop && enabledDevices.includes('desktop')) allowed = true
    // If no specific match but device class matches any orientation, allow it
    if (isMobile && !isLandscape && enabledDevices.includes('mobile-portrait')) allowed = true
    if (isTablet && !isLandscape && enabledDevices.includes('tablet-portrait')) allowed = true

    if (!allowed) {
      return new Response(null, { status: 204 })
    }
  }

  // Campaign validation — stop serving if campaign was deleted or expired
  if (!creative.campaign_id) {
    // Campaign was deleted (FK SET NULL) — clean up CDN bundle and stop
    void cleanupCreativeCdnBundle(admin, creative.id)
    return new Response(null, { status: 204 })
  }

  const { data: campaign, error: campaignError } = await admin
    .from('campaigns')
    .select('id, end_date')
    .eq('id', creative.campaign_id)
    .single()

  if (campaignError || !campaign) {
    void cleanupCreativeCdnBundle(admin, creative.id)
    return new Response(null, { status: 204 })
  }

  if (campaign.end_date) {
    const today = new Date().toISOString().split('T')[0]
    if (campaign.end_date < today) {
      void cleanupCreativeCdnBundle(admin, creative.id)
      return new Response(null, { status: 204 })
    }
  }

  const { data: newBalance } = await admin.rpc('deduct_impression_credit', {
    p_advertiser_id: creative.advertiser_id,
  })

  if (newBalance === null || newBalance === undefined || newBalance < 0) {
    // Credits already exhausted — overwrite ALL CDN bundles for this org with no-op JS
    // so static CDN tags also stop rendering. Fire-and-forget.
    void cleanupCdnBundles(admin, creative.advertiser_id)
    return new Response(null, { status: 204 })
  }

  if (newBalance === 0) {
    // Last credit just used — serve this ad but immediately clean up CDN bundles
    // so no further impressions can be served via static CDN tags.
    void cleanupCdnBundles(admin, creative.advertiser_id)
  }

  const requestId = crypto.randomUUID()
  const trackBaseUrl = url.origin + '/functions/v1/track-event'
  const clickBaseUrl = url.origin + '/functions/v1/click-redirect'
  const cookieId = parseCookie(req.headers.get('cookie'), 'st_uid') || crypto.randomUUID()

  const serveConfig = {
    trackUrl: trackBaseUrl,
    creativeId: creative.id,
    advertiserId: creative.advertiser_id,
    campaignId: creative.campaign_id || '',
    requestId: requestId,
    cookieId: cookieId
  }

  const { data: trackers } = await admin
    .from('creative_trackers')
    .select('tracker_configs!inner(tracker_url, tracker_type), fire_condition')
    .eq('creative_id', creative.id)

  const flatTrackers: TrackerRow[] = (trackers || []).map((t: Record<string, unknown>) => {
    const config = t.tracker_configs as Record<string, unknown>
    return {
      tracker_url: config.tracker_url as string,
      tracker_type: config.tracker_type as string,
      fire_condition: t.fire_condition as string,
    }
  })

  const adHtml = injectRuntimeConfigAndTrackers(
    creative as unknown as CreativeRow,
    serveConfig,
    clickBaseUrl,
    gamClickUrl,
    flatTrackers,
  )

  const js = buildAdScript(adHtml, width, height)

  return new Response(js, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Set-Cookie': `st_uid=${cookieId}; Path=/; Max-Age=31536000; SameSite=None; Secure`,
      'Access-Control-Allow-Origin': '*',
    },
  })
})
