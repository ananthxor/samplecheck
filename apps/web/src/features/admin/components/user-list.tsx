import { useState, useEffect } from 'react'
import type { AdminUser } from '@/features/admin/api/admin-api'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Key, ShieldCheck, Clock, Shield, Circle, Search, Coins, Building2, MoreVertical } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import '../styles/team.css'
import { cn } from '@/lib/utils'

interface UserListProps {
  users: AdminUser[]
  currentUserId?: string
  showOrg?: boolean
  onResetPassword: (user: AdminUser) => void
  onAddCredits?: (user: AdminUser) => void
  onToggleStatus?: (user: AdminUser, newStatus: 'active' | 'inactive') => Promise<void>
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'super_admin') return <span className="role-badge role-badge--admin">Admin</span>
  if (role === 'org_admin') return <span className="role-badge role-badge--org">Org Admin</span>
  return <span className="role-badge role-badge--adv">Advertiser</span>
}

/**
 * Helper to get the timezone offset string like "GMT+0530"
 */
function getTimezoneOffset(): string {
  const offset = -new Date().getTimezoneOffset()
  const absOffset = Math.abs(offset)
  const sign = offset >= 0 ? '+' : '-'
  const hours = Math.floor(absOffset / 60).toString().padStart(2, '0')
  const minutes = (absOffset % 60).toString().padStart(2, '0')
  return `GMT${sign}${hours}${minutes}`
}

/**
 * Formats date to a more user-friendly display: "Active 2h ago (GMT+0530)"
 */
function formatFriendlyDate(dateStr: string | null): string {
  if (!dateStr) return 'Never signed in'
  const date = new Date(dateStr)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  const tz = getTimezoneOffset()
  
  let timeStr = ''
  
  if (diffInSeconds < 60) {
    timeStr = 'Just now'
  } else if (diffInSeconds < 3600) {
    timeStr = `${Math.floor(diffInSeconds / 60)}m ago`
  } else if (diffInSeconds < 86400) {
    // Under 24 hours: show Hours and Minutes
    const h = Math.floor(diffInSeconds / 3600)
    const m = Math.floor((diffInSeconds % 3600) / 60)
    timeStr = `${h}h ${m}m ago`
  } else {
    // Over 24 hours: Full date
    timeStr = date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return `${timeStr} (${tz})`
}

/**
 * Component that updates the relative time display every minute
 */
function LiveTimeDisplay({ dateStr }: { dateStr: string | null }) {
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!dateStr) return
    
    let interval: NodeJS.Timeout;
    
    // Calculate ms until the start of the next minute to sync with system clock
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    
    const timeout = setTimeout(() => {
      setTick(t => t + 1);
      // Once synced, update every 60 seconds
      interval = setInterval(() => {
        setTick(t => t + 1);
      }, 60000);
    }, msUntilNextMinute);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    }
  }, [dateStr])

  return (
    <code className="time-display">
      {formatFriendlyDate(dateStr)}
    </code>
  )
}

