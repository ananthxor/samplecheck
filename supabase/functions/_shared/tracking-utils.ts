/**
 * Shared tracking utilities for ad serving Edge Functions.
 *
 * Provides cookie parsing, UTM parameter extraction, and device normalization.
 * Used by serve-ad, track-event, and click-redirect Edge Functions.
 *
 * Deno-compatible TypeScript -- no npm imports.
 */

/**
 * Parses a specific cookie value from a Cookie header string.
 *
 * @param cookieHeader - The raw Cookie header value (e.g., "st_uid=abc; other=xyz")
 * @param name - The cookie name to find
 * @returns The decoded cookie value, or null if not found
 */
export function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null
  const cookies = cookieHeader.split(';')
  for (const cookie of cookies) {
    const [key, ...valueParts] = cookie.trim().split('=')
    if (key === name) return decodeURIComponent(valueParts.join('='))
  }
  return null
}

/**
 * Extracts UTM parameters from a referer URL.
 *
 * Looks for: utm_source, utm_medium, utm_campaign, utm_content, utm_term.
 * Returns an empty object if the referer is null or cannot be parsed as a URL.
 *
 * @param referer - The Referer header value
 * @returns An object with found UTM parameters (keys without values are omitted)
 */
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

/**
 * Normalizes a User-Agent string into device type, OS, and browser categories.
 *
 * Uses simple regex-based categorization (no heavy parsing library).
 * Sufficient for v1 analytics grouping.
 *
 * Device type priority: tablet > mobile > desktop
 * Browser priority: edge > chrome > firefox > safari > other
 *
 * @param userAgent - The User-Agent header value
 * @returns Categorized device info, or all 'unknown' for null input
 */
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
