/**
 * Admin List Users Edge Function
 *
 * GET/POST endpoint that returns all users with their profiles and advertiser data.
 * Responds to both GET and POST for flexibility with supabase.functions.invoke().
 * Requires the caller to be a super_admin.
 *
 * Returns 200: { users: [{ id, email, created_at, last_sign_in_at, profile }] }
 */
import { corsHeaders } from '../_shared/cors.ts'
import { verifySuperAdmin } from '../_shared/supabase-admin.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify caller is authenticated super_admin
    const { adminClient } = await verifySuperAdmin(req)

    // Get all auth users
    const {
      data: { users },
      error: listError,
    } = await adminClient.auth.admin.listUsers()

    if (listError) {
      return new Response(
        JSON.stringify({ error: listError.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    // Get all profiles with advertiser info
    const { data: profiles, error: profilesError } = await adminClient
      .from('user_profiles')
      .select('*, advertisers(*)')

    if (profilesError) {
      return new Response(
        JSON.stringify({ error: profilesError.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    // Get active login session counts per user
    const { data: sessions } = await adminClient
      .from('user_login_sessions')
      .select('user_id')

    const sessionCountMap = new Map<string, number>()
    for (const s of sessions ?? []) {
      sessionCountMap.set(s.user_id, (sessionCountMap.get(s.user_id) ?? 0) + 1)
    }

    // Merge auth user data with profile data
    const merged = users.map((user) => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      session_count: sessionCountMap.get(user.id) ?? 0,
      profile:
        profiles?.find((p) => p.auth_user_id === user.id) || null,
    }))

    return new Response(
      JSON.stringify({ users: merged }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    const message = (error as Error).message
    const status =
      message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 400

    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status,
      },
    )
  }
})
