# Phase 2: Authentication & Admin - Research

**Researched:** 2026-02-19
**Domain:** Supabase Auth (invite-only), Edge Functions (admin API), React Router v7 (protected routes), session management
**Confidence:** HIGH

## Summary

Phase 2 implements an invite-only authentication system where a super admin creates user accounts via a Supabase Edge Function, users log in with email/password, sessions persist across browser refresh, and both admin and user can manage passwords. The existing Phase 1 schema already contains the `user_profiles` table with `role` (super_admin/advertiser), `must_change_password` flag, and `advertiser_id` FK -- plus the helper functions `is_super_admin()` and `get_user_advertiser_id()` used in RLS policies. The auth infrastructure is therefore half-built; Phase 2 wires it into a working system.

The critical architecture decision is that admin user management (createUser, listUsers, updateUserById, deleteUser) requires the `service_role` key, which must NEVER be exposed in the browser. All admin operations must flow through Supabase Edge Functions that hold the service_role key server-side. The frontend calls these Edge Functions via `supabase.functions.invoke()`. User-facing operations (signInWithPassword, updateUser for password change, signOut) use the standard client-side Supabase Auth API with the anon key.

Session persistence is handled automatically by Supabase's client library -- `persistSession: true` (already configured in the existing `supabase.ts` singleton) stores the session in localStorage with automatic token refresh. The `onAuthStateChange` listener provides reactive auth state updates. The recommended pattern for 2025/2026 uses `getClaims()` for fast local JWT validation rather than the older `getSession()` approach.

**Primary recommendation:** Use Supabase Edge Functions for all admin operations (user CRUD), React Router v7 with `createBrowserRouter` for protected routes, a React Context-based `AuthProvider` for auth state management, and the existing `user_profiles.must_change_password` flag to enforce first-login password change.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | Super admin can create user accounts for verified advertisers | Edge Function using `auth.admin.createUser()` with service_role key; creates auth user + advertiser + user_profile atomically |
| AUTH-02 | Super admin can view and manage all user accounts | Edge Function using `auth.admin.listUsers()` for auth users + query user_profiles/advertisers via service_role client; RLS already grants super_admin full access |
| AUTH-03 | User can log in with email/password provided by admin | `supabase.auth.signInWithPassword()` client-side; admin creates user with `email_confirm: true` so no verification email needed |
| AUTH-04 | User session persists across browser refresh | Already configured: `persistSession: true` in Supabase client; `onAuthStateChange` with `INITIAL_SESSION` event restores session from localStorage on mount |
| AUTH-05 | User can change password on first login and anytime after | First login: check `user_profiles.must_change_password` flag, force redirect to change-password page; anytime: `supabase.auth.updateUser({ password })` client-side |
| AUTH-06 | Super admin can reset a user's password | Edge Function using `auth.admin.updateUserById(uid, { password })` with service_role key |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2 (installed) | Client-side auth (signIn, signOut, updateUser, getClaims, onAuthStateChange) | Already installed; provides typed auth API with session persistence |
| Supabase Edge Functions | Deno runtime | Server-side admin operations (createUser, listUsers, updateUserById) | Only way to use service_role key safely; globally distributed |
| react-router | ^7.13.0 | Client-side routing with protected routes, loaders, auth guards | Current stable; unified package (no separate react-router-dom needed in v7) |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-router (already above) | ^7.13.0 | createBrowserRouter, RouterProvider, Outlet, Navigate | Route tree, layout routes, redirects |
| @supabase/supabase-js/cors | ^2.95.0+ | CORS headers for Edge Functions | Import in every Edge Function for browser invocation |
| sonner | ^2 | Toast notifications for auth feedback | Login errors, password change success, admin actions feedback |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Edge Functions for admin | Supabase Database Functions (RPC) | DB functions can't call auth.admin API; Edge Functions can use the full supabase-js admin API |
| React Context for auth state | Zustand auth store | Context is simpler for auth (binary logged-in/out state); Zustand better for complex editor state (Phase 4) |
| react-router v7 | TanStack Router | TanStack Router is type-safe but adds another dependency; react-router is the ecosystem standard and sufficient |
| getClaims() for JWT validation | getSession() | getSession() is deprecated for security-critical checks; getClaims() validates JWT signature locally |

