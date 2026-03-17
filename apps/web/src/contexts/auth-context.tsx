import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { User } from '@supabase/supabase-js'
import type { Tables } from '@scrolltoday/shared'
import { supabase } from '@/lib/supabase'
import { recordLoginSession, deleteCurrentLoginSession, deleteStaleLoginSessions, checkSessionExists } from '@/features/admin/api/org-api'
import { fetchGeo } from '@/lib/timezone-geo'

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000 // 12 hours
const MFA_TRUST_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const MFA_TRUST_KEY = 'mfa_trusted_until'

function isMfaDeviceTrusted(): boolean {
  const raw = localStorage.getItem(MFA_TRUST_KEY)
  if (!raw) return false
  return Date.now() < Number(raw)
}

function setMfaDeviceTrust() {
  localStorage.setItem(MFA_TRUST_KEY, String(Date.now() + MFA_TRUST_DURATION_MS))
}

function clearMfaDeviceTrust() {
  localStorage.removeItem(MFA_TRUST_KEY)
}

function detectClientDevice() {
  const ua = navigator.userAgent
  let browser = 'Unknown'
  if (ua.includes('Edg/'))                                    browser = 'Microsoft Edge'
  else if (ua.includes('OPR/') || ua.includes('Opera/'))     browser = 'Opera'
  else if (ua.includes('Firefox/'))                          browser = 'Firefox'
  else if (ua.includes('Chrome/'))                           browser = 'Chrome'
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari'

  let os = 'Unknown'
  if (/Windows NT 10/.test(ua))        os = 'Windows 11/10'
  else if (/Windows NT 6\.1/.test(ua)) os = 'Windows 7'
  else if (/Windows/.test(ua))         os = 'Windows'
  else if (/iPhone/.test(ua))          os = 'iOS (iPhone)'
  else if (/iPad/.test(ua))            os = 'iOS (iPad)'
  else if (/Android/.test(ua))         os = 'Android'
  else if (/Mac OS X/.test(ua))        os = 'macOS'
  else if (/Linux/.test(ua))           os = 'Linux'

  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua)
  return { browser, os, device_type: isMobile ? 'mobile' : 'desktop' }
}

export type UserProfile = Tables<'user_profiles'> & {
  advertisers?: {
    name: string
    contact_email: string | null
    credit_balance: number
  } | null
}

interface AuthState {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  isAdmin: boolean
  isOrgAdmin: boolean
  mustChangePassword: boolean
  /** True when user has MFA enrolled but current session is only AAL1 (needs TOTP verification). */
  mfaRequired: boolean
  /** The org the user is currently operating as. Only super_admin can change it. */
  activeAdvertiserId: string | null
  /** All advertisers — only populated for super_admin. */
  advertisers: { id: string; name: string }[]
  /** Set when a user is signed out because their advertiser account was deactivated. */
  deactivatedError: string | null
}

