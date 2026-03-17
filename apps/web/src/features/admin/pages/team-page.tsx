import { useCallback, useEffect, useState } from 'react'
import { orgListUsers, orgResetPassword, orgSetUserStatus } from '@/features/admin/api/org-api'
import { adminListUsers, adminSetUserStatus, type AdminUser } from '@/features/admin/api/admin-api'
import { UserList } from '@/features/admin/components/user-list'
import { UserListSkeleton } from '@/features/admin/components/user-list-skeleton'
import { CreateTeamMemberDialog } from '@/features/admin/components/create-team-member-dialog'
import { ResetPasswordDialog } from '@/features/admin/components/reset-password-dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { Users2, UserPlus2, ShieldAlert, UserCheck, ShieldCheck, Search, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import '../styles/team.css'

export default function TeamPage() {
  const { isAdmin, isOrgAdmin, user, effectiveAdvertiserId } = useAuth()
  const canToggleStatus = isAdmin || isOrgAdmin
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [resetUser, setResetUser] = useState<AdminUser | null>(null)

  const [searchQuery, setSearchQuery] = useState('')

  async function handleToggleStatus(targetUser: AdminUser, newStatus: 'active' | 'inactive') {
    const profileId = targetUser.profile?.id
    if (!profileId) return

    // Optimistic update
    const previousUsers = [...users]
    setUsers(prev => prev.map(u =>
      u.id === targetUser.id
        ? { ...u, profile: u.profile ? { ...u.profile, status: newStatus } : null }
        : u
    ))

    try {
      // Super admins use the admin RPC (no edge function auth needed)
      if (isAdmin) {
        await adminSetUserStatus(profileId, newStatus)
      } else {
        await orgSetUserStatus(profileId, newStatus)
      }
      toast.success(`${targetUser.profile?.display_name || targetUser.email}'s status is now ${newStatus}`)
    } catch (err) {
      toast.error('Failed to update status')
      setUsers(previousUsers) // Rollback
    }
  }

  const handleResetPassword = (targetUser: AdminUser) => {
    setResetUser(targetUser)
  }

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (isAdmin) {
        // Super admins: use the admin API (avoids org-list-users edge function auth)
        // then filter to the currently selected org
        const result = await adminListUsers()
        const orgUsers = effectiveAdvertiserId
          ? result.users.filter(u => u.profile?.advertiser_id === effectiveAdvertiserId)
          : result.users
        setUsers(orgUsers)
      } else {
        const result = await orgListUsers(effectiveAdvertiserId)
        setUsers(result.users)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team members')
    } finally {
      setIsLoading(false)
    }
  }, [isAdmin, effectiveAdvertiserId])

  useEffect(() => {
    void fetchUsers()
  }, [fetchUsers])

  return (
    <div className="team-page-wrap space-y-8">
      <div className="team-header mb-12">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-500/10 flex items-center justify-center text-emerald-600 rounded-2xl shadow-sm border border-emerald-500/5">
            <Users2 size={32} />
          </div>
          <div>
            <h1 className="team-header__title">Team Directory</h1>
            <p className="team-header__sub font-medium">
              {isAdmin
                ? 'Managing cross-organization administrative access and permissions for your team.'
                : 'Manage your organization members and account accessibility controls.'}
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
          Add New Member
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
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-red-100 rounded-2xl gap-4">
            <div className="p-4 bg-red-50 text-red-600 rounded-full">
                <ShieldAlert size={32} />
            </div>
            <p className="text-sm font-semibold text-red-600">{error}</p>
            <Button variant="outline" className="rounded-lg" onClick={() => void fetchUsers()}>
              Retry Connection
            </Button>
          </div>
        )}

        {!isLoading && !error && users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white border dashed rounded-32 border-slate-200">
            <div className="w-16 h-16 bg-slate-50 flex items-center justify-center text-slate-300 rounded-full mb-4">
                <Users2 size={32} />
            </div>
            <p className="text-sm font-bold text-slate-400">
              No team members found in this directory.
            </p>
          </div>
        )}

        {!isLoading && !error && users.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
               <div className="flex-1 max-w-md relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4 group-focus-within:text-emerald-500 transition-colors" />
                  <Input 
                    placeholder="Search by name or email..." 
                    className="pl-11 h-12 rounded-2xl border-slate-200 bg-white/50 backdrop-blur-sm focus:bg-white transition-all shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
               <div className="flex items-center gap-2 px-4 py-2 bg-slate-100/50 rounded-xl border border-slate-200/50">
                  <Filter size={14} className="text-slate-400" />
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500">
                    Live Updates Active
                  </span>
               </div>
            </div>
            <div className="team-stats-grid">
              <div className="stat-card group">
                <div className="stat-icon stat-icon--total">
                  <Users2 size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{users.length}</span>
                  <span className="stat-label">Total Staff</span>
                </div>
              </div>

              <div className="stat-card group">
                <div className="stat-icon stat-icon--active">
                  <UserCheck size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">
                    {users.filter(u => u.profile?.status === 'active').length}
                  </span>
                  <span className="stat-label">Online Active</span>
                </div>
              </div>

              <div className="stat-card group">
                <div className="stat-icon stat-icon--admin">
                  <ShieldCheck size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">
                    {users.filter(u => u.profile?.role === 'super_admin' || u.profile?.role === 'org_admin').length}
                  </span>
                  <span className="stat-label">Privileged Roles</span>
                </div>
              </div>
            </div>

            <div className="user-directory-container">
              <UserList
                users={users.filter(u => {
                    const q = searchQuery.toLowerCase()
                    const name = (u.profile?.display_name || '').toLowerCase()
                    const email = u.email.toLowerCase()
                    return name.includes(q) || email.includes(q)
                })}
                currentUserId={user?.id}
                onResetPassword={handleResetPassword}
                onToggleStatus={canToggleStatus ? handleToggleStatus : undefined}
              />
            </div>
          </div>
        )}
      </div>

      <CreateTeamMemberDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreated={() => void fetchUsers()}
      />

      <ResetPasswordDialog
        user={resetUser}
        open={resetUser !== null}
        onClose={() => setResetUser(null)}
        onReset={orgResetPassword}
      />
    </div>
  )
}
