import { createClient } from '@supabase/supabase-js'
import type { Database } from '@scrolltoday/shared'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Copy .env.example to .env.development and fill in your Supabase credentials.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

/**
 * Dispatch when an API call receives a 401/Unauthorized, signalling the
 * session is no longer valid (e.g. signed out on another device).
 * AuthProvider listens for this and forces a sign-out.
 */
export function fireAuthError(): void {
  window.dispatchEvent(new CustomEvent('supabase:auth-error'))
}

/**
 * Ensure the access token is server-validated before calling edge functions.
 *
 * `supabase.functions.invoke()` sends the current access token but does NOT
 * auto-refresh it like DB/auth calls do. If the JWT has expired (1 hour),
 * the Supabase gateway rejects it with `{"code":401,"message":"Invalid JWT"}`
 * before the function code even runs.
 *
 * `getUser()` makes a server call to validate the token. If it fails, we
 * force a refresh to get a new valid token.
 */
export async function ensureFreshSession(): Promise<void> {
  const { data: { session: localSession } } = await supabase.auth.getSession()
  if (!localSession) return

  // Validate token against the server
  const { error: userError } = await supabase.auth.getUser()

  if (userError) {
    // Token is invalid server-side — try to refresh
    await supabase.auth.refreshSession()
  }
}
