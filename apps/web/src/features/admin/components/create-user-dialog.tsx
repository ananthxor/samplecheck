import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { toast } from 'sonner'
import {
  adminCreateUser,
  adminListAdvertisers,
  type AdvertiserOption,
} from '@/features/admin/api/admin-api'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserPlus2, Mail, Key, Building2, LayoutPanelLeft, Copy, CheckCircle2, ShieldCheck } from 'lucide-react'
import '../styles/team.css'

interface CreateUserDialogProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

type OrgMode = 'new' | 'existing'

function generatePassword(length = 16): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => chars[byte % chars.length]).join('')
}

export function CreateUserDialog({
  open,
  onClose,
  onCreated,
}: CreateUserDialogProps) {
  const [orgMode, setOrgMode] = useState<OrgMode>('new')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [advertiserName, setAdvertiserName] = useState('')
  const [selectedAdvertiserId, setSelectedAdvertiserId] = useState('')
  const [advertisers, setAdvertisers] = useState<AdvertiserOption[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdPassword, setCreatedPassword] = useState<string | null>(null)

  const resetForm = useCallback(() => {
    setOrgMode('new')
    setEmail('')
    setPassword(generatePassword())
    setDisplayName('')
    setAdvertiserName('')
    setSelectedAdvertiserId('')
    setError(null)
    setCreatedPassword(null)
    setIsSubmitting(false)
  }, [])

  useEffect(() => {
    if (open) {
      resetForm()
      // Pre-load advertisers for the "existing org" mode
      adminListAdvertisers()
        .then(setAdvertisers)
        .catch(() => setAdvertisers([]))
    }
  }, [open, resetForm])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (orgMode === 'new') {
        await adminCreateUser({
          email,
          password,
          display_name: displayName || undefined,
          advertiser_name: advertiserName,
          role: 'org_admin',
        })
      } else {
        if (!selectedAdvertiserId) {
          setError('Please select an organization')
          setIsSubmitting(false)
          return
        }
        await adminCreateUser({
          email,
          password,
          display_name: displayName || undefined,
          advertiser_id: selectedAdvertiserId,
          role: 'advertiser',
        })
      }

      setCreatedPassword(password)
      toast.success(`User ${email} created successfully`)
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
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
                User Created
              </DialogTitle>
              <DialogDescription className="pt-2">
                Save this password securely — it cannot be retrieved once closed.
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
                Create User
              </DialogTitle>
              <DialogDescription className="pt-2">
                Provision a new administrative account for a client organization.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={(e) => void handleSubmit(e)}>
              <div className="admin-dialog-body space-y-5">
                {/* Org mode toggle */}
                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50 gap-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => setOrgMode('new')}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-extrabold tracking-tight transition-all ${
                      orgMode === 'new'
                        ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100/50'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 size={14} />
                    New Organization
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrgMode('existing')}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-extrabold tracking-tight transition-all ${
                      orgMode === 'existing'
                        ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100/50'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <LayoutPanelLeft size={14} />
                    Existing Org
                  </button>
                </div>

                <div className="admin-form-group">
                  <Label htmlFor="create-email" className="admin-form-label flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" />
                    Email Address
                  </Label>
                  <Input
                    id="create-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    disabled={isSubmitting}
                    className="admin-form-input h-11"
                  />
                </div>

                <div className="admin-form-group">
                  <Label htmlFor="create-password" className="admin-form-label flex items-center gap-2">
                    <Key size={14} className="text-slate-400" />
                    Temporary Password
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="create-password"
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
                    You can manually edit this or copy for safe keeping.
                  </p>
                </div>

                <div className="admin-form-group">
                  <Label htmlFor="create-display-name" className="admin-form-label flex items-center gap-2">
                    <ShieldCheck size={14} className="text-slate-400" />
                    Full Name
                  </Label>
                  <Input
                    id="create-display-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="User's display name (optional)"
                    disabled={isSubmitting}
                    className="admin-form-input h-11"
                  />
                </div>

                {orgMode === 'new' ? (
                  <div className="admin-form-group">
                    <Label htmlFor="create-advertiser-name" className="admin-form-label flex items-center gap-2">
                      <Building2 size={14} className="text-slate-400" />
                      Organization Name
                    </Label>
                    <Input
                      id="create-advertiser-name"
                      type="text"
                      required
                      value={advertiserName}
                      onChange={(e) => setAdvertiserName(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      disabled={isSubmitting}
                      className="admin-form-input h-11"
                    />
                  </div>
                ) : (
                  <div className="admin-form-group">
                    <Label htmlFor="create-existing-org" className="admin-form-label flex items-center gap-2">
                      <LayoutPanelLeft size={14} className="text-slate-400" />
                      Select Organization
                    </Label>
                    <Select
                      value={selectedAdvertiserId}
                      onValueChange={setSelectedAdvertiserId}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="create-existing-org" className="admin-form-input h-11">
                        <SelectValue placeholder="Search organization…" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200">
                        {advertisers.map((adv) => (
                          <SelectItem key={adv.id} value={adv.id} className="rounded-lg">
                            {adv.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

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
                  {isSubmitting ? 'Provisioning...' : 'Provision Access'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
