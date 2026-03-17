import { supabase, fireAuthError, ensureFreshSession } from '@/lib/supabase'

// --- Types ---

export interface CreateUserPayload {
  email: string
  password: string
  display_name?: string
  /** New org mode: provide advertiser_name (creates org + org_admin user) */
  advertiser_name?: string
  /** Existing org mode: provide advertiser_id (adds user to existing org) */
  advertiser_id?: string
  /** Role override. Defaults to 'org_admin' for new org, 'advertiser' for existing org. */
  role?: 'org_admin' | 'advertiser'
}

export type UserRole = 'super_admin' | 'org_admin' | 'advertiser'

export interface AdvertiserOption {
  id: string
  name: string
}

export interface UserProfile {
  id: string
  auth_user_id: string
  role: UserRole
  display_name: string | null
  must_change_password: boolean
  advertiser_id: string | null
  status: 'active' | 'inactive'
  advertisers: { id: string; name: string; contact_email: string | null; credit_balance: number; status: 'active' | 'inactive' } | null
}

export interface AdminUser {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  session_count: number
  profile: UserProfile | null
}

interface CreateUserResponse {
  user_id: string
  advertiser_id: string
  email: string
}

interface ListUsersResponse {
  users: AdminUser[]
}

interface ResetPasswordResponse {
  success: boolean
  user_id: string
}

// --- Helpers ---

function throwIfError(data: unknown, error: unknown, fallback: string): void {
  if (error) {
    const msg = (error as Error).message || fallback
    // Detect expired/revoked session → force global sign-out
    const ctx = (error as { context?: Response }).context
    if (ctx?.status === 401 || /unauthorized/i.test(msg)) {
      fireAuthError()
    }
    throw new Error(msg)
  }
  if (data && typeof data === 'object' && 'error' in data) {
    const msg = (data as { error: string }).error
    if (/unauthorized/i.test(msg)) fireAuthError()
    throw new Error(msg)
  }
}

// --- API Functions ---

export async function adminCreateUser(
  payload: CreateUserPayload
): Promise<CreateUserResponse> {
  await ensureFreshSession()
  const { data, error } = await supabase.functions.invoke('admin-create-user', {
    body: payload,
  })
  throwIfError(data, error, 'Failed to create user')
  return data as CreateUserResponse
}

export async function adminListUsers(): Promise<ListUsersResponse> {
  await ensureFreshSession()
  const { data, error } = await supabase.functions.invoke('admin-list-users', {
    body: {},
  })
  throwIfError(data, error, 'Failed to list users')
  return data as ListUsersResponse
}

export async function adminListAdvertisers(): Promise<AdvertiserOption[]> {
  const { data, error } = await supabase
    .from('advertisers')
    .select('id, name')
    .order('name')

  if (error) {
    throw new Error(error.message || 'Failed to list advertisers')
  }

  return (data ?? []) as AdvertiserOption[]
}

export async function adminAddCredits(
  advertiserId: string,
  amount: number,
  note?: string
): Promise<{ newBalance: number }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('admin_add_credits', {
    p_advertiser_id: advertiserId,
    p_amount: amount,
    p_note: note ?? null,
  })
  if (error) throw new Error(error.message || 'Failed to add credits')
  return { newBalance: data as number }
}

export async function adminSetAdvertiserStatus(
  advertiserId: string,
  status: 'active' | 'inactive'
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('admin_set_advertiser_status', {
    p_advertiser_id: advertiserId,
    p_status: status,
  })
  if (error) throw new Error(error.message || 'Failed to update advertiser status')
}

export async function adminSetUserStatus(
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

export async function adminResetPassword(
  userId: string,
  newPassword: string
): Promise<ResetPasswordResponse> {
  await ensureFreshSession()
  const { data, error } = await supabase.functions.invoke('admin-reset-password', {
    body: { user_id: userId, new_password: newPassword },
  })
  throwIfError(data, error, 'Failed to reset password')
  return data as ResetPasswordResponse
}
