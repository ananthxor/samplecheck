import { supabase, fireAuthError, ensureFreshSession } from '@/lib/supabase'
import type { AdminUser } from './admin-api'

export interface OrgCreateUserPayload {
  email: string
  password: string
  display_name?: string
}

interface OrgCreateUserResponse {
  user_id: string
  email: string
}

interface OrgListUsersResponse {
  users: AdminUser[]
}

interface OrgResetPasswordResponse {
  success: boolean
  user_id: string
}

async function throwOnFunctionError(data: unknown, error: unknown, fallback: string): Promise<void> {
  if (error) {
    // Try to extract the actual error message from the edge function response body
    const ctx = (error as { context?: Response }).context
    // Detect expired/revoked session → force global sign-out
    if (ctx?.status === 401) fireAuthError()
    if (ctx) {
      try {
        const body = await ctx.json() as { error?: string }
        if (body?.error) {
          if (/unauthorized/i.test(body.error)) fireAuthError()
          throw new Error(body.error)
        }
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message !== 'Failed to execute') throw parseErr
      }
    }
    const msg = (error as Error).message || fallback
    if (/unauthorized/i.test(msg)) fireAuthError()
    throw new Error(msg)
  }
  if (data && typeof data === 'object' && 'error' in data) {
    const msg = (data as { error: string }).error
    if (/unauthorized/i.test(msg)) fireAuthError()
    throw new Error(msg)
  }
}

export async function orgCreateUser(
  payload: OrgCreateUserPayload
): Promise<OrgCreateUserResponse> {
  await ensureFreshSession()
  const { data, error } = await supabase.functions.invoke('org-create-user', {
    body: payload,
  })
  await throwOnFunctionError(data, error, 'Failed to create team member')
  return data as OrgCreateUserResponse
}

export async function orgListUsers(advertiserId?: string | null): Promise<OrgListUsersResponse> {
  await ensureFreshSession()
  const { data, error } = await supabase.functions.invoke('org-list-users', {
    body: { advertiserId: advertiserId ?? null },
  })
  await throwOnFunctionError(data, error, 'Failed to list team members')
  return data as OrgListUsersResponse
}

export async function orgRevokeOtherSessions(): Promise<void> {
  // Delete all DB session records except the current browser's
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const currentId = localStorage.getItem('login_session_id')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any).from('user_login_sessions').delete().eq('user_id', user.id)
    if (currentId) query = query.neq('id', currentId)
    await query
  }
  // Revoke Supabase auth tokens for all other sessions
  const { error } = await supabase.auth.signOut({ scope: 'others' })
  if (error) throw new Error(error.message || 'Failed to revoke sessions')
}

/** Delete a specific session record by id (for per-session revocation). */
export async function deleteLoginSession(sessionId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('user_login_sessions').delete().eq('id', sessionId)
}

/** Returns true if the session record still exists in the DB. */
export async function checkSessionExists(sessionId: string): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('user_login_sessions')
    .select('id')
    .eq('id', sessionId)
    .maybeSingle()
  return !!data
}

// ── Login sessions ─────────────────────────────────────────────────────────

export interface LoginSession {
  id: string
  city: string | null
  region: string | null
  country_code: string | null
  latitude: number | null
  longitude: number | null
  browser: string | null
  os: string | null
  device_type: string | null
  created_at: string
}

export interface RecordLoginSessionPayload {
  city?: string | null
  region?: string | null
  country_code?: string | null
  latitude?: number | null
  longitude?: number | null
  browser?: string
  os?: string
  device_type?: string
}

/** Returns the new session's DB id so the caller can persist it locally. */
export async function recordLoginSession(
  payload: RecordLoginSessionPayload
): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('user_login_sessions')
    .insert({ user_id: user.id, ...payload })
    .select('id')
    .single()
  return (data as { id: string } | null)?.id ?? null
}

export async function fetchLoginSessions(limit = 8): Promise<LoginSession[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('user_login_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as LoginSession[]
}

/** Delete the current browser's login session record (uses stored id, falls back to most recent). */
export async function deleteCurrentLoginSession(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Prefer the id stored at login time for this specific browser tab
  const storedId = localStorage.getItem('login_session_id')
  if (storedId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('user_login_sessions').delete().eq('id', storedId)
    localStorage.removeItem('login_session_id')
    localStorage.removeItem('login_session_expires_at')
    return
  }

  // Fallback: delete the most recent record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('user_login_sessions')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  if (data?.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('user_login_sessions').delete().eq('id', data.id)
  }
  localStorage.removeItem('login_session_expires_at')
}

/**
 * Delete all login session records for the current user older than 12 hours.
 * Called on sign-in to clean up orphaned records from incognito windows or
 * browsers where localStorage was cleared without a proper sign-out.
 */
export async function deleteStaleLoginSessions(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('user_login_sessions')
    .delete()
    .eq('user_id', user.id)
    .lt('created_at', twelveHoursAgo)
}

export async function orgUpdateDisplayName(displayName: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('update_display_name', {
    p_display_name: displayName,
  })
  if (error) throw new Error(error.message || 'Failed to update display name')
}

export async function orgUpdateOrgProfile(
  advertiserId: string,
  name: string,
  contactEmail: string
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('update_org_profile', {
    p_advertiser_id: advertiserId,
    p_name: name,
    p_contact_email: contactEmail,
  })
  if (error) throw new Error(error.message || 'Failed to update organization')
}

export async function orgSetUserStatus(
  profileId: string,
  status: 'active' | 'inactive'
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('set_user_status', {
    p_profile_id: profileId,
    p_status: status,
  })
  if (error) throw new Error(error.message || 'Failed to update user status')
}

export async function orgResetPassword(
  userId: string,
  newPassword: string
): Promise<OrgResetPasswordResponse> {
  await ensureFreshSession()
  const { data, error } = await supabase.functions.invoke('org-reset-password', {
    body: { user_id: userId, new_password: newPassword },
  })
  await throwOnFunctionError(data, error, 'Failed to reset password')
  return data as OrgResetPasswordResponse
}
