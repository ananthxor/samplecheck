# Phase 8: Ad Serving Infrastructure - Research

**Researched:** 2026-02-23
**Domain:** Ad serving via Supabase Edge Functions, impression/click/viewability tracking, atomic credit deduction, anonymous user identity
**Confidence:** HIGH

## Summary

Phase 8 transforms the creative renderers and tag generators built in Phases 4-7 into a live ad serving system. The core architecture consists of three Supabase Edge Functions deployed with `--no-verify-jwt`: (1) `serve-ad` returns `application/javascript` that creates an iframe with the creative's HTML and embedded tracking code, (2) `track-event` receives 1x1 pixel/beacon requests and inserts into the partitioned `ad_events` table, and (3) `click-redirect` logs click events and issues 302 redirects to destination URLs (with GAM click URL chaining when present).

The key technical challenges are: making renderer code available to Edge Functions (solved by storing pre-rendered HTML in the `creatives` table at save time), atomic credit deduction under concurrent load (solved by PostgreSQL's `UPDATE ... SET credit_balance = credit_balance - 1 WHERE credit_balance >= 1` pattern which holds an implicit row-level lock), and viewability measurement from inside cross-origin ad iframes (solved by IntersectionObserver which works cross-origin per IAB/MRC OpenVV 2.5.5 specification).

The existing codebase provides strong foundations: 14 format renderers producing self-contained HTML via `buildPreviewHtml()`, tag generators producing `<script src="...">` URLs pointing to `/serve/ad.js`, a partitioned `ad_events` table with indexes on `request_id`, `creative_id`, and `advertiser_id`, and tracker configuration tables (`tracker_configs` + `creative_trackers`) with fire conditions. The `advertisers` table needs a `credit_balance BIGINT` column added. Third-party cookies remain viable for anonymous user tracking -- Google reversed its Chrome cookie deprecation plan in July 2024 and confirmed in April 2025 it will not introduce a dedicated consent prompt.

**Primary recommendation:** Build three Supabase Edge Functions (`serve-ad`, `track-event`, `click-redirect`) deployed with `--no-verify-jwt`. Add a `rendered_html TEXT` column to `creatives` (generated at save time via `buildPreviewHtml()`). Add a `credit_balance BIGINT` column to `advertisers` with an atomic `deduct_impression_credit` PL/pgSQL function. Use IntersectionObserver at 0.5 threshold with a 1-second timer for IAB/MRC viewability.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SERV-01 | Ad creative assets served from CDN | Assets already in Supabase Storage with CDN URLs. Renderers reference these URLs in `template_data`. The `serve-ad` function returns HTML that references these existing CDN URLs via the pre-rendered HTML stored in `creatives.rendered_html`. |
| SERV-02 | Impression tracking via cachebuster-based pixel with request_id linking | `serve-ad` generates a unique `request_id` (UUIDv4), injects a 1x1 transparent GIF tracking pixel with cachebuster into the ad HTML. Pixel fires to `track-event` endpoint which inserts `impression_served` event into `ad_events` with that `request_id`. |
| SERV-03 | Click tracking with redirect URL handling | All CTA links in rendered HTML are rewritten to point to `click-redirect` endpoint with `request_id`, destination URL, and optional GAM click URL params. Endpoint logs `click` event, then 302 redirects. GAM `%%CLICK_URL_ESC%%` is prepended when present for proper click chain tracking. |
| SERV-04 | Ads stop serving immediately when impression credits hit zero | PostgreSQL function `deduct_impression_credit(advertiser_id)` performs atomic `UPDATE advertisers SET credit_balance = credit_balance - 1 WHERE id = $1 AND credit_balance >= 1 RETURNING FOUND`. If returns FALSE, `serve-ad` returns 204 empty response. Row-level lock prevents concurrent over-deduction. |
| SERV-07 | Viewability tracking (IAB/MRC standard: 50% visible for 1 second) | IntersectionObserver with `threshold: 0.5` inside the ad iframe, paired with a 1-second `setTimeout`. Works cross-origin (confirmed by IAB OpenVV 2.5.5). On qualification, fires `impression_viewable` event to `track-event` endpoint. Pauses on `document.hidden` (tab switch). Fire-once flag prevents double-counting. |
| DATA-04 | Identity/context layer: anonymous users with cookie IDs, sessions with UTM tracking, device normalization | `serve-ad` sets a first-party cookie (`st_uid=UUID`) via `Set-Cookie: SameSite=None; Secure` header. UTM params extracted from `Referer` header. User-Agent parsed server-side for basic device normalization (mobile/desktop/tablet, OS, browser). All stored in `ad_events.extra_data` JSONB. |
</phase_requirements>

## Standard Stack

### Core (Already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase Edge Functions (Deno) | Latest | Ad serving endpoints (serve-ad, track-event, click-redirect) | Already used for admin functions; `--no-verify-jwt` pattern established for public endpoints |
| @supabase/supabase-js | ^2 | Database operations from Edge Functions via service_role | Already in `_shared/supabase-admin.ts` pattern |
| PostgreSQL (via Supabase) | 17 | Atomic credit deduction, event storage, RLS | Partitioned `ad_events` table and advertisers table already exist |
| Supabase Storage | - | CDN delivery of creative assets (images, videos) | Already configured with public bucket and CDN URLs |

### Supporting (No new dependencies needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Web Crypto API (Deno built-in) | - | UUID generation for request_id | `crypto.randomUUID()` in Edge Functions |
| URL / URLSearchParams (Deno built-in) | - | Query parameter parsing from ad request URL | Parse `id`, `w`, `h`, `cb`, `click` params |
| IntersectionObserver (Browser API) | - | IAB/MRC viewability measurement | Injected into ad HTML; no library needed; works cross-origin |

### New Dependencies Needed
None. All ad serving logic uses Deno built-ins, Web APIs, and existing Supabase infrastructure.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase Edge Functions | Cloudflare Workers / Vercel Edge | Would add infrastructure complexity; Supabase already deployed and integrated |
| PostgreSQL atomic UPDATE | Redis for credit counters | Would add a new service dependency; PostgreSQL `UPDATE...WHERE` is sufficient for v1 scale |
| IntersectionObserver | getBoundingClientRect polling | IO is native, performant, works cross-origin in iframes; polling is CPU-wasteful |
| 1x1 pixel tracking | navigator.sendBeacon | Pixel works everywhere including cross-origin iframes; sendBeacon requires same-origin or CORS preflight |
| Pre-rendered HTML column | Import renderers into Edge Function | Would duplicate 14 renderers across two runtimes; pre-rendered HTML guarantees served ad matches preview |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
# Edge Functions use Deno runtime with built-in APIs
```

## Architecture Patterns

### Recommended Project Structure
```
supabase/functions/
  _shared/
    cors.ts                                # Existing CORS headers
    supabase-admin.ts                      # Existing admin client factory
    tracking-utils.ts                      # NEW: cookie parsing, UTM extraction, device normalization
  serve-ad/
    index.ts                               # GET endpoint: returns application/javascript
  track-event/
    index.ts                               # GET+POST endpoint: receives pixel/beacon, returns 1x1 GIF
  click-redirect/
    index.ts                               # GET endpoint: logs click, 302 redirects

supabase/migrations/
  20260224000001_credit_balance_serving.sql # credit_balance column, deduct function, rendered_html column

apps/web/src/features/editor/
  pages/editor-page.tsx                    # MODIFIED: save rendered_html alongside template_data
```

### Pattern 1: Ad Serving Flow (serve-ad Edge Function)
**What:** A GET endpoint that returns `Content-Type: application/javascript`. The JavaScript creates an iframe on the publisher page, sets its `srcdoc` to the creative's pre-rendered HTML (with tracking code injected), and appends it to the container element.
**When to use:** Every ad request from a publisher page via script tag.
**Why application/javascript:** Supabase rewrites `text/html` GET responses to `text/plain` on non-custom-domain projects. `application/javascript` is NOT affected by this restriction (confirmed via Supabase docs -- only `text/html` is rewritten).
**Example:**
```typescript
// supabase/functions/serve-ad/index.ts
import { createAdminClient } from '../_shared/supabase-admin.ts'
import { parseCookie, extractUtmParams, normalizeDevice } from '../_shared/tracking-utils.ts'

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const creativeId = url.searchParams.get('id')
  const width = url.searchParams.get('w') || '300'
  const height = url.searchParams.get('h') || '250'
  const cachebuster = url.searchParams.get('cb') || ''
  const clickUrl = url.searchParams.get('click') || '' // GAM %%CLICK_URL_ESC%% macro value

  if (!creativeId) {
    return new Response('', { status: 204 })
  }

  const admin = createAdminClient()

  // 1. Fetch creative with rendered HTML and advertiser credit info
  const { data: creative, error } = await admin
    .from('creatives')
    .select('id, advertiser_id, campaign_id, format_id, template_data, rendered_html, width, height, advertisers!inner(id, credit_balance)')
    .eq('id', creativeId)
    .eq('status', 'active')
    .single()

  if (error || !creative || !creative.rendered_html) {
    return new Response('', { status: 204 }) // No ad -- silent fail
  }

  // 2. Atomic credit deduction
  const { data: deducted } = await admin.rpc('deduct_impression_credit', {
    p_advertiser_id: creative.advertiser_id,
  })

  if (!deducted) {
    return new Response('', { status: 204 }) // Zero balance -- stop serving
  }

  // 3. Generate request_id and build tracking URLs
  const requestId = crypto.randomUUID()
  const trackBaseUrl = url.origin + '/functions/v1/track-event'
  const clickBaseUrl = url.origin + '/functions/v1/click-redirect'

  // 4. Build the ad HTML with tracking injected
  const adHtml = injectTracking(creative, requestId, trackBaseUrl, clickBaseUrl, clickUrl)

  // 5. Build JavaScript that creates iframe with srcdoc
  const js = buildAdScript(adHtml, creativeId, width, height)

  // 6. Set/refresh anonymous user cookie
  const cookieId = parseCookie(req.headers.get('cookie'), 'st_uid') || crypto.randomUUID()

  return new Response(js, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Set-Cookie': `st_uid=${cookieId}; Path=/; Max-Age=31536000; SameSite=None; Secure`,
      'Access-Control-Allow-Origin': '*',
    },
  })
})
```

### Pattern 2: JavaScript Ad Script Response
**What:** The serve-ad endpoint returns JavaScript that creates an iframe and writes ad HTML into it via srcdoc.
**When to use:** The content returned by serve-ad for browser execution.
**Why srcdoc:** Avoids cross-origin issues, keeps ad self-contained, works with sandbox attribute.
**Example:**
```javascript
// What the ad.js response looks like (generated server-side)
(function() {
  var container = document.currentScript.parentElement;
  var iframe = document.createElement('iframe');
  iframe.width = '300';
  iframe.height = '250';
  iframe.frameBorder = '0';
  iframe.scrolling = 'no';
  iframe.style.border = 'none';
  iframe.setAttribute('sandbox',
    'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation');
  iframe.allow = 'autoplay';
  iframe.srcdoc = '...escaped HTML string...';
  container.appendChild(iframe);
})();
```

### Pattern 3: Tracking Pixel Injection
**What:** 1x1 transparent GIF image element injected into the ad HTML that fires on load, sending event data to the track-event endpoint as query parameters.
**When to use:** SERV-02 impression tracking, fired once per ad load.
**Example:**
```html
<!-- Injected into ad HTML by serve-ad at the end of <body> -->
<img src="https://PROJECT.supabase.co/functions/v1/track-event?type=impression_served&rid=REQUEST_ID&cid=CREATIVE_ID&aid=ADVERTISER_ID&cmpid=CAMPAIGN_ID&cb=TIMESTAMP"
     width="1" height="1" style="position:absolute;left:-9999px;" alt="" />
