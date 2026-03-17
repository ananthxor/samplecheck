/**
 * Admin client factory and caller verification helpers.
 *
 * JWT verification uses the anon key client (Supabase recommended pattern).
 * Privileged DB operations use the service_role admin client.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Creates a Supabase admin client using the service_role key.
 * This client bypasses RLS and has full access to all tables.
 */
export function createAdminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

/**
 * Verifies the caller's JWT using a user-scoped anon-key client
 * (the Supabase recommended pattern for edge function auth).
 *
 * @throws Error('Unauthorized') if JWT is missing or invalid
 */
async function verifyJwt(req: Request): Promise<{ callerId: string }> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) throw new Error('Unauthorized')

  const jwt = authHeader.replace('Bearer ', '')

  // Use anon-key client with explicit JWT — the Supabase recommended approach
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  const { data: { user }, error } = await userClient.auth.getUser(jwt)
  if (error || !user) throw new Error('Unauthorized')

  return { callerId: user.id }
}

/**
 * Verifies the caller is an authenticated super_admin.
 *
 * @returns { caller, adminClient } on success
 * @throws Error('Unauthorized') if no valid JWT / user not found
 * @throws Error('Forbidden') if caller is not a super_admin
 */
export async function verifySuperAdmin(req: Request) {
  const { callerId } = await verifyJwt(req)
  const adminClient = createAdminClient()

  const { data: callerProfile, error: profileError } = await adminClient
    .from('user_profiles')
    .select('role')
    .eq('auth_user_id', callerId)
    .single()

  if (profileError || !callerProfile || callerProfile.role !== 'super_admin') {
    throw new Error('Forbidden')
  }

  return { caller: { id: callerId }, adminClient }
}

/**
 * Verifies the caller is an authenticated org_admin or super_admin.
 *
 * @returns { caller, callerProfile, adminClient } on success
 * @throws Error('Unauthorized') if no valid JWT / user not found
 * @throws Error('Forbidden') if caller is not org_admin or super_admin
 */
export async function verifyOrgAdminOrSuperAdmin(req: Request) {
  const { callerId } = await verifyJwt(req)
  const adminClient = createAdminClient()

  const { data: callerProfile, error: profileError } = await adminClient
    .from('user_profiles')
    .select('role, advertiser_id')
    .eq('auth_user_id', callerId)
    .single()

  if (
    profileError ||
    !callerProfile ||
    !['org_admin', 'super_admin'].includes(callerProfile.role)
  ) {
    throw new Error('Forbidden')
  }

  return { caller: { id: callerId }, callerProfile, adminClient }
}
