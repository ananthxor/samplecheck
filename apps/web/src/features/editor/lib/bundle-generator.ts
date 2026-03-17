/**
 * CDN Bundle Generator
 *
 * Generates a self-executing JavaScript bundle from pre-rendered creative HTML.
 * The bundle is uploaded to Supabase Storage (acting as CDN) at publish time.
 *
 * Architecture:
 *   Publisher page → loads <script src="CDN/[creative-id].js"> → creates sandboxed iframe
 *   → iframe srcdoc contains fully self-contained creative HTML with telemetry baked in
 *
 * Cross-domain tracking works because the tracking URLs are absolute Supabase URLs
 * baked into the rendered HTML by renderer.ts at publish time.
 *
 * CDN abstraction: to swap providers, change VITE_CDN_BASE_URL and re-upload bundles.
 * No other code changes needed.
 */

export interface BundleGeneratorOptions {
  renderedHtml: string
  width: number
  height: number
}

/**
 * Generates a self-executing JS bundle that creates a sandboxed iframe
 * embedding the creative HTML as srcdoc.
 *
 * The `_stAdParams` object (set by the inline tag wrapper) is passed through
 * for GAM macros (click_url, cachebuster, advertising_id).
 */
export function generateCdnBundle({ renderedHtml, width, height }: BundleGeneratorOptions): string {
  const escapedHtml = JSON.stringify(renderedHtml)
  // sc() reads the container's actual rendered width (respects max-width:100% from the
  // embed tag) and scales the iframe down when the available space is narrower than the
  // native ad size — e.g. a 728×90 leaderboard on a 390px mobile viewport.
  // The container height is adjusted too so no white gap appears below the scaled ad.
  return `(function(){
var W=${width},H=${height};
var c=document.currentScript?document.currentScript.parentElement:document.body;
if(!c)return;
var f=document.createElement('iframe');
f.width=W;f.height=H;f.frameBorder='0';f.scrolling='no';
f.style.cssText='border:none;overflow:hidden;display:block;transform-origin:top left;max-width:'+W+'px;max-height:'+H+'px;';
f.setAttribute('sandbox','allow-scripts allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation');
f.allow='autoplay';
f.srcdoc=${escapedHtml};
c.style.overflow='hidden';c.style.maxWidth=W+'px';
c.appendChild(f);
function sc(){var a=c.offsetWidth;if(!a||a>=W){f.style.transform='none';f.width=W;f.height=H;c.style.height=H+'px';return;}var s=a/W;f.style.transform='scale('+s+')';f.width=W;f.height=H;c.style.height=Math.ceil(H*s)+'px';}
sc();
window.addEventListener('resize',sc,{passive:true});
})();`
}

/**
 * Returns the CDN base URL for bundle storage.
 * Defaults to Supabase Storage public URL. Override VITE_CDN_BASE_URL to swap providers.
 */
export function getCdnBaseUrl(): string {
  const explicit = import.meta.env.VITE_CDN_BASE_URL as string | undefined
  if (explicit) return explicit.replace(/\/$/, '')

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
  if (supabaseUrl) return `${supabaseUrl}/storage/v1/object/public/ad-bundles`

  return ''
}

/**
 * Returns the public CDN URL for a creative's bundle file.
 */
export function getBundleUrl(creativeId: string): string {
  return `${getCdnBaseUrl()}/${creativeId}.js`
}