**Installation:**
```bash
cd apps/web && pnpm add react-router sonner
```

## Architecture Patterns

### Recommended Project Structure (Phase 2 additions)

```
scrolltoday/
├── supabase/
│   ├── functions/
│   │   ├── _shared/
│   │   │   ├── cors.ts           # CORS headers (or import from SDK)
│   │   │   └── supabase-admin.ts # Admin client singleton with service_role
│   │   ├── admin-create-user/
│   │   │   └── index.ts          # POST: create auth user + advertiser + profile
│   │   ├── admin-list-users/
│   │   │   └── index.ts          # GET: list all users with profiles
│   │   ├── admin-update-user/
│   │   │   └── index.ts          # PUT: update user details
│   │   ├── admin-reset-password/
│   │   │   └── index.ts          # POST: reset user password
│   │   └── admin-delete-user/
│   │       └── index.ts          # DELETE: remove user account
│   └── migrations/
│       └── 20260219000002_auth_enhancements.sql  # Any schema additions
├── apps/web/src/
│   ├── lib/
│   │   └── supabase.ts           # Existing singleton (unchanged)
│   ├── contexts/
│   │   └── auth-context.tsx      # AuthProvider with session + profile state
│   ├── hooks/
│   │   └── use-auth.ts           # useAuth hook (convenience wrapper)
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── login-form.tsx
│   │   │   │   ├── change-password-form.tsx
│   │   │   │   └── protected-route.tsx
│   │   │   ├── pages/
│   │   │   │   ├── login-page.tsx
│   │   │   │   └── change-password-page.tsx
│   │   │   └── api/
│   │   │       └── auth-api.ts   # Client-side auth calls
│   │   └── admin/
│   │       ├── components/
│   │       │   ├── user-list.tsx
│   │       │   ├── create-user-form.tsx
│   │       │   └── reset-password-dialog.tsx
│   │       ├── pages/
│   │       │   └── admin-users-page.tsx
│   │       └── api/
│   │           └── admin-api.ts  # Edge Function invocations
│   ├── router.tsx                # createBrowserRouter route tree
│   └── App.tsx                   # RouterProvider + AuthProvider
```

### Pattern 1: Edge Function with Admin Client (Server-Side User Creation)

**What:** An Edge Function that uses the service_role key to create users via the admin API, then inserts related records into the database.
**When to use:** Any admin operation that requires the auth.admin API (createUser, listUsers, updateUserById, deleteUser).
**Why Edge Functions:** The service_role key MUST stay server-side. Edge Functions have access to `SUPABASE_SERVICE_ROLE_KEY` as a built-in environment variable.

```typescript
// supabase/functions/admin-create-user/index.ts
// Source: Supabase Edge Functions docs + auth.admin.createUser API reference
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the caller is authenticated and is a super admin
    const authHeader = req.headers.get('Authorization')!

    // Create admin client with service_role (DO NOT pass authHeader)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify caller is super admin by checking their JWT
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) throw new Error('Unauthorized')

    const { data: callerProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('auth_user_id', caller.id)
      .single()
    if (callerProfile?.role !== 'super_admin') throw new Error('Forbidden: admin only')

    // Parse request body
    const { email, password, display_name, advertiser_name } = await req.json()

    // Step 1: Create auth user (email auto-confirmed, no verification email sent)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createError) throw createError

    // Step 2: Create advertiser record
    const { data: advertiser, error: advError } = await supabaseAdmin
      .from('advertisers')
      .insert({ name: advertiser_name, contact_email: email })
      .select()
      .single()
    if (advError) throw advError

    // Step 3: Create user_profile linking auth user to advertiser
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        auth_user_id: newUser.user.id,
        advertiser_id: advertiser.id,
        role: 'advertiser',
        display_name: display_name || null,
        must_change_password: true,
      })
    if (profileError) throw profileError

    return new Response(
      JSON.stringify({ user_id: newUser.user.id, advertiser_id: advertiser.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
```

