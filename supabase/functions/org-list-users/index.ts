/**
 * org-list-users Edge Function
 *
 * Returns users belonging to an organization.
 * Accessible to org_admin and super_admin roles.
 *
 * - org_admin:   returns only users in their own org (scoped by advertiser_id)
 * - super_admin: pass { advertiserId } in body to filter by org,
 *                or omit/pass null to get ALL users across all orgs
 *
 * Returns 200: { users: [{ id, email, created_at, last_sign_in_at, profile }] }
 */
import { corsHeaders } from '../_shared/cors.ts'
import { verifyOrgAdminOrSuperAdmin } from '../_shared/supabase-admin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { callerProfile, adminClient } = await verifyOrgAdminOrSuperAdmin(req)
    const isSuperAdmin = callerProfile.role === 'super_admin'

    // Parse request body (optional)
    const body = await req.json().catch(() => ({}))

    let filterAdvertiserId: string | null = null

    if (isSuperAdmin) {
      // Super admin: use body's advertiserId (null = all orgs)
      filterAdvertiserId = body.advertiserId ?? null
    } else {
      // org_admin: always scoped to their own org
      filterAdvertiserId = callerProfile.advertiser_id
      if (!filterAdvertiserId) {
        return new Response(
          JSON.stringify({ error: 'Caller has no associated organization' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
        )
      }
    }

    // Build profiles query — filter by org if specified, else all profiles
    let profilesQuery = adminClient.from('user_profiles').select('*, advertisers(*)')
    if (filterAdvertiserId) {
      profilesQuery = profilesQuery.eq('advertiser_id', filterAdvertiserId)
    }

    const { data: profiles, error: profilesError } = await profilesQuery

    if (profilesError) {
      return new Response(
        JSON.stringify({ error: profilesError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    // Get auth users for these profiles
    const authUserIds = (profiles ?? []).map((p) => p.auth_user_id)

    const {
      data: { users: allUsers },
      error: listError,
    } = await adminClient.auth.admin.listUsers({ perPage: 1000 })

    if (listError) {
      return new Response(
        JSON.stringify({ error: listError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    const orgUsers = allUsers.filter((u) => authUserIds.includes(u.id))

    // Get active login session counts for these users
    let sessionsQuery = adminClient
      .from('user_login_sessions')
      .select('user_id')
    if (authUserIds.length > 0) {
      sessionsQuery = sessionsQuery.in('user_id', authUserIds)
    }
    const { data: sessions } = await sessionsQuery

    const sessionCountMap = new Map<string, number>()
    for (const s of sessions ?? []) {
      sessionCountMap.set(s.user_id, (sessionCountMap.get(s.user_id) ?? 0) + 1)
    }

    const merged = orgUsers.map((user) => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      session_count: sessionCountMap.get(user.id) ?? 0,
      profile: profiles?.find((p) => p.auth_user_id === user.id) ?? null,
    }))

    return new Response(
      JSON.stringify({ users: merged }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error) {
    const message = (error as Error).message
    const status =
      message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 400

    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status },
    )
  }
})
