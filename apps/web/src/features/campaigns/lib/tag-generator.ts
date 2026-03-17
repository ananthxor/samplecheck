// ---------------------------------------------------------------------------
// Tag Generation Utilities
// ---------------------------------------------------------------------------
// Pure functions for generating DFP/GAM and embed ad tags from creative data.
// No external dependencies -- all string generation.
// ---------------------------------------------------------------------------

import type { PlatformConfig } from './platform-macros'

export interface TagGeneratorInput {
  creativeId: string
  width: number
  height: number
  serveBaseUrl: string // From VITE_SERVE_BASE_URL env var or window.location.origin fallback
}

export interface CdnTagInput {
  bundleUrl: string // Public CDN URL of the pre-built JS bundle
  creativeId: string
  width: number
  height: number
}

/**
 * Returns the serve base URL from environment or falls back to window.location.origin.
 */
export function getServeBaseUrl(): string {
  return import.meta.env.VITE_SERVE_BASE_URL || window.location.origin
}

/**
 * Generate a DFP/GAM-compatible third-party ad tag.
 *
 * Uses standard GAM macros (CASE-SENSITIVE):
 * - %%CACHEBUSTER%%     : Random number to prevent browser caching
 * - %%CLICK_URL_ESC%%   : Escaped click tracking URL (for URL parameters)
 *
 * Uses modern async <script> pattern (not synchronous document.write).
 */
export function generateDfpTag(input: TagGeneratorInput): string {
  const { creativeId, width, height, serveBaseUrl } = input

  return `<!-- ScrollToday Ad Tag - DFP/GAM Compatible -->
<ins class="scrolltoday-ad"
  data-creative-id="${creativeId}"
  data-width="${width}"
  data-height="${height}"
  style="display:inline-block;width:${width}px;height:${height}px;">
</ins>
<script type="text/javascript"
  src="${serveBaseUrl}/serve-ad?id=${creativeId}&w=${width}&h=${height}&cb=%%CACHEBUSTER%%&click=%%CLICK_URL_ESC%%">
</script>`
}

/**
 * Generate a CDN-hosted ad tag for GAM and any publisher placement.
 *
 * The bundle is pre-built and self-contained — no server roundtrip on serve.
 * Tracking, viewability, and click measurement are all baked into the bundle.
 *
 * GAM macros supported via _stAdParams:
 *   %%CLICK_URL_UNESC%%   : Unescaped click tracking URL from GAM
 *   %%CACHEBUSTER%%       : Cache-busting random number from GAM
 */
export function generateCdnTag(input: CdnTagInput): string {
  const { bundleUrl, creativeId, width: _width, height: _height } = input

  return `<!-- ScrollToday CDN Ad Tag - Self-Contained, Works From Any Domain -->
<div id="st-cdn-${creativeId}" style="width:100%;overflow:hidden;display:block;">
<script id="st-${creativeId}">
var _stAdParams={click_url:"%%CLICK_URL_UNESC%%",cachebuster:"%%CACHEBUSTER%%"};
(function(){
  var s=document.createElement("script");
  s.type="text/javascript";
  s.async=true;
  var _cb=(_stAdParams&&_stAdParams.cachebuster&&String(_stAdParams.cachebuster).indexOf('%%')===-1)?_stAdParams.cachebuster:Date.now();
  s.src="${bundleUrl}?cb="+_cb;
  var p=document.getElementById("st-cdn-${creativeId}");
  if(p){p.appendChild(s);}else{document.body.appendChild(s);}
})();
</script>
</div>`
}

/**
 * Generate a platform-specific CDN ad tag.
 *
 * Identical structure to `generateCdnTag` but serialises the given platform's
 * macro placeholders into `_stAdParams`. The ad platform replaces these
 * placeholders at serve time.
 */
export function generatePlatformTag(input: CdnTagInput, platform: PlatformConfig): string {
  const { bundleUrl, creativeId } = input

  // Serialise all macro key/value pairs into the _stAdParams object literal
  const params = Object.entries(platform.macros)
    .map(([key, value]) => `${key}:"${value}"`)
    .join(',')

  return `<div id="st-cdn-${creativeId}" style="width:100%;overflow:hidden;display:block;">` +
    `<script id="st-${creativeId}">` +
    `var _stAdParams={${params}};` +
    `(function(){` +
    `var s=document.createElement("script");` +
    `s.type="text/javascript";` +
    `s.async=true;` +
    `var _cb=(_stAdParams&&_stAdParams.cachebuster&&String(_stAdParams.cachebuster).indexOf('%%')===-1)?_stAdParams.cachebuster:Date.now();` +
    `s.src="${bundleUrl}?cb="+_cb;` +
    `var p=document.getElementById("st-cdn-${creativeId}");` +
    `if(p){p.appendChild(s);}else{document.body.appendChild(s);}` +
    `})();` +
    `</script>` +
    `</div>`
}

/**
 * Generate a self-contained embed tag for direct publisher placement.
 *
 * Uses async script loading with Date.now() cachebuster.
 * Includes <noscript> fallback with static image.
 */
export function generateEmbedTag(input: TagGeneratorInput): string {
  const { creativeId, width, height, serveBaseUrl } = input

  return `<!-- ScrollToday Ad - Direct Embed -->
<div id="st-ad-${creativeId}" style="width:${width}px;height:${height}px;overflow:hidden;">
  <script>
    (function(){
      var d=document,s=d.createElement('script');
      s.async=true;
      s.src='${serveBaseUrl}/serve-ad?id=${creativeId}&w=${width}&h=${height}&cb='+Date.now();
      d.getElementById('st-ad-${creativeId}').appendChild(s);
    })();
  </script>
  <noscript>
    <a href="${serveBaseUrl}/serve/fallback?id=${creativeId}">
      <img src="${serveBaseUrl}/serve/fallback?id=${creativeId}&w=${width}&h=${height}" width="${width}" height="${height}" alt="Ad" />
    </a>
  </noscript>
</div>`
}
