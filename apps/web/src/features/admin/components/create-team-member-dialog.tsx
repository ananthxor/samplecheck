import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { toast } from 'sonner'
import { orgCreateUser } from '@/features/admin/api/org-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { UserPlus2, UserCheck, ShieldCheck, Mail, Key, Copy, CheckCircle2 } from 'lucide-react'
import '../styles/team.css'

interface CreateTeamMemberDialogProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

function generatePassword(length = 16): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => chars[byte % chars.length]).join('')
}

export function CreateTeamMemberDialog({
  open,
  onClose,
  onCreated,
}: CreateTeamMemberDialogProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdPassword, setCreatedPassword] = useState<string | null>(null)

  const resetForm = useCallback(() => {
    setEmail('')
    setPassword(generatePassword())
    setDisplayName('')
    setError(null)
    setCreatedPassword(null)
    setIsSubmitting(false)
  }, [])

  useEffect(() => {
    if (open) resetForm()
  }, [open, resetForm])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await orgCreateUser({
        email,
        password,
        display_name: displayName || undefined,
      })
      setCreatedPassword(password)
      toast.success(`Team member ${email} added`)
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add team member')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !createdPassword) onClose() }}>
      <DialogContent 
        className="max-w-md admin-dialog-content"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {createdPassword ? (
          <>
            <DialogHeader className="admin-dialog-header">
              <DialogTitle className="admin-dialog-title">
                <div className="admin-dialog-title-icon">
                    <CheckCircle2 size={22} />
                </div>
                Member Added
              </DialogTitle>
              <DialogDescription className="pt-2">
                Share these credentials securely — the password cannot be retrieved later.
              </DialogDescription>
            </DialogHeader>

            <div className="admin-dialog-body space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="admin-form-label flex items-center gap-2">
                        <Mail size={14} className="text-slate-400" />
                        Account Email
                    </Label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700">
                        {email}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="admin-form-label flex items-center gap-2">
                        <Key size={14} className="text-slate-400" />
                        Temporary Password
                    </Label>
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                        <code className="font-mono text-sm font-bold text-emerald-700 break-all">{createdPassword}</code>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 hover:bg-emerald-100 text-emerald-700"
                            onClick={() => void copyToClipboard(createdPassword)}
                        >
                            <Copy size={16} />
                        </Button>
                    </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
                  <ShieldCheck size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                      This password is encrypted upon storage. Please copy it now; you will not be able to see it again.
                  </p>
              </div>
            </div>

            <DialogFooter className="admin-dialog-footer">
              <Button className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-100 transition-all active:scale-95" onClick={onClose}>
                Done & Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="admin-dialog-header">
              <DialogTitle className="admin-dialog-title">
                <div className="admin-dialog-title-icon">
                    <UserPlus2 size={22} />
                </div>
                Add Team Member
              </DialogTitle>
              <DialogDescription className="pt-2">
                Provision a new user account with administrative access to the organization.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={(e) => void handleSubmit(e)}>
              <div className="admin-dialog-body space-y-5">
                <div className="admin-form-group">
                  <Label htmlFor="team-email" className="admin-form-label flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" />
                    Email Address
                  </Label>
                  <Input
                    id="team-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    disabled={isSubmitting}
                    className="admin-form-input h-11"
                  />
                </div>

                <div className="admin-form-group">
                  <Label htmlFor="team-display-name" className="admin-form-label flex items-center gap-2">
                    <UserCheck size={14} className="text-slate-400" />
                    Full Name
                  </Label>
                  <Input
                    id="team-display-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter user name"
                    disabled={isSubmitting}
                    className="admin-form-input h-11"
                  />
                </div>

                <div className="admin-form-group">
                  <Label htmlFor="team-password" className="admin-form-label flex items-center gap-2">
                    <Key size={14} className="text-slate-400" />
                    Temporary Password
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="team-password"
                      type="text"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="admin-form-input font-mono h-11 flex-1"
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0 h-11 w-11 rounded-xl border-1.5 hover:bg-slate-50"
                      onClick={() => void copyToClipboard(password)}
                      disabled={isSubmitting}
                    >
                      <Copy size={18} className="text-slate-500" />
                    </Button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
                    <ShieldCheck size={12} />
                    User will be prompted to change it on first login.
                  </p>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium animate-pulse">
                        {error}
                    </div>
                )}
              </div>

              <DialogFooter className="admin-dialog-footer">
                <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={onClose} 
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl h-11 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                    </div>
                  ) : 'Grant Access'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