### Pattern 2: AuthProvider with onAuthStateChange (Client-Side Session Management)

**What:** React Context that tracks auth state, user profile, and provides auth actions.
**When to use:** App root -- wraps the entire route tree.
**Critical note:** Keep the `onAuthStateChange` callback synchronous. Do not `await` Supabase calls inside it -- dispatch them separately.

```typescript
// apps/web/src/contexts/auth-context.tsx
// Source: Supabase React quickstart + onAuthStateChange API reference
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Tables } from '@scrolltoday/shared'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  profile: Tables<'user_profiles'> | null
  isLoading: boolean
  isAdmin: boolean
  mustChangePassword: boolean
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    isAdmin: false,
    mustChangePassword: false,
  })

  // Fetch user profile from user_profiles table
  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('auth_user_id', userId)
      .single()
    return data
  }, [])

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Synchronous state update
        const user = session?.user ?? null

        if (user) {
          // Fetch profile OUTSIDE the callback (avoid async deadlock)
          setTimeout(async () => {
            const profile = await fetchProfile(user.id)
            setState({
              user,
              profile,
              isLoading: false,
              isAdmin: profile?.role === 'super_admin',
              mustChangePassword: profile?.must_change_password ?? false,
            })
          }, 0)
        } else {
          setState({
            user: null,
            profile: null,
            isLoading: false,
            isAdmin: false,
            mustChangePassword: false,
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  // ... signIn, signOut, updatePassword methods

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut, updatePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

### Pattern 3: Protected Route with Role-Based Guards

**What:** Route guard components that redirect unauthenticated or unauthorized users.
**When to use:** Wrap route elements that require authentication or admin role.

```typescript
// apps/web/src/features/auth/components/protected-route.tsx
// Source: React Router v7 docs + community patterns
import { Navigate, Outlet } from 'react-router'
import { useAuth } from '@/contexts/auth-context'

// Requires any authenticated user
export function ProtectedRoute() {
  const { user, isLoading, mustChangePassword } = useAuth()

  if (isLoading) return <div>Loading...</div> // Or a skeleton

  if (!user) return <Navigate to="/login" replace />

  // Force password change on first login
  if (mustChangePassword && window.location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  return <Outlet />
}

// Requires super_admin role
export function AdminRoute() {
  const { user, isAdmin, isLoading } = useAuth()

  if (isLoading) return <div>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />

  return <Outlet />
}
```

### Pattern 4: React Router v7 Route Tree with Auth Guards

**What:** `createBrowserRouter` route configuration with nested layouts and auth guards.
**When to use:** Root of the app, replacing the current simple App.tsx.

```typescript
// apps/web/src/router.tsx
// Source: React Router v7 createBrowserRouter docs
import { createBrowserRouter } from 'react-router'
import { ProtectedRoute, AdminRoute } from '@/features/auth/components/protected-route'

export const router = createBrowserRouter([
  // Public routes
  {
    path: '/login',
    lazy: () => import('@/features/auth/pages/login-page'),
  },
  // Protected routes (any authenticated user)
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/change-password',
        lazy: () => import('@/features/auth/pages/change-password-page'),
      },
      {
        path: '/',
        // lazy: () => import('@/features/dashboard/pages/dashboard-page'), // Phase 3
        element: <div>Dashboard placeholder</div>,
      },
      {
        path: '/settings',
        lazy: () => import('@/features/auth/pages/settings-page'),
      },
    ],
  },
  // Admin-only routes
  {
    element: <AdminRoute />,
    children: [
      {
        path: '/admin/users',
        lazy: () => import('@/features/admin/pages/admin-users-page'),
      },
    ],
  },
])
```

### Pattern 5: Client-Side Edge Function Invocation

**What:** Type-safe wrapper for calling admin Edge Functions from the frontend.
**When to use:** Admin pages that need to create, list, update, or delete users.

```typescript
// apps/web/src/features/admin/api/admin-api.ts
import { supabase } from '@/lib/supabase'

