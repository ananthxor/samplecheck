/**
 * Admin Reset Password Edge Function
 *
 * POST endpoint that resets a user's password via the admin API.
 * Requires the caller to be a super_admin.
 *
 * Body: { user_id, new_password }
 * Returns 200: { success: true, user_id }
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

    // Parse and validate request body
    const body = await req.json()
    const { user_id, new_password } = body

    if (!user_id || typeof user_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing required field: user_id' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }
    if (!new_password || typeof new_password !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing required field: new_password' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    // Update user password via admin API
    const { error: updateError } =
      await adminClient.auth.admin.updateUserById(user_id, {
        password: new_password,
      })

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    return new Response(
      JSON.stringify({ success: true, user_id }),
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