```

### Pattern 4: Click Tracking with Redirect
**What:** All click-through URLs in the ad are rewritten to go through the click-redirect endpoint. The endpoint logs the click event and 302 redirects to the destination. When a GAM click URL is present, it is prepended for proper click chain tracking.
**When to use:** SERV-03 click tracking.
**Example:**
```typescript
// click-redirect/index.ts
Deno.serve(async (req) => {
  const url = new URL(req.url)
  const dest = url.searchParams.get('dest') || ''
  const requestId = url.searchParams.get('rid') || ''
  const creativeId = url.searchParams.get('cid') || ''
  const advertiserId = url.searchParams.get('aid') || ''
  const campaignId = url.searchParams.get('cmpid') || ''
  const gamClickUrl = url.searchParams.get('click') || ''

  if (!dest || !requestId) {
    return new Response(null, { status: 400 })
  }

  // Log click event (fire-and-forget for fast redirect)
  const admin = createAdminClient()
  admin.from('ad_events').insert({
    event_type: 'click',
    request_id: requestId,
    creative_id: creativeId,
    advertiser_id: advertiserId,
    campaign_id: campaignId || null,
    extra_data: {
      destination_url: dest,
      cookie_id: parseCookie(req.headers.get('cookie'), 'st_uid'),
      user_agent: req.headers.get('user-agent'),
    },
  }).then(() => {}).catch(() => {}) // Non-blocking

  // Build redirect chain: GAM click URL first (if present), then final destination
  const finalUrl = gamClickUrl ? gamClickUrl + encodeURIComponent(dest) : dest

  return new Response(null, {
    status: 302,
    headers: { 'Location': finalUrl },
  })
})
```

### Pattern 5: Viewability Tracking (IAB/MRC Standard)
**What:** IntersectionObserver inside the ad iframe measures 50% visibility for 1 continuous second, then fires a viewable impression event. Pauses the timer on tab switch (document.hidden) and resumes when visible again.
**When to use:** SERV-07 viewability tracking.
**Source:** IAB Tech Lab OpenVV 2.5.5 spec with IntersectionObserver; MRC Viewable Ad Impression Measurement Guidelines.
**Example:**
```javascript
// Injected into ad HTML by serve-ad
(function() {
  var root = document.getElementById('creative-root');
  if (!root || !window.IntersectionObserver) return;

  var viewTimer = null;
  var fired = false;
  var THRESHOLD = 0.5;  // 50% of pixels
  var DURATION = 1000;  // 1 second continuous

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (fired) return;
      if (entry.isIntersecting && entry.intersectionRatio >= THRESHOLD) {
        if (!viewTimer) {
          viewTimer = setTimeout(function() {
            if (!fired) {
              fired = true;
              new Image().src = 'TRACK_URL?type=impression_viewable&rid=REQUEST_ID&cid=CREATIVE_ID&aid=ADVERTISER_ID&cmpid=CAMPAIGN_ID&cb=' + Date.now();
              observer.disconnect();
            }
          }, DURATION);
        }
      } else {
        if (viewTimer) {
          clearTimeout(viewTimer);
          viewTimer = null;
        }
      }
    });
  }, { threshold: [0, THRESHOLD] });

  observer.observe(root);

  // Pause on tab switch (page visibility)
  document.addEventListener('visibilitychange', function() {
    if (document.hidden && viewTimer) {
      clearTimeout(viewTimer);
      viewTimer = null;
    }
  });
})();
```

### Pattern 6: Atomic Credit Deduction (PostgreSQL Function)
**What:** A PL/pgSQL function that atomically decrements `credit_balance` and returns success/failure. Uses PostgreSQL's implicit row-level lock during UPDATE to prevent concurrent over-deduction.
**When to use:** SERV-04 credit check on every ad request.
**Source:** PostgreSQL UPDATE atomicity -- the `UPDATE...WHERE credit_balance >= 1` pattern acquires an implicit row-level lock, ensuring concurrent transactions wait and re-evaluate the WHERE clause.
**Example:**
```sql
CREATE OR REPLACE FUNCTION public.deduct_impression_credit(p_advertiser_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.advertisers
  SET credit_balance = credit_balance - 1,
      updated_at = now()
  WHERE id = p_advertiser_id
    AND credit_balance >= 1;

  RETURN FOUND;
END;
$$;
```

### Pattern 7: Pre-Rendered HTML Storage
**What:** When a creative is saved in the editor, `buildPreviewHtml()` is called and the resulting HTML string is stored in a new `rendered_html TEXT` column on the `creatives` table. The serve-ad function reads this column directly.
**When to use:** Every creative save operation.
**Why:** Avoids duplicating 14 format renderers into the Edge Function runtime. Guarantees the served ad exactly matches the editor preview. Eliminates runtime dependency on the web app's renderer code.
**Example:**
```typescript
// In editor-page.tsx handleSave, add rendered_html to the upsert payload:
import { generatePreviewHtml } from '@/features/editor/lib/renderer'

const renderedHtml = generatePreviewHtml(config)

await updateCreative.mutateAsync({
  id: editId,
  updates: {
    name: displayName,
    template_data: config as unknown as Json,
    rendered_html: renderedHtml,
    width: selectedSize.width || null,
    height: selectedSize.height || null,
  },
})
```

### Anti-Patterns to Avoid
- **Do NOT return `text/html` from `serve-ad`:** Supabase rewrites `text/html` GET responses to `text/plain` on non-custom-domain projects. Return `application/javascript` instead and create the iframe from JS. This is the standard ad tech pattern.
- **Do NOT read-then-write for credit deduction:** `SELECT credit_balance` followed by `UPDATE SET credit_balance = X - 1` is a classic TOCTOU race condition. Use the atomic `UPDATE ... WHERE credit_balance >= 1` pattern.
- **Do NOT use `document.write` in the ad script:** Modern browsers block synchronous `document.write` from async scripts. Use `createElement('iframe')` + `srcdoc` instead.
- **Do NOT track viewability from the parent page:** The ad script runs on publisher pages we don't control. IntersectionObserver inside the iframe works cross-origin and is self-contained.
- **Do NOT include `anon_key` or `service_role_key` in the ad.js response:** The serve-ad function uses `service_role` server-side. Client-side ad HTML only makes Image pixel requests to tracking endpoints (no Supabase client needed in the browser).
- **Do NOT include `allow-same-origin` in the iframe sandbox:** This would let the iframe script access the parent page's DOM -- a security vulnerability on publisher sites.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UUID generation | Custom ID scheme | `crypto.randomUUID()` | Standard, collision-free, available in both Deno and browsers |
| Viewability measurement | Manual getBoundingClientRect polling | IntersectionObserver API | Native, performant, works cross-origin in iframes, industry standard per IAB |
| Credit race conditions | Application-level locking (Redis, advisory locks) | PostgreSQL atomic `UPDATE...WHERE` | Row-level lock is implicit, no additional services needed |
| Cookie parsing | Custom regex | Simple split on `;` and `=` utility function | Straightforward string parsing; no npm library needed |
| Click redirect chaining | Custom redirect logic | HTTP 302 with Location header + GAM click URL prepend | Standard ad tech pattern, browsers follow redirect chain automatically |
| Ad HTML composition | Re-implementing renderers in Deno | Pre-rendered HTML stored at save time | Renderers already produce self-contained HTML; store the output |
| Event deduplication | Custom dedup logic at write time | Client-side `fired` flag + analytics-time DISTINCT on request_id | Avoids complex unique constraints on partitioned tables |
| 1x1 tracking pixel | Dynamic image generation | Static 43-byte transparent GIF constant | Standard ad tech pixel; same bytes every time |
| Device detection | ua-parser-js or similar library | Simple regex-based categorization | v1 needs only mobile/desktop/tablet + OS + browser; lightweight is fine |

**Key insight:** The ad serving layer is primarily an orchestration problem -- fetching creative data from the database, wrapping it with tracking code, and returning it as JavaScript. The heavy lifting (renderers, CDN storage, event table, tracker configs) is already built in prior phases.

## Common Pitfalls

### Pitfall 1: Supabase text/html Content-Type Restriction
**What goes wrong:** Attempting to serve ad HTML directly from Edge Functions results in `text/plain` response that browsers display as raw text instead of rendering.
**Why it happens:** Supabase rewrites GET responses with `Content-Type: text/html` to `text/plain` on projects without custom domains (confirmed in official docs: "HTML content is only supported with custom domains").
**How to avoid:** Return `Content-Type: application/javascript` from serve-ad. The JavaScript creates an iframe and sets its `srcdoc` attribute with the HTML content. This is the standard ad tech pattern (script tags, not direct HTML).
**Warning signs:** Ad tag loads but shows raw HTML text instead of rendered ad. Browser DevTools showing `Content-Type: text/plain` in response headers.

### Pitfall 2: Credit Deduction Race Condition
**What goes wrong:** Two concurrent ad requests both see `credit_balance = 1`, both serve the ad, balance goes to -1.
**Why it happens:** Read-then-write pattern (`SELECT credit_balance` followed by `UPDATE SET credit_balance = X - 1`) is not atomic under READ COMMITTED isolation (PostgreSQL default).
**How to avoid:** Single `UPDATE ... SET credit_balance = credit_balance - 1 WHERE credit_balance >= 1` is atomic. PostgreSQL acquires an implicit row-level lock during UPDATE. Concurrent transactions wait and re-evaluate the WHERE clause after the lock is released. If `FOUND` is false, no rows were updated (balance was already 0).
**Warning signs:** Negative credit balances in the advertisers table, or ads served after balance should be zero.

### Pitfall 3: Cross-Origin Cookie Handling
**What goes wrong:** The `st_uid` cookie set by the Edge Function is not sent on subsequent requests from publisher pages.
**Why it happens:** The Edge Function domain (`*.supabase.co`) is different from the publisher domain, making this a cross-site cookie.
**How to avoid:** Set `SameSite=None; Secure` on the cookie. This allows cross-site cookie sending over HTTPS. As of 2025-2026, Chrome has NOT deprecated third-party cookies (Google reversed its deprecation plan in July 2024). For browsers that do block third-party cookies (Safari ITP, Firefox ETP), fall back to the session-scoped `request_id` for event linking. Accept graceful degradation for persistent identity.
**Warning signs:** `st_uid` cookie not appearing in subsequent ad requests; every request generating a new UUID.

### Pitfall 4: iframe sandbox Permissions
**What goes wrong:** Ad click-throughs don't work, scripts don't execute inside the iframe, or videos don't autoplay.
**Why it happens:** The `sandbox` attribute is too restrictive by default. Without `allow-scripts`, no JavaScript runs. Without `allow-popups`, click-throughs fail.
**How to avoid:** Use `sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"`. Add `allow="autoplay"` for video formats. Do NOT include `allow-same-origin` (security risk -- would let iframe code access the parent page).
**Warning signs:** Clicks opening within the iframe instead of the main window; scripts not executing; console errors about sandboxed content; video formats failing to play.

### Pitfall 5: Double Impression Counting
**What goes wrong:** Same ad exposure counted as two impressions.
**Why it happens:** Browser retries the tracking pixel request (e.g., after network hiccup), or the ad script re-executes (e.g., React re-render on SPA publisher site).
**How to avoid:** Each ad exposure gets one `request_id`. The impression pixel fires once on ad HTML load. Use a flag variable (`var impressionFired = false`) to prevent re-firing within the iframe. On the analytics side, use `COUNT(DISTINCT request_id)` for impression counting to handle any edge cases.
**Warning signs:** Event counts significantly exceeding ad request counts; duplicate request_ids with same event_type.

### Pitfall 6: Edge Function Cold Start Latency
**What goes wrong:** First ad request after inactivity takes 1-3 seconds, causing slow ad rendering.
**Why it happens:** Supabase Edge Functions have cold start times. The Deno runtime needs to initialize.
**How to avoid:** This is inherent to serverless architecture. For v1, accept the cold start. The 204 (no content) fallback for errors means a slow response still results in a blank ad slot, not a broken publisher page. The `async` attribute on the script tag ensures the publisher page load is not blocked. For v2, consider a custom domain or CDN caching layer.
**Warning signs:** Intermittent slow ad loads, especially after periods of no traffic.

### Pitfall 7: Renderer HTML String Escaping in srcdoc
**What goes wrong:** Ad HTML contains characters that break the JavaScript string or the srcdoc attribute.
**Why it happens:** Renderer HTML contains quotes, backticks, or `</script>` tags that prematurely close the JavaScript string.
**How to avoid:** Use `JSON.stringify()` for the HTML string when embedding in JavaScript (escapes all special characters including quotes, newlines, and backslashes). The existing `buildPreviewHtml()` already escapes `</` to `<\/` in config JSON. Apply the same escaping to the full HTML string.
**Warning signs:** JavaScript syntax errors in browser console when loading the ad tag; partial or broken ad rendering.

### Pitfall 8: Third-Party Tracker Injection Timing
**What goes wrong:** Third-party trackers fire at the wrong time (e.g., on_viewable tracker fires on load instead of after viewability qualification).
**Why it happens:** Incorrect mapping of fire conditions to injection points in the ad HTML.
**How to avoid:** Map fire conditions to specific injection points: `on_load` = `<img>` tag in body (fires with impression pixel), `on_viewable` = callback inside the viewability observer after `fired = true`, `on_click` = additional redirect/pixel in click handler, `on_engagement` = callback after engagement event detection. Query `creative_trackers` joined with `tracker_configs` in serve-ad and inject at the correct positions.
**Warning signs:** Third-party trackers reporting different numbers than internal tracking; tracker pixels appearing in network tab at unexpected times.

## Code Examples

Verified patterns from official sources and codebase analysis:

### Database Migration: credit_balance + rendered_html + deduct function
```sql
-- Source: PostgreSQL atomic UPDATE pattern, Supabase Edge Functions docs
-- Migration: 20260224000001_credit_balance_serving.sql

-- Add credit_balance to advertisers (default 0 = no credits purchased yet)
ALTER TABLE public.advertisers
  ADD COLUMN IF NOT EXISTS credit_balance BIGINT NOT NULL DEFAULT 0;

-- Add rendered_html to creatives (pre-rendered HTML for ad serving)
ALTER TABLE public.creatives
  ADD COLUMN IF NOT EXISTS rendered_html TEXT;

COMMENT ON COLUMN public.creatives.rendered_html IS 'Pre-rendered HTML generated by buildPreviewHtml() at save time. Used by serve-ad Edge Function to avoid duplicating renderer code.';

-- Partial index for fast credit balance lookup during ad serving
CREATE INDEX IF NOT EXISTS idx_advertisers_credit_balance
  ON public.advertisers (id) WHERE credit_balance > 0;

-- Atomic credit deduction function
CREATE OR REPLACE FUNCTION public.deduct_impression_credit(p_advertiser_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.advertisers
  SET credit_balance = credit_balance - 1,
      updated_at = now()
  WHERE id = p_advertiser_id
    AND credit_balance >= 1;

  -- FOUND is true if UPDATE affected at least one row
  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public.deduct_impression_credit IS 'Atomically deducts one impression credit. Returns FALSE if balance is zero (ads should stop serving). Uses implicit row-level lock to prevent concurrent over-deduction.';
```

### Track Event Endpoint (1x1 Pixel Receiver)
```typescript
// supabase/functions/track-event/index.ts
import { createAdminClient } from '../_shared/supabase-admin.ts'
import { parseCookie, extractUtmParams, normalizeDevice } from '../_shared/tracking-utils.ts'

const VALID_EVENTS = new Set([
  'impression_served', 'impression_viewable', 'engagement',
  'click', 'video_play', 'video_pause', 'video_complete',
  'expand', 'collapse', 'close',
])

// Transparent 1x1 GIF (43 bytes) -- standard ad tech tracking pixel
const PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b,
])

const PIXEL_HEADERS = {
  'Content-Type': 'image/gif',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Access-Control-Allow-Origin': '*',
}

Deno.serve(async (req) => {
  // Accept both GET (pixel) and POST (beacon)
  const url = new URL(req.url)
  const eventType = url.searchParams.get('type')
  const requestId = url.searchParams.get('rid')
  const creativeId = url.searchParams.get('cid')
  const advertiserId = url.searchParams.get('aid')
  const campaignId = url.searchParams.get('cmpid')

  // Validate required params -- always return pixel (never break ad rendering)
  if (!eventType || !VALID_EVENTS.has(eventType) || !requestId || !creativeId || !advertiserId) {
    return new Response(PIXEL, { headers: PIXEL_HEADERS })
  }

  // Build extra_data from context
  const extraData: Record<string, string> = {}
  const cookieId = parseCookie(req.headers.get('cookie'), 'st_uid')
  if (cookieId) extraData.cookie_id = cookieId
  const ua = req.headers.get('user-agent')
  if (ua) {
    extraData.user_agent = ua
    const device = normalizeDevice(ua)
    extraData.device_type = device.device_type
    extraData.os = device.os
    extraData.browser = device.browser
  }
  const referer = req.headers.get('referer')
  if (referer) {
    extraData.page_url = referer
    const utms = extractUtmParams(referer)
    Object.assign(extraData, utms)
  }

  // Fire-and-forget insert (don't block pixel response for database latency)
  const admin = createAdminClient()
  admin.from('ad_events').insert({
    event_type: eventType as any,
    request_id: requestId,
    creative_id: creativeId,
    advertiser_id: advertiserId,
    campaign_id: campaignId || null,
    extra_data: extraData,
  }).then(() => {}).catch((err) => {
    console.error('track-event insert error:', err.message)
  })

  return new Response(PIXEL, { headers: PIXEL_HEADERS })
})
```

### Shared Tracking Utilities
```typescript
// supabase/functions/_shared/tracking-utils.ts

export function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null
  const cookies = cookieHeader.split(';')
  for (const cookie of cookies) {
    const [key, ...valueParts] = cookie.trim().split('=')
    if (key === name) return decodeURIComponent(valueParts.join('='))
  }
  return null
}

export function extractUtmParams(referer: string | null): Record<string, string> {
  if (!referer) return {}
  try {
    const url = new URL(referer)
    const params: Record<string, string> = {}
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
      const val = url.searchParams.get(key)
      if (val) params[key] = val
    }
    return params
  } catch {
    return {}
  }
}

export function normalizeDevice(userAgent: string | null): {
  device_type: string
  os: string
  browser: string
} {
  if (!userAgent) return { device_type: 'unknown', os: 'unknown', browser: 'unknown' }

  const ua = userAgent.toLowerCase()

  // Device type (check tablet before mobile since iPad includes "mobile" in some UAs)
  const device_type = /ipad|tablet|kindle/.test(ua) ? 'tablet'
    : /mobile|android|iphone/.test(ua) ? 'mobile'
    : 'desktop'

  // OS
  const os = /android/.test(ua) ? 'android'
    : /iphone|ipad|ios/.test(ua) ? 'ios'
    : /windows/.test(ua) ? 'windows'
    : /mac os|macos/.test(ua) ? 'macos'
    : /linux/.test(ua) ? 'linux'
    : 'other'

  // Browser (order matters: Edge contains "chrome", Chrome contains "safari")
  const browser = /edg/.test(ua) ? 'edge'
    : /chrome/.test(ua) && !/edg/.test(ua) ? 'chrome'
    : /firefox/.test(ua) ? 'firefox'
    : /safari/.test(ua) && !/chrome/.test(ua) ? 'safari'
    : 'other'

  return { device_type, os, browser }
}
```

### Building Ad HTML with Tracking Injected
```typescript
// Helper inside serve-ad/index.ts
function injectTracking(
  creative: CreativeWithAdvertiser,
  requestId: string,
  trackBaseUrl: string,
  clickBaseUrl: string,
  gamClickUrl: string,
): string {
  let html = creative.rendered_html

  // Build impression pixel URL
  const impressionPixel = `<img src="${trackBaseUrl}?type=impression_served&rid=${requestId}&cid=${creative.id}&aid=${creative.advertiser_id}&cmpid=${creative.campaign_id || ''}&cb=${Date.now()}" width="1" height="1" style="position:absolute;left:-9999px" alt="" />`

  // Build viewability script
  const viewabilityScript = buildViewabilityScript(requestId, creative.id, creative.advertiser_id, creative.campaign_id, trackBaseUrl)

  // Rewrite CTA click URLs to go through click-redirect
  const templateData = creative.template_data as Record<string, unknown>
  const ctaUrl = (templateData.ctaUrl as string) || '#'
  const encodedDest = encodeURIComponent(ctaUrl)
  const clickTrackUrl = `${clickBaseUrl}?rid=${requestId}&cid=${creative.id}&aid=${creative.advertiser_id}&cmpid=${creative.campaign_id || ''}&dest=${encodedDest}`
    + (gamClickUrl ? `&click=${encodeURIComponent(gamClickUrl)}` : '')

  // Replace CTA URLs in the rendered HTML
  html = html.replace(
    new RegExp(`href="${escapeRegex(ctaUrl)}"`, 'g'),
    `href="${clickTrackUrl}" target="_top"`
  )

  // Inject impression pixel and viewability script before </body>
  html = html.replace('</body>', `${impressionPixel}\n<script>${viewabilityScript}</script>\n</body>`)

  return html
}
```

### Ad Script Builder (application/javascript response)
```typescript
// Helper inside serve-ad/index.ts
function buildAdScript(
  adHtml: string,
  creativeId: string,
  width: string,
  height: string,
): string {
  // JSON.stringify escapes all special characters (quotes, newlines, backslashes, </script>)
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
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Synchronous `document.write` ad tags | Async script + iframe srcdoc | ~2018+ | Modern browsers block sync document.write from async scripts |
| Flash-based viewability (Moat, IAS) | IntersectionObserver API | 2019+ (OpenVV 2.5.5) | Native browser API, works cross-origin in iframes, no plugins |
| Application-level credit locking | PostgreSQL atomic `UPDATE...WHERE` | Always available | Eliminates race conditions without advisory locks or Redis |
| Third-party cookies for user tracking | Third-party cookies still viable (Chrome reversed deprecation July 2024) | 2024 | `SameSite=None; Secure` continues to work; no urgent migration to Privacy Sandbox needed |
| Server-side ad decision + traditional servers | Edge Functions (serverless at edge) | 2023+ | Low latency, globally distributed, no infrastructure to manage |
| Separate ad serving domain | Same Supabase domain (Edge Functions) | N/A for v1 | Simplifies infrastructure; custom domain upgrade path exists for v2 |

**Deprecated/outdated:**
- `document.write` for ad injection -- blocked by modern browsers in async contexts
- Flash-based viewability -- Flash is dead
- JSONP for cross-origin tracking -- unnecessary with CORS and Image pixel approach
- Chrome third-party cookie deprecation urgency -- Google reversed course in July 2024, confirmed no consent prompt in April 2025

## Open Questions

1. **Content-type rewrite scope on non-custom Supabase domains**
   - What we know: Official docs state only `text/html` GET responses are rewritten to `text/plain`. `application/javascript` is NOT documented as affected.
   - What's unclear: One GitHub discussion (#35627) reported `application/octet-stream` being rewritten, but this may have been a different issue (client-side parsing bug, now fixed in supabase-js PR #1757).
   - Recommendation: Return `application/javascript` from serve-ad. If content-type rewriting is encountered in testing, fall back to base64-encoding the HTML in the JavaScript response and decoding client-side. This is LOW risk but should be verified during implementation.

2. **Renderer HTML availability -- rendered_html column approach**
   - What we know: 14 format renderers exist in `apps/web/src/features/templates/formats/*/renderer.ts`. They export CSS + JS strings. `buildPreviewHtml()` in `renderer-shell.ts` composes a full HTML document.
   - What's unclear: Whether the stored HTML needs to be regenerated when a creative's format renderer is updated (e.g., bug fix to carousel renderer).
   - Recommendation: Store pre-rendered HTML in `creatives.rendered_html`. Add logic to the editor save flow to always regenerate it. For bulk re-rendering after renderer bug fixes, a one-time script or Edge Function can iterate and regenerate. This is vastly simpler than importing the web app's renderer code into the Deno Edge Function runtime.

3. **Third-party tracker injection complexity**
   - What we know: `creative_trackers` table has fire conditions (`on_load`, `on_viewable`, `on_click`, `on_engagement`). Tracker URLs may contain macros like `%%CACHEBUSTER%%`.
   - What's unclear: How many trackers a creative typically has and whether injection order matters.
   - Recommendation: Query `creative_trackers` joined with `tracker_configs` in serve-ad. For `pixel` type: inject `<img>` tag. For `script` type: inject `<script>` tag. Map fire condition to injection point. Replace `%%CACHEBUSTER%%` in tracker URLs with `Date.now()`. Keep injection simple for v1.

4. **Event deduplication at database level**
   - What we know: Each ad exposure has a unique `request_id`. The `ad_events` table has no unique constraint on `(request_id, event_type)`.
   - What's unclear: Whether to add a unique constraint or handle dedup only at query time.
   - Recommendation: For v1, rely on the client-side `fired` flag to prevent double-firing. Adding a unique constraint on a partitioned table requires the constraint columns to include the partition key (`event_timestamp`) or be per-partition, which adds complexity. Deduplication at analytics query time (`COUNT(DISTINCT request_id)`) is simpler and sufficient for v1.

5. **Edge Function cold start impact on ad serving**
   - What we know: Supabase Edge Functions have cold starts. Exact duration varies by region.
   - What's unclear: Typical cold start time in production (reported 1-3s in community, no official SLA).
   - Recommendation: Accept cold starts for v1. The async script tag pattern means the publisher page is never blocked. A blank ad slot during cold start is acceptable. For v2, consider warming strategies or migration to a dedicated serve infrastructure.

## Sources

### Primary (HIGH confidence)
- [Supabase Edge Functions Limits](https://supabase.com/docs/guides/functions/limits) -- CPU time 2s, memory 256MB, **only `text/html` GET responses rewritten to `text/plain`**
- [Supabase Edge Functions Routing](https://supabase.com/docs/guides/functions/http-methods) -- URL patterns, path parameters, GET/POST support
- [Supabase Edge Functions Quickstart](https://supabase.com/docs/guides/functions/quickstart) -- Deployment pattern, `--no-verify-jwt`, function URL format
- Codebase: `supabase/migrations/20260219000000_initial_schema.sql` -- ad_events partitioned table, advertisers table, RLS policies
- Codebase: `supabase/functions/_shared/supabase-admin.ts` -- `createAdminClient()` pattern
- Codebase: `supabase/functions/admin-create-user/index.ts` -- Edge Function request/response pattern
- Codebase: `apps/web/src/features/campaigns/lib/tag-generator.ts` -- tag URL format (`/serve/ad.js?id=&w=&h=&cb=&click=`)
- Codebase: `apps/web/src/features/templates/formats/_shared/renderer-shell.ts` -- `buildPreviewHtml()` HTML composition
- Codebase: `apps/web/src/features/templates/formats/*/renderer.ts` -- 14 format renderers
- Codebase: `supabase/migrations/20260223000001_tracker_tables.sql` -- tracker_configs + creative_trackers tables
- Codebase: `packages/shared/src/database.types.ts` -- TypeScript types for all tables
- Codebase: `apps/web/src/features/editor/pages/editor-page.tsx` -- creative save flow (handleSave)
- [PostgreSQL atomicity for UPDATE](https://on-systems.tech/blog/128-preventing-read-committed-sql-concurrency-errors/) -- `UPDATE...WHERE` acquires implicit row-level lock; concurrent transactions wait and re-evaluate
- [PostgreSQL atomic increment/decrement](https://devpress.csdn.net/postgresql/62f2269c7e66823466184baf.html) -- Using `SET x = x - 1` with WHERE clause is race-condition safe under READ COMMITTED

### Secondary (MEDIUM confidence)
- [IAB/MRC Viewable Ad Impression Guidelines](https://www.iab.com/guidelines/mrc-viewable-impression-guidelines/) -- 50% visible for 1 second (display ads), 50% for 2 seconds (video)
- [IAB Tech Lab OpenVV 2.5.5 with IntersectionObserver](https://iabtechlab.com/open-vv-2-5-5/) -- Industry standard for viewability using IntersectionObserver
- [MDN: IntersectionObserver API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API/Timing_element_visibility) -- Viewability timer pattern documentation
- [AdMonsters: IntersectionObserver for Viewability](https://admonsters.com/ad-ops-decoder-what-intersection-observer/) -- Cross-origin iframe support confirmed
- [Google: Chrome third-party cookies NOT deprecated](https://www.cookieyes.com/blog/google-cookie-deprecation/) -- Google reversed deprecation in July 2024
- [Google: No cookie consent prompt in Chrome](https://www.onetrust.com/blog/google-drops-plans-for-third-party-cookie-choice-prompt-in-chrome/) -- Confirmed April 2025
- [Supabase GitHub Discussion #35627](https://github.com/orgs/supabase/discussions/35627) -- Content-type rewriting discussion; confirms issue is for HTML on non-custom domains
- [Supabase GitHub Discussion #37443](https://github.com/orgs/supabase/discussions/37443) -- HTML serving restriction confirmed; custom domain ($10/mo Pro) as workaround

### Tertiary (LOW confidence)
- Edge Function cold start times -- community reports 1-3s; no official SLA documentation found
- `application/octet-stream` rewriting -- one GitHub report, but likely a different bug (client-side parsing, now fixed)
- Safari ITP / Firefox ETP exact behavior with `SameSite=None` cookies -- known to restrict, but behavior varies by version

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new dependencies; Supabase Edge Functions + PostgreSQL, both already in use with established patterns
- Architecture: HIGH -- `application/javascript` response creating iframe with srcdoc is the standard ad tech pattern; verified compatible with Supabase's `text/html` restriction (only `text/html` is rewritten per official docs)
- Atomic credit deduction: HIGH -- PostgreSQL `UPDATE...WHERE` atomicity confirmed across multiple authoritative sources; row-level locking is implicit and race-condition safe
- Viewability: HIGH -- IntersectionObserver cross-origin iframe support confirmed by IAB Tech Lab (OpenVV 2.5.5), MDN, and AdMonsters
- Identity/cookies: HIGH -- Google reversed Chrome cookie deprecation (July 2024) and confirmed no consent prompt (April 2025); `SameSite=None; Secure` continues working
- Pitfalls: HIGH -- Based on direct codebase analysis, Supabase documented limitations, and ad tech domain knowledge

**Research date:** 2026-02-23
**Valid until:** 2026-03-23 (stable patterns; monitor Supabase Edge Function updates for any content-type policy changes)
