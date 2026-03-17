import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { toast } from 'sonner'
import { adminResetPassword, type AdminUser } from '@/features/admin/api/admin-api'
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
import { Key, Copy, ShieldAlert, Mail } from 'lucide-react'
import '../styles/team.css'

interface ResetPasswordDialogProps {
  user: AdminUser | null
  open: boolean
  onClose: () => void
  /** Override the reset function. Defaults to adminResetPassword. */
  onReset?: (userId: string, newPassword: string) => Promise<unknown>
}

function generatePassword(length = 16): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => chars[byte % chars.length]).join('')
}

export function ResetPasswordDialog({
  user,
  open,
  onClose,
  onReset,
}: ResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = useCallback(() => {
    setNewPassword(generatePassword())
    setError(null)
    setIsSubmitting(false)
  }, [])

  useEffect(() => {
    if (open) {
      resetForm()
    }
  }, [open, resetForm])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!user) return

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await (onReset ?? adminResetPassword)(user.id, newPassword)
      toast.success(`Password reset for ${user.email}`)
      onClose()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to reset password'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent 
        className="max-w-md admin-dialog-content"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="admin-dialog-header">
          <DialogTitle className="admin-dialog-title">
              <div className="admin-dialog-title-icon">
                  <Key size={22} />
              </div>
              Reset Password
          </DialogTitle>
          <DialogDescription className="pt-2 flex items-center gap-2">
            <Mail size={14} className="text-slate-400" />
            Resetting access for{' '}
            <span className="font-semibold text-slate-800">{user?.email}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="admin-dialog-body space-y-6">
            <div className="admin-form-group">
                <Label htmlFor="reset-new-password" className="admin-form-label flex items-center gap-2">
                    <Key size={14} className="text-slate-400" />
                    New Generated Password
                </Label>
                <div className="flex gap-2">
                <Input
                    id="reset-new-password"
                    type="text"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="admin-form-input font-mono h-11 flex-1"
                    disabled={isSubmitting}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-11 w-11 rounded-xl border-1.5 hover:bg-slate-50"
                    onClick={() => void copyToClipboard(newPassword)}
                    disabled={isSubmitting}
                >
                    <Copy size={18} className="text-slate-500" />
                </Button>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
                    <ShieldAlert size={12} className="text-amber-500" />
                    Copy this password immediately. The user must use this for their next login.
                </p>
            </div>

            {error && (
               <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">
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
                className="flex-1 rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95 text-white font-semibold"
            >
              {isSubmitting ? 'Updating...' : 'Confirm Reset'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
