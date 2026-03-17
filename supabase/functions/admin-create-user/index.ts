/**
 * Admin Create User Edge Function
 *
 * POST endpoint that creates an auth user + user_profile, optionally creating
 * a new advertiser (org) atomically. Requires the caller to be a super_admin.
 *
 * Two modes:
 *   New org:      { email, password, display_name?, advertiser_name, role?: 'org_admin' }
 *                 Creates a new advertiser record and links the user to it.
 *                 Default role: 'org_admin'
 *
 *   Existing org: { email, password, display_name?, advertiser_id, role?: 'advertiser' }
 *                 Links the user to an existing advertiser (no new advertiser created).
 *                 Default role: 'advertiser'
 *
 * Returns 201: { user_id, advertiser_id, email }
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
    const { email, password, display_name, advertiser_name, advertiser_id, role } = body

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

    // Determine mode: new org vs existing org
    const isNewOrg = !advertiser_id
    if (isNewOrg && (!advertiser_name || typeof advertiser_name !== 'string')) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: advertiser_name (or provide advertiser_id for existing org)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    // Default roles
    const userRole = role ?? (isNewOrg ? 'org_admin' : 'advertiser')
    const allowedRoles = ['org_admin', 'advertiser', 'super_admin']
    if (!allowedRoles.includes(userRole)) {
      return new Response(
        JSON.stringify({ error: `Invalid role: ${userRole}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    // Step 1: Create auth user (email auto-confirmed, no verification email sent)
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

    let resolvedAdvertiserId: string | null = advertiser_id ?? null

    try {
      if (isNewOrg) {
        // Step 2a: Create new advertiser record
        const { data: advData, error: advError } = await adminClient
          .from('advertisers')
          .insert({ name: advertiser_name, contact_email: email })
          .select('id')
          .single()

        if (advError) throw advError
        resolvedAdvertiserId = advData.id
      } else {
        // Step 2b: Verify the existing advertiser exists
        const { data: advData, error: advError } = await adminClient
          .from('advertisers')
          .select('id')
          .eq('id', advertiser_id)
          .single()

        if (advError || !advData) {
          throw new Error(`Advertiser not found: ${advertiser_id}`)
        }
      }

      // Step 3: Create user_profile linking auth user to advertiser
      const { error: profileError } = await adminClient
        .from('user_profiles')
        .insert({
          auth_user_id: newUser.user.id,
          advertiser_id: resolvedAdvertiserId,
          role: userRole,
          display_name: display_name || null,
          must_change_password: true,
        })

      if (profileError) throw profileError
    } catch (insertError) {
      // Cleanup: delete auth user
      await adminClient.auth.admin.deleteUser(newUser.user.id)

      // If we created a new advertiser, clean it up too
      if (isNewOrg && resolvedAdvertiserId) {
        await adminClient
          .from('advertisers')
          .delete()
          .eq('id', resolvedAdvertiserId)
      }

      return new Response(
        JSON.stringify({
          error: `Failed to create user records: ${(insertError as Error).message}`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    // Success
    return new Response(
      JSON.stringify({
        user_id: newUser.user.id,
        advertiser_id: resolvedAdvertiserId,
        email,
      }),
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