interface CreateUserPayload {
  email: string
  password: string
  display_name?: string
  advertiser_name: string
}

export async function adminCreateUser(payload: CreateUserPayload) {
  const { data, error } = await supabase.functions.invoke('admin-create-user', {
    body: payload,
  })
  if (error) throw error
  return data
}

export async function adminListUsers() {
  const { data, error } = await supabase.functions.invoke('admin-list-users')
  if (error) throw error
  return data
}

export async function adminResetPassword(userId: string, newPassword: string) {
  const { data, error } = await supabase.functions.invoke('admin-reset-password', {
    body: { user_id: userId, new_password: newPassword },
  })
  if (error) throw error
  return data
}
```

### Anti-Patterns to Avoid

- **Exposing service_role key in the browser:** NEVER import or use the service_role key in frontend code. All admin operations MUST go through Edge Functions.
- **Passing authHeader to service_role client:** When creating a Supabase client with service_role in an Edge Function, do NOT pass the `Authorization` header from the request -- it overrides the service_role key and causes RLS errors. Use two separate clients: one with service_role (for admin operations), one with the caller's JWT (for authorization checks).
- **Async operations inside onAuthStateChange callback:** Causes deadlocks during TOKEN_REFRESHED events. Use `setTimeout(() => { /* async work */ }, 0)` to dispatch async work outside the callback.
- **Using getSession() for security checks:** `getSession()` reads from storage without validation. Use `getClaims()` (validates JWT signature locally) or `getUser()` (validates against server) instead.
- **Storing admin role in user_metadata:** `user_metadata` is editable by the user via `updateUser()`. The role is correctly stored in the `user_profiles` table (server-controlled). The `is_super_admin()` DB function checks this table.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| User creation with invite | Custom signup flow | `auth.admin.createUser()` via Edge Function | Handles password hashing, email confirmation, JWT generation |
| Session persistence | Custom localStorage token management | `persistSession: true` (already configured) | Handles token refresh, expiry, secure storage |
| JWT validation | Custom token parsing/verification | `supabase.auth.getClaims()` | Validates against project's JWKS endpoint; cryptographically verified |
| Password reset (admin) | Custom reset email flow | `auth.admin.updateUserById(uid, { password })` | Directly sets password server-side; no email required for admin reset |
| Password change (user) | Custom password update endpoint | `supabase.auth.updateUser({ password })` | Client-side; user must be signed in; Supabase handles hashing |
| Protected routes | Custom auth middleware | React Router v7 layout routes + guard components | Standard pattern; integrates with React Router's nested layouts |
| CORS for Edge Functions | Custom header management | `@supabase/supabase-js/cors` (or `_shared/cors.ts`) | Stays in sync with SDK headers automatically |
| Auth state management | Custom event system | `onAuthStateChange` + React Context | Supabase fires events for all auth lifecycle changes |

**Key insight:** Supabase Auth handles the entire auth lifecycle (signup, signin, session, token refresh, password management) and the admin API provides user management without custom backend code. The only custom server-side code needed is the thin Edge Function layer that gates admin operations behind role checks and holds the service_role key.

## Common Pitfalls

### Pitfall 1: service_role Key in Browser Code
**What goes wrong:** The service_role key bypasses ALL RLS policies. If exposed in frontend code, any user can read/write any data.
**Why it happens:** Developers try to use `auth.admin.createUser()` directly from the browser, which requires service_role.
**How to avoid:** All admin API calls go through Edge Functions. The Edge Function has access to `SUPABASE_SERVICE_ROLE_KEY` as a built-in env var. The frontend uses `supabase.functions.invoke()` with the anon key.
**Warning signs:** `auth.admin` calls in frontend code; service_role key in `.env` files with `VITE_` prefix.

### Pitfall 2: Authorization Header Overriding service_role
**What goes wrong:** Creating a Supabase client with `{ global: { headers: { Authorization: authHeader } } }` in an Edge Function overrides the service_role key. Database operations then run as the caller's user, subject to RLS.
**Why it happens:** Developer passes the caller's JWT to the admin client for "context."
**How to avoid:** Use TWO separate clients in the Edge Function: (1) an admin client with service_role for admin operations, (2) a caller client with the JWT for authorization verification only.
**Warning signs:** 403 errors on database inserts in Edge Functions; RLS denying access despite using service_role key.

### Pitfall 3: Async Deadlock in onAuthStateChange
**What goes wrong:** The app hangs on page refresh. The TOKEN_REFRESHED event fires but the callback never completes because of a deadlock.
**Why it happens:** Calling `await supabase.auth.getUser()` or other async Supabase methods inside the `onAuthStateChange` callback creates a circular dependency during token refresh.
**How to avoid:** Keep the callback synchronous. Dispatch async work via `setTimeout(() => { ... }, 0)` or use a state update that triggers a separate `useEffect`.
**Warning signs:** App freezes on refresh; "hanging" auth state; `isLoading` never becomes `false`.

### Pitfall 4: Not Creating user_profile After Auth User Creation
**What goes wrong:** An auth user exists in `auth.users` but has no `user_profiles` row. RLS policies using `get_user_advertiser_id()` or `is_super_admin()` return NULL/false, blocking all data access.
**Why it happens:** The Edge Function creates the auth user but fails to insert the user_profile record (network error, validation error).
**How to avoid:** The Edge Function must create the auth user, advertiser, and user_profile as a logical unit. If any step fails, clean up (delete the auth user). Alternatively, use a database trigger on `auth.users` INSERT.
**Warning signs:** User can log in but sees no data; empty dashboard; queries return zero rows.

### Pitfall 5: Missing CORS Headers on Edge Functions
**What goes wrong:** Browser gets CORS errors when calling Edge Functions. The preflight OPTIONS request fails.
**Why it happens:** Edge Functions don't include CORS headers by default. The browser sends an OPTIONS preflight before the actual POST.
**How to avoid:** Every Edge Function must handle OPTIONS requests and include CORS headers in all responses. Use the shared `cors.ts` pattern or import from `@supabase/supabase-js/cors`.
**Warning signs:** Network tab shows OPTIONS request failing with no CORS headers.

### Pitfall 6: Deploying Edge Functions Without Docker on Windows
**What goes wrong:** `supabase functions deploy` fails because Docker is not installed or running.
**Why it happens:** By default, the CLI uses Docker to bundle Edge Functions.
**How to avoid:** Use the `--use-api` flag: `npx supabase functions deploy --use-api`. This deploys via API without Docker. Note: local testing with `supabase functions serve` still requires Docker.
**Warning signs:** Docker-related errors during deployment on Windows.

### Pitfall 7: First-Login Password Change Not Enforced
**What goes wrong:** User logs in with the admin-provided password but is never prompted to change it. They continue using the initial password.
**Why it happens:** The `must_change_password` flag exists in the database but the frontend doesn't check it.
**How to avoid:** After successful login, fetch the user profile and check `must_change_password`. If `true`, redirect to `/change-password` before allowing access to any other route. After password change, update the flag to `false` in `user_profiles`.
**Warning signs:** Users never change their initial password; security audit flags shared credentials.

## Code Examples

### Supabase Client signInWithPassword (Client-Side Login)

```typescript
// Source: Supabase auth.signInWithPassword API reference
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'their-password',
})