interface AuthContextType extends AuthState {
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updatePassword: (
    newPassword: string
  ) => Promise<{ error: Error | null }>
  /** Verify a TOTP code during the MFA challenge step after login. */
  verifyMfa: (code: string, rememberDevice?: boolean) => Promise<{ error: Error | null }>
  setActiveAdvertiserId: (id: string | null) => void
  clearDeactivatedError: () => void
  /** Resolved org for data queries. Super admin: activeAdvertiserId. Others: profile.advertiser_id. */
  effectiveAdvertiserId: string | null
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    isAdmin: false,
    isOrgAdmin: false,
    mustChangePassword: false,
    mfaRequired: false,
    activeAdvertiserId: null,
    advertisers: [],
    deactivatedError: null,
  })

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*, advertisers(name, contact_email, credit_balance)')
      .eq('auth_user_id', userId)
      .single()

    if (error) {
      console.error('Failed to fetch user profile:', error.message)
      setState((prev) => ({ ...prev, isLoading: false }))
      return
    }

    // Non-super-admins: check if their advertiser account is still active.
    // This handles the case where a user is already logged in and an admin
    // deactivates their org — they will be signed out on next profile fetch.
    if (data.role !== 'super_admin' && data.advertiser_id) {
      const { data: advertiser } = await supabase
        .from('advertisers')
        .select('status')
        .eq('id', data.advertiser_id)
        .single()

      if ((advertiser as { status: string } | null)?.status === 'inactive') {
        const msg = 'Your account has been deactivated. Please contact your administrator.'
        setState((prev) => ({ ...prev, isLoading: false, deactivatedError: msg }))
        await supabase.auth.signOut({ scope: 'local' })
        return
      }
    }

    // Super admins have no advertiser_id by design.
    // Auto-assign the first advertiser so they can use the full platform
    // (create creatives, upload images, etc.) without any restrictions.
    // org_admin and advertiser always have an advertiser_id — no auto-assign needed.
    let profile = data
    let advertisersList: { id: string; name: string }[] = []

    if (data.role === 'super_admin') {
      // Load all advertisers for the org picker
      const { data: advertisers } = await supabase
        .from('advertisers')
        .select('id, name')
        .order('name')

      if (advertisers && advertisers.length > 0) {
        advertisersList = advertisers
        // Auto-assign first advertiser as home org if none set
        if (!data.advertiser_id) {
          profile = { ...data, advertiser_id: advertisers[0]!.id }
        }
      }
    }

    setState((prev) => ({
      ...prev,
      profile,
      isAdmin: profile.role === 'super_admin',
      isOrgAdmin: (profile.role as string) === 'org_admin',
      mustChangePassword: profile.must_change_password,
      isLoading: false,
      activeAdvertiserId: profile.advertiser_id ?? null,
      advertisers: advertisersList,
    }))
  }, [])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setState((prev) => ({
          ...prev,
          user: session.user,
        }))
        // Dispatch async profile fetch outside the callback to avoid deadlock
        // (Supabase Pitfall 3: no async work inside onAuthStateChange)
        setTimeout(() => {
          void fetchProfile(session.user.id)
        }, 0)
      } else {
        setState((prev) => ({
          user: null,
          profile: null,
          isLoading: false,
          isAdmin: false,
          isOrgAdmin: false,
          mustChangePassword: false,
          mfaRequired: false,
          activeAdvertiserId: null,
          advertisers: [],
          // Preserve deactivatedError so the login page can still show it
          deactivatedError: prev.deactivatedError ?? null,
        }))
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  // Listen for auth errors from API calls (e.g. 401 from expired JWT).
  // Verify the session server-side before taking any drastic action.
  useEffect(() => {
    let handling = false
    const handleAuthError = async () => {
      if (handling) return // prevent concurrent handling
      handling = true
      try {
        // 1. Check if the session is actually valid server-side
        const { error: userError } = await supabase.auth.getUser()
        if (!userError) {
          // Session is valid — the 401 was a transient/edge-function issue.
          // Just refresh to get a new access token for subsequent calls.
          await supabase.auth.refreshSession()
          return
        }

        // 2. Token invalid — try refreshing
        const { error: refreshError } = await supabase.auth.refreshSession()
        if (!refreshError) return // Refresh succeeded, session restored

        // 3. Both getUser and refresh failed — session is truly dead
        void deleteCurrentLoginSession().catch(() => {/* ignore */})
        void supabase.auth.signOut({ scope: 'local' })
      } catch {
        // Network error — do NOT sign out, let user retry
        console.warn('[auth] Network error during auth recovery, keeping session')
      } finally {
        handling = false
      }
    }
    window.addEventListener('supabase:auth-error', handleAuthError)
    return () => window.removeEventListener('supabase:auth-error', handleAuthError)
  }, [])

  // Check 12-hour session expiry on login and every minute thereafter.
  // This handles incognito mode: if the user closes the incognito window without
  // signing out, the next time they open a normal session the stale DB record is
  // already cleaned up by deleteStaleLoginSessions() above. But if the SAME
  // browser keeps running past 12 hours, we force sign-out here.
  useEffect(() => {
    if (!state.user) return

    const checkSession = async () => {
      // 1. Check 12-hour expiry
      const expiresAt = localStorage.getItem('login_session_expires_at')
      if (expiresAt && Date.now() > Number(expiresAt)) {
        void deleteCurrentLoginSession().catch(() => {/* ignore */})
        void supabase.auth.signOut({ scope: 'local' })
        return
      }
      // 2. Check if this session was remotely revoked (DB record deleted)
      const sessionId = localStorage.getItem('login_session_id')
      if (sessionId) {
        const exists = await checkSessionExists(sessionId)
        if (!exists) {
          localStorage.removeItem('login_session_id')
          localStorage.removeItem('login_session_expires_at')
          void supabase.auth.signOut({ scope: 'local' })
        }
      }
    }

    void checkSession()
    const interval = setInterval(() => void checkSession(), 60_000)
    return () => clearInterval(interval)
  }, [state.user])

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: Error | null }> => {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        return { error: new Error(error.message) }
      }

      // For non-super-admin users, check if their advertiser is active before
      // allowing access.
      if (authData.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role, advertiser_id')
          .eq('auth_user_id', authData.user.id)
          .single()

        if (profile && profile.role !== 'super_admin') {
          // Check user-level status
          if ((profile as { status?: string }).status === 'inactive') {
            await supabase.auth.signOut({ scope: 'local' })
            return {
              error: new Error(
                'Your account has been deactivated. Please contact your administrator.'
              ),
            }
          }

          // Check org-level status
          if (profile.advertiser_id) {
            const { data: advertiser } = await supabase
              .from('advertisers')
              .select('status')
              .eq('id', profile.advertiser_id)
              .single()

            if ((advertiser as { status: string } | null)?.status === 'inactive') {
              await supabase.auth.signOut({ scope: 'local' })
              return {
                error: new Error(
                  'Your account has been deactivated. Please contact your administrator.'
                ),
              }
            }
          }
        }
      }

      // Check if user has MFA enrolled — if so, mark mfaRequired and defer session recording.
      // Skip if this device is trusted (user previously chose "Remember this device").
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aal && aal.currentLevel === 'aal1' && aal.nextLevel === 'aal2') {
        if (isMfaDeviceTrusted()) {
          // Device trusted — skip TOTP challenge, let user through at AAL1
        } else {
          setState((prev) => ({ ...prev, mfaRequired: true }))
          return { error: null }
        }
      }

      // Clean up orphaned sessions from incognito/cleared-browser logins — fire-and-forget
      void deleteStaleLoginSessions().catch(() => {/* ignore */})

      // Record login session with device + geo info — fire-and-forget, never blocks sign-in
      void (async () => {
        try {
          const device = detectClientDevice()
          // Cloudflare /geo endpoint — accurate city-level data from request.cf
          // Falls back to timezone-based lookup if CDN is not configured
          const geo = await fetchGeo()
          const geoPayload = geo ? {
            city:         geo.city,
            region:       geo.region,
            country_code: geo.country_code,
            latitude:     geo.lat,
            longitude:    geo.lng,
          } : {}
          const sessionId = await recordLoginSession({ ...geoPayload, ...device } as Parameters<typeof recordLoginSession>[0])
          if (sessionId) {
            localStorage.setItem('login_session_id', sessionId)
            localStorage.setItem('login_session_expires_at', String(Date.now() + SESSION_DURATION_MS))
          }
        } catch { /* silently ignore */ }
      })()

      return { error: null }
    },
    []
  )

  const signOut = useCallback(async () => {
    // Remove the current session record before signing out (while auth is still valid)
    await deleteCurrentLoginSession().catch(() => {/* ignore */})
    // Clear MFA device trust so next login on this device requires TOTP again
    clearMfaDeviceTrust()
    // scope: 'local' — only sign out THIS device/browser.
    // Default 'global' revokes ALL sessions server-side, which would
    // invalidate other desktops/devices that are independently logged in.
    await supabase.auth.signOut({ scope: 'local' })
  }, [])

  const clearDeactivatedError = useCallback(() => {
    setState((prev) => ({ ...prev, deactivatedError: null }))
  }, [])

  const updatePassword = useCallback(
    async (newPassword: string): Promise<{ error: Error | null }> => {
      // 1. Clear the DB flag FIRST — before updating the auth password.
      //    supabase.auth.updateUser triggers a USER_UPDATED event which re-fetches
      //    the profile. If the flag is still true in DB at that point, the re-fetch
      //    overwrites local state back to true, trapping the user on the change-
      //    password page.
      if (state.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({ must_change_password: false })
          .eq('auth_user_id', state.user.id)

        if (profileError) {
          console.error(
            'Failed to clear must_change_password flag:',
            profileError.message
          )
        }
      }

      // 2. Update the auth password (this fires onAuthStateChange → fetchProfile,
      //    which will now read must_change_password: false from the DB).
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        // Rollback: re-set the flag since the password wasn't actually changed
        if (state.user) {
          await supabase
            .from('user_profiles')
            .update({ must_change_password: true })
            .eq('auth_user_id', state.user.id)
        }
        return { error: new Error(updateError.message) }
      }

      // 3. Update local state immediately
      setState((prev) => ({
        ...prev,
        mustChangePassword: false,
        profile: prev.profile
          ? { ...prev.profile, must_change_password: false }
          : null,
      }))

      return { error: null }
    },
    [state.user]
  )

  const verifyMfa = useCallback(
    async (code: string, rememberDevice = false): Promise<{ error: Error | null }> => {
      try {
        // Get the user's TOTP factor
        const { data: factors, error: listErr } = await supabase.auth.mfa.listFactors()
        if (listErr || !factors) return { error: new Error(listErr?.message ?? 'Failed to list factors') }

        const totpFactor = factors.totp.find(f => f.status === 'verified')
        if (!totpFactor) return { error: new Error('No verified TOTP factor found') }

        // Challenge
        const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({
          factorId: totpFactor.id,
        })
        if (challengeErr || !challenge) return { error: new Error(challengeErr?.message ?? 'MFA challenge failed') }

        // Verify
        const { error: verifyErr } = await supabase.auth.mfa.verify({
          factorId: totpFactor.id,
          challengeId: challenge.id,
          code,
        })
        if (verifyErr) return { error: new Error(verifyErr.message) }

        // MFA verified — clear the flag and optionally trust this device for 7 days
        setState((prev) => ({ ...prev, mfaRequired: false }))
        if (rememberDevice) {
          setMfaDeviceTrust()
        }

        // Now record the login session (deferred from signIn)
        void deleteStaleLoginSessions().catch(() => {/* ignore */})
        void (async () => {
          try {
            const device = detectClientDevice()
            const geo = await fetchGeo()
            const geoPayload = geo ? {
              city:         geo.city,
              region:       geo.region,
              country_code: geo.country_code,
              latitude:     geo.lat,
              longitude:    geo.lng,
            } : {}
            const sessionId = await recordLoginSession({ ...geoPayload, ...device } as Parameters<typeof recordLoginSession>[0])
            if (sessionId) {
              localStorage.setItem('login_session_id', sessionId)
              localStorage.setItem('login_session_expires_at', String(Date.now() + SESSION_DURATION_MS))
            }
          } catch { /* silently ignore */ }
        })()

        return { error: null }
      } catch (err) {
        return { error: err instanceof Error ? err : new Error('MFA verification failed') }
      }
    },
    []
  )

  const setActiveAdvertiserId = useCallback((id: string | null) => {
    setState((prev) => {
      if (prev.profile?.role !== 'super_admin') return prev
      return { ...prev, activeAdvertiserId: id }
    })
  }, [])

  const effectiveAdvertiserId = state.isAdmin
    ? state.activeAdvertiserId
    : (state.profile?.advertiser_id ?? null)

  const value: AuthContextType = {
    ...state,
    signIn,
    signOut,
    updatePassword,
    verifyMfa,
    setActiveAdvertiserId,
    clearDeactivatedError,
    effectiveAdvertiserId,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
