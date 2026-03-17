/**
 * org-reset-password Edge Function
 *
 * Resets a user's password. Accessible to org_admin and super_admin.
 * org_admin can only reset passwords for users in their own organization.
 *
 * Body: { user_id, new_password }
 * Returns 200: { success: true, user_id }
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
    const { user_id, new_password } = body

    if (!user_id || typeof user_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing required field: user_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }
    if (!new_password || typeof new_password !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing required field: new_password' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    // Org admin: verify target user belongs to their org
    if (callerProfile.role === 'org_admin') {
      const { data: targetProfile, error: profileError } = await adminClient
        .from('user_profiles')
        .select('advertiser_id')
        .eq('auth_user_id', user_id)
        .single()

      if (
        profileError ||
        !targetProfile ||
        targetProfile.advertiser_id !== callerProfile.advertiser_id
      ) {
        return new Response(
          JSON.stringify({ error: 'User not found in your organization' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 },
        )
      }
    }

    const { error: updateError } =
      await adminClient.auth.admin.updateUserById(user_id, {
        password: new_password,
      })

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    return new Response(
      JSON.stringify({ success: true, user_id }),
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