if (error) {
  // Error message is deliberately vague (doesn't reveal if account exists)
  console.error('Login failed:', error.message)
} else {
  // data.session contains access_token and refresh_token
  // data.user contains user profile from auth.users
  console.log('Logged in as:', data.user.email)
}
```

### Password Change (Client-Side, Authenticated User)

```typescript
// Source: Supabase auth.updateUser API reference
// User must be signed in. No current password verification by default.
const { data, error } = await supabase.auth.updateUser({
  password: 'new-secure-password',
})

if (!error) {
  // Also update must_change_password flag in user_profiles
  await supabase
    .from('user_profiles')
    .update({ must_change_password: false })
    .eq('auth_user_id', data.user.id)
}
```

### Auth State Listener Setup (React)

```typescript
// Source: Supabase onAuthStateChange API reference
// CRITICAL: No async operations inside the callback
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      // These are the events you'll receive:
      // INITIAL_SESSION - first load, session from localStorage
      // SIGNED_IN      - user just signed in
      // SIGNED_OUT     - user just signed out
      // TOKEN_REFRESHED - access token was refreshed
      // USER_UPDATED   - user called updateUser()
      // PASSWORD_RECOVERY - user clicked a password recovery link

      setUser(session?.user ?? null)

      // Dispatch async profile fetch OUTSIDE the callback
      if (session?.user) {
        setTimeout(() => fetchProfile(session.user.id), 0)
      }
    }
  )

  return () => subscription.unsubscribe()
}, [])
```

### Admin List Users Edge Function

```typescript
// supabase/functions/admin-list-users/index.ts
// Source: Supabase auth.admin.listUsers API reference
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify caller is admin
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) throw new Error('Unauthorized')

    const { data: callerProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('auth_user_id', caller.id)
      .single()
    if (callerProfile?.role !== 'super_admin') throw new Error('Forbidden')

    // Get all auth users
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
    if (error) throw error

    // Get all profiles with advertiser info
    const { data: profiles } = await supabaseAdmin
      .from('user_profiles')
      .select('*, advertisers(*)')

    // Merge auth user data with profile data
    const merged = users.map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      profile: profiles?.find(p => p.auth_user_id === user.id) || null,
    }))

    return new Response(
      JSON.stringify({ users: merged }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const status = error.message === 'Unauthorized' ? 401
      : error.message === 'Forbidden' ? 403 : 400
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
    )
  }
})
```

### Shared CORS Utility

```typescript
// supabase/functions/_shared/cors.ts
// Source: Supabase Edge Functions CORS docs
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

