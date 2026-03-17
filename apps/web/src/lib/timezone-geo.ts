export interface TzGeo {
  lat: number
  lng: number
  city: string
  region: string
  country_code: string
}

/**
 * Fetches accurate geo data from the Cloudflare Worker /geo endpoint.
 * Cloudflare populates request.cf with city, region, country, and lat/lng
 * from their built-in IP database — no third-party API, no user permission.
 *
 * Returns null if VITE_CDN_BASE_URL is not set or the request fails.
 *
 * Local dev: set VITE_CDN_BASE_URL=http://localhost:8787 and run
 *   npx wrangler dev workers/preview-worker.js --port 8787
 */
export async function fetchGeo(): Promise<TzGeo | null> {
  const cdnBase = (import.meta.env.VITE_CDN_BASE_URL as string | undefined)?.replace(/\/$/, '')
  if (!cdnBase) return null
  try {
    const res = await fetch(`${cdnBase}/geo`, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return null
    const data = await res.json() as {
      city: string | null
      region: string | null
      country_code: string | null
      latitude: number | null
      longitude: number | null
    }
    if (!data.country_code) return null
    return {
      lat:          data.latitude    ?? 0,
      lng:          data.longitude   ?? 0,
      city:         data.city        ?? '',
      region:       data.region      ?? '',
      country_code: data.country_code,
    }
  } catch {
    return null
  }
}
