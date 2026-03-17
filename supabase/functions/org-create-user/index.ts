/**
 * org-create-user Edge Function
 *
 * Creates a new user within the caller's organization.
 * Accessible to org_admin and super_admin roles.
 *
 * - org_admin:   creates user in their own org, role always 'advertiser'
 * - super_admin: takes optional advertiser_id to specify which org
 *                (defaults to first advertiser if not provided)
 *
 * Body: { email, password, display_name? }
 * Returns 201: { user_id, email }
 */
import { corsHeaders } from '../_shared/cors.ts'
import { verifyOrgAdminOrSuperAdmin } from '../_shared/supabase-admin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { callerProfile, adminClient } = await verifyOrgAdminOrSuperAdmin(req)

    const body = await req.json()
    const { email, password, display_name } = body

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing required field: email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }
    if (!password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing required field: password' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    // org_admin creates users in their own org only
    const advertiserId = callerProfile.advertiser_id
    if (!advertiserId) {
      return new Response(
        JSON.stringify({ error: 'Caller has no associated organization' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    // Create auth user
    const { data: newUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    // Create user_profile linked to the caller's org
    const { error: profileError } = await adminClient
      .from('user_profiles')
      .insert({
        auth_user_id: newUser.user.id,
        advertiser_id: advertiserId,
        role: 'advertiser',
        display_name: display_name || null,
        must_change_password: true,
      })

    if (profileError) {
      // Cleanup auth user on profile failure
      await adminClient.auth.admin.deleteUser(newUser.user.id)
      return new Response(
        JSON.stringify({ error: `Failed to create user profile: ${profileError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    return new Response(
      JSON.stringify({ user_id: newUser.user.id, email }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 },
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