### Edge Function Client Invocation

```typescript
// Source: Supabase functions.invoke API reference
// The client automatically includes the user's JWT in the Authorization header
const { data, error } = await supabase.functions.invoke('admin-create-user', {
  body: {
    email: 'newuser@company.com',
    password: 'initial-password-123',
    display_name: 'New User',
    advertiser_name: 'Company Inc',
  },
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `getSession()` for auth checks | `getClaims()` for local JWT validation | 2025 | Faster, more secure; validates JWT signature without network call |
| `react-router-dom` package | `react-router` unified package (v7) | Nov 2024 | Single import source; no separate `react-router-dom` needed |
| `verify_jwt` flag on Edge Functions | Manual JWT verification with `jose` + JWKS | 2025 | More control; asymmetric key verification is the new standard |
| Symmetric JWT signing | Asymmetric JWT signing (JWKS) | 2025 | `getClaims()` validates locally against published public keys |
| `supabase.auth.getUser()` for every check | `getClaims()` locally, `getUser()` only when server verification needed | 2025 | Reduced latency; `getClaims()` is local, `getUser()` is a network call |

**Deprecated/outdated:**
- `react-router-dom` as separate package: In v7, import everything from `react-router`
- `supabase.auth.getSession()` for security: Use `getClaims()` instead; `getSession()` doesn't validate the JWT
- `verify_jwt` Edge Function flag: Being replaced by manual JWT verification with `jose`; still works but legacy

## Open Questions

1. **Super Admin Bootstrap**
   - What we know: The first super_admin user cannot be created via the admin UI (there is no admin yet). Needs to be bootstrapped.
   - What's unclear: Whether to create via Supabase Dashboard Auth panel + manual SQL insert, or via seed data.
   - Recommendation: Create the super admin via Supabase Dashboard (Auth > Users > Add User), then manually insert the user_profile row via SQL Editor with `role = 'super_admin'` and `must_change_password = false`. Document this as a one-time setup step.

2. **Edge Function Local Testing Without Docker**
   - What we know: `supabase functions serve` requires Docker for local testing. `supabase functions deploy --use-api` deploys without Docker.
   - What's unclear: Whether the team has Docker available on their development machines.
   - Recommendation: Deploy Edge Functions directly to the dev project using `--use-api`. Test against the deployed dev environment. If Docker becomes available, `supabase functions serve` enables local testing.

3. **Password Strength Requirements**
   - What we know: Supabase has a `password-security` configuration for minimum password length and character requirements. The `signInWithPassword` response includes a `weakPassword` warning.
   - What's unclear: What the current default minimum password length is on the project.
   - Recommendation: Configure minimum 8-character passwords in Supabase Auth settings. Add client-side validation to match. Check the `weakPassword` field in the sign-in response.

4. **User Deletion Cascade**
   - What we know: `user_profiles` has `ON DELETE CASCADE` from `auth.users`. But `advertisers`, `campaigns`, `creatives` do not cascade from user deletion.
   - What's unclear: Whether deleting a user should delete their advertiser and all associated data.
   - Recommendation: For now, admin can only deactivate users (not delete). If deletion is needed, the Edge Function should handle cleanup explicitly. Defer full deletion logic until requirements are clearer.

## Sources

### Primary (HIGH confidence)
- Supabase auth.admin.createUser API: https://supabase.com/docs/reference/javascript/auth-admin-createuser
- Supabase Admin API overview: https://supabase.com/docs/reference/javascript/admin-api
- Supabase auth.admin.updateUserById: https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid
- Supabase auth.admin.listUsers: https://supabase.com/docs/reference/javascript/auth-admin-listusers
- Supabase auth.signInWithPassword: https://supabase.com/docs/reference/javascript/auth-signinwithpassword
- Supabase auth.updateUser (password change): https://supabase.com/docs/reference/javascript/auth-updateuser
- Supabase auth.onAuthStateChange: https://supabase.com/docs/reference/javascript/auth-onauthstatechange
- Supabase auth.getClaims: https://supabase.com/docs/reference/javascript/auth-getclaims
- Supabase sessions guide: https://supabase.com/docs/guides/auth/sessions
- Supabase password-based auth: https://supabase.com/docs/guides/auth/passwords
- Supabase managing user data (triggers): https://supabase.com/docs/guides/auth/managing-user-data
- Supabase Edge Functions quickstart: https://supabase.com/docs/guides/functions/quickstart
- Supabase Edge Functions auth: https://supabase.com/docs/guides/functions/auth
- Supabase Edge Functions CORS: https://supabase.com/docs/guides/functions/cors
- Supabase Edge Functions deploy: https://supabase.com/docs/guides/functions/deploy
- React Router v7 createBrowserRouter: https://reactrouter.com/api/data-routers/createBrowserRouter
- React Router v7 npm: https://www.npmjs.com/package/react-router (v7.13.0)

### Secondary (MEDIUM confidence)
- Supabase GitHub Discussion #22753 (Edge Function user creation + profile): https://github.com/orgs/supabase/discussions/22753
- Supabase GitHub Issue #40985 (getClaims vs getSession): https://github.com/supabase/supabase/issues/40985
- React Router protected routes pattern: https://www.robinwieruch.de/react-router-private-routes/

### Tertiary (LOW confidence)
- Edge Function deployment without Docker on Windows: Based on `--use-api` flag documentation and community reports; exact Windows path fix version (v2.13.8) from search results only

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All APIs verified from official Supabase docs and React Router docs
- Architecture: HIGH - Edge Function pattern verified against official docs and community discussion confirming the dual-client pattern
- Auth flow (signIn, session, password): HIGH - All methods verified from official API reference
- Edge Function deployment on Windows: MEDIUM - `--use-api` flag confirmed in docs, Windows-specific behavior from community
- Pitfalls: HIGH - Async deadlock documented in official onAuthStateChange docs; service_role override confirmed in GitHub discussion

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (30 days - Supabase Auth API is stable; React Router v7 is stable)