export function UserList({ 
  users, 
  currentUserId, 
  showOrg = false, 
  onResetPassword, 
  onAddCredits, 
  onToggleStatus 
}: UserListProps) {
  const [togglingId, setTogglingId] = useState<string | null>(null)

  async function handleToggleStatus(user: AdminUser) {
    if (!onToggleStatus || !user.profile) return
    const newStatus = user.profile.status === 'active' ? 'inactive' : 'active'
    setTogglingId(user.id)
    try {
      await onToggleStatus(user, newStatus)
    } finally {
      setTogglingId(null)
    }
  }
  return (
    <div className="user-directory">
      <Table>
        <TableHeader className="bg-slate-50/40 backdrop-blur-sm border-b border-slate-100">
          <TableRow className="hover:bg-transparent">
            <TableHead className="min-w-[320px] py-4">
              <div className="flex items-center gap-2.5 px-2">
                <div className="p-2 bg-emerald-50 rounded-full text-emerald-600 border border-emerald-100/50">
                  <ShieldCheck size={14} />
                </div>
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500">Member Detail</span>
              </div>
            </TableHead>
            <TableHead className="py-4">
              <div className="flex items-center gap-2.5 px-2">
                <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                  <Shield size={14} />
                </div>
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500">Access Level</span>
              </div>
            </TableHead>
            <TableHead className="py-4">
              <div className="flex items-center gap-2.5 px-2">
                <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                  <Clock size={14} />
                </div>
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500">Last Session</span>
              </div>
            </TableHead>
            <TableHead className="py-4">
              <div className="flex items-center gap-2.5 px-2">
                <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                  <Circle size={14} />
                </div>
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500">State</span>
              </div>
            </TableHead>
            <TableHead className="text-right py-4 pr-8">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500">Management</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={5} className="py-24 text-center">
                <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                  <div className="p-4 bg-slate-50 rounded-full border border-slate-100/50">
                    <Search size={32} className="opacity-20 text-slate-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-600">No members found</p>
                    <p className="text-xs text-slate-400">Try adjusting your search or filters to find what you're looking for.</p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => {
              const displayName = user.profile?.display_name || user.email.split('@')[0]
              const initials = user.profile?.display_name 
                  ? user.profile.display_name.split(' ').map(n => n[0]).join('').slice(0, 2)
                  : user.email.slice(0, 2)
              
              return (
                <TableRow key={user.id} className="user-row">
                  <TableCell className="user-cell">
                    <div className="user-info">
                      <div className="user-avatar shadow-lg">{initials}</div>
                      <div className="user-details group/detail">
                        <div className="flex items-center gap-2">
                          <span className="user-display-name">{displayName}</span>
                          {user.profile?.must_change_password && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="p-1 text-amber-500 hover:text-amber-600 transition-colors cursor-help bg-amber-50 rounded-full border border-amber-100/50">
                                    <Key size={10} />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="bg-slate-900 border-slate-800 text-[10px] font-bold px-2 py-1 shadow-md">
                                  Reset Required
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="user-email-text">{user.email}</span>
                            {showOrg && user.profile?.advertisers && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-500 bg-emerald-50/50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100/50 w-fit">
                                        <Building2 size={10} className="text-emerald-500" />
                                        {user.profile.advertisers.name}
                                    </div>
                                </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
  
                  <TableCell className="user-cell">
                      {user.profile ? (
                        <RoleBadge role={user.profile.role} />
                      ) : (
                        <span className="text-[10px] italic text-slate-400">No profile</span>
                      )}
                  </TableCell>
                  
                  <TableCell className="user-cell">
                     <div className="last-signin-wrap">
                          <span className="signin-label">Authentication Time</span>
                          <LiveTimeDisplay dateStr={user.last_sign_in_at} />
                          {user.session_count > 0 && (
                            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {user.session_count} active {user.session_count === 1 ? 'session' : 'sessions'}
                            </span>
                          )}
                     </div>
                  </TableCell>
  
                  <TableCell className="user-cell">
                      {user.profile ? (
                        <div className="flex items-center">
                          {onToggleStatus && user.id !== currentUserId && user.profile.role !== 'super_admin' ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-3 bg-slate-50/80 px-2 py-1.5 rounded-2xl border border-slate-100/50 hover:border-slate-200 transition-colors">
                                    <Switch 
                                        checked={user.profile.status === 'active'}
                                        onCheckedChange={() => void handleToggleStatus(user)}
                                        disabled={togglingId === user.id}
                                        className="data-[state=checked]:bg-emerald-500"
                                    />
                                    {togglingId === user.id && (
                                        <div className="status-toggle-loading size-3 text-emerald-500 shrink-0" />
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="bg-slate-900 border-slate-800 text-[11px] font-bold px-3 py-1.5">
                                  Account is {user.profile.status}
                                  <p className="text-[10px] text-slate-400 font-medium">Click to change availability</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <div className={cn(
                                "status-pill",
                                user.profile.status === 'active' ? 'status-pill--active' : 'status-pill--inactive'
                            )}>
                              <div className={cn(
                                  "status-dot",
                                  user.profile.status === 'active' ? 'status-dot--active' : 'status-dot--inactive'
                              )} />
                              {user.profile.status}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs italic text-muted-foreground">—</span>
                      )}
                  </TableCell>
  
                  <TableCell className="user-cell text-right pr-6">
                    {(() => {
                      const canAddCredits = onAddCredits && (user.profile?.role === 'org_admin' || user.profile?.role === 'super_admin')
                      if (canAddCredits) {
                        return (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0 rounded-xl hover:bg-slate-100 transition-all active:scale-95 border-0"
                              >
                                <MoreVertical size={16} className="text-slate-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[160px] rounded-xl shadow-lg border-slate-200/80">
                              <DropdownMenuItem
                                className="gap-2 px-3 py-2.5 rounded-lg cursor-pointer font-semibold text-[13px] focus:bg-emerald-50 focus:text-emerald-700"
                                onClick={() => onAddCredits(user)}
                              >
                                <Coins size={14} className="text-emerald-500" />
                                Add Credits
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 px-3 py-2.5 rounded-lg cursor-pointer font-semibold text-[13px] focus:bg-slate-100"
                                onClick={() => onResetPassword(user)}
                              >
                                <Key size={14} className="text-slate-500" />
                                Reset Password
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )
                      }
                      return (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 px-4 rounded-xl hover:bg-slate-100 hover:text-slate-900 font-bold text-[13px] transition-all group active:scale-95 border-0"
                          onClick={() => onResetPassword(user)}
                        >
                          <Key size={14} className="mr-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                          Reset
                        </Button>
                      )
                    })()}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
