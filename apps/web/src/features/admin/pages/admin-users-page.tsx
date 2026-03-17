import { useCallback, useEffect, useState } from 'react'
import { adminListUsers, adminSetAdvertiserStatus, adminSetUserStatus, type AdminUser } from '@/features/admin/api/admin-api'
import { UserList } from '@/features/admin/components/user-list'
import { UserListSkeleton } from '@/features/admin/components/user-list-skeleton'
import { CreateUserDialog } from '@/features/admin/components/create-user-dialog'
import { ResetPasswordDialog } from '@/features/admin/components/reset-password-dialog'
import { AddCreditsDialog } from '@/features/admin/components/add-credits-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShieldCheck, Users2, Building2, Coins, Search, UserPlus2, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import '../styles/team.css'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [resetUser, setResetUser] = useState<AdminUser | null>(null)
  const [creditsUser, setCreditsUser] = useState<AdminUser | null>(null)

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await adminListUsers()
      setUsers(result.users)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void fetchUsers() }, [fetchUsers])

  function handleCreated() { void fetchUsers() }

  /** Optimistically update the credit balance in the local list after a successful add. */
  function handleCreditsAdded(advertiserId: string, newBalance: number) {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.profile?.advertiser_id !== advertiserId || !u.profile.advertisers) return u
        return {
          ...u,
          profile: {
            ...u.profile,
            advertisers: { ...u.profile.advertisers, credit_balance: newBalance },
          },
        }
      })
    )
  }

  const stats = {
    totalUsers: users.length,
    activeOrgs: new Set(users.filter(u => u.profile?.advertiser_id).map(u => u.profile?.advertiser_id)).size,
    totalCredits: users.reduce((acc, u) => acc + (u.profile?.advertisers?.credit_balance || 0), 0)
  }

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase()
    const name = (u.profile?.display_name || '').toLowerCase()
    const email = u.email.toLowerCase()
    const org = (u.profile?.advertisers?.name || '').toLowerCase()
    return name.includes(q) || email.includes(q) || org.includes(q)
  })

  async function handleToggleStatus(targetUser: AdminUser, newStatus: 'active' | 'inactive') {
    if (!targetUser.profile?.id) return
    
    const previousUsers = [...users]
    const isOrgAdmin = targetUser.profile.role === 'org_admin'
    const advertiserId = targetUser.profile.advertiser_id

    // Block activating a member whose org is inactive — org admin must be enabled first
    if (newStatus === 'active' && !isOrgAdmin && advertiserId) {
      const orgInactive = targetUser.profile.advertisers?.status === 'inactive'
      if (orgInactive) {
        const orgName = targetUser.profile.advertisers?.name || 'the organization'
        toast.warning(`Cannot activate this user while ${orgName} is inactive. Enable the Org Admin first.`)
        return
      }
    }

    // Optimistic Logic
    setUsers(prev => prev.map(u => {
      // 1. If we are toggling an Org Admin, cascade status to ALL users in the org
      if (isOrgAdmin && advertiserId && u.profile?.advertiser_id === advertiserId) {
        return {
          ...u,
          profile: {
            ...u.profile,
            status: newStatus,
            advertisers: u.profile.advertisers ? { ...u.profile.advertisers, status: newStatus } : null
          }
        }
      }

      // 2. Standalone advertiser: ONLY the specific user account is toggled
      if (u.id === targetUser.id && u.profile) {
        return {
          ...u,
          profile: {
            ...u.profile,
            status: newStatus
          }
        }
      }
      return u
    }))

    try {
      if (isOrgAdmin && advertiserId) {
        // Toggle Platform Organization Status
        await adminSetAdvertiserStatus(advertiserId, newStatus)
        // Cascade: set status for ALL users in this org (org_admin + advertisers)
        const orgUsers = users.filter(u => u.profile?.advertiser_id === advertiserId && u.profile?.id)
        await Promise.all(
          orgUsers.map(u => adminSetUserStatus(u.profile!.id, newStatus))
        )
        toast.success(`Organization ${targetUser.profile.advertisers?.name} and all its members are now ${newStatus}`)
      } else {
        // Standalone: only toggle individual member access
        await adminSetUserStatus(targetUser.profile.id, newStatus)
        toast.success(`User access for ${targetUser.email} is now ${newStatus}`)
      }
    } catch (err) {
      toast.error('Failed to update status')
      setUsers(previousUsers)
    }
  }

  return (
    <div className="team-page-wrap space-y-8">
      <div className="team-header mb-12">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-500/10 flex items-center justify-center text-emerald-600 rounded-2xl shadow-sm border border-emerald-500/5">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="team-header__title">Global User Control</h1>
            <p className="team-header__sub font-medium">
              Super Admin override for all client organizations and staff accounts.
            </p>
          </div>
        </div>
        <Button 
            onClick={() => setShowCreateDialog(true)}
            className="rounded-2xl px-7 h-12 bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all font-bold group flex items-center gap-2 active:scale-95 border-0 text-white"
        >
          <div className="p-1.5 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
            <UserPlus2 size={16} />
          </div>
          Create Advertiser Account
        </Button>
      </div>

      <div className="team-body">
        {isLoading && (
          <div className="space-y-8 animate-pulse">
            <div className="team-stats-grid">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="stat-card border-slate-100 shadow-none">
                  <div className="stat-icon bg-slate-100" />
                  <div className="stat-info space-y-2">
                    <div className="h-7 w-12 bg-slate-100 rounded-lg" />
                    <div className="h-3 w-20 bg-slate-100 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
            <div className="user-directory-container border-slate-100 shadow-none">
              <UserListSkeleton />
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-red-100 rounded-32 gap-4">
            <div className="p-4 bg-red-50 text-red-600 rounded-full">
                <ShieldAlert size={32} />
            </div>
            <p className="text-sm font-semibold text-red-600">{error}</p>
            <Button variant="outline" className="rounded-xl" onClick={() => void fetchUsers()}>
              Retry Connection
            </Button>
          </div>
        )}

        {!isLoading && !error && (
            <>
                <div className="team-stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon stat-icon--total">
                            <Users2 size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.totalUsers}</span>
                            <span className="stat-label">System Users</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon stat-icon--active" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                            <Building2 size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.activeOrgs}</span>
                            <span className="stat-label">Advertiser Orgs</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon stat-icon--admin" style={{ background: '#fffbeb', color: '#d97706' }}>
                            <Coins size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.totalCredits.toLocaleString()}</span>
                            <span className="stat-label">Total Credits Pool</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex-1 max-w-md relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4 group-focus-within:text-emerald-500 transition-colors" />
                        <Input 
                            placeholder="Search by name, email or org..." 
                            className="pl-11 h-12 rounded-2xl border-slate-200 bg-white/50 backdrop-blur-sm focus:bg-white transition-all shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="user-directory-container">
                        <UserList
                            users={filteredUsers}
                            showOrg={true}
                            onResetPassword={(u) => setResetUser(u)}
                            onAddCredits={(u) => setCreditsUser(u)}
                            onToggleStatus={handleToggleStatus}
                        />
                    </div>
                </div>
            </>
        )}
      </div>

      <CreateUserDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreated={handleCreated}
      />

      <ResetPasswordDialog
        user={resetUser}
        open={resetUser !== null}
        onClose={() => setResetUser(null)}
      />

      <AddCreditsDialog
        user={creditsUser}
        open={creditsUser !== null}
        onClose={() => setCreditsUser(null)}
        onAdded={handleCreditsAdded}
      />
    </div>
  )
}
