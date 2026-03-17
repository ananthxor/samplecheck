import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { adminAddCredits } from '../api/admin-api'
import type { AdminUser } from '../api/admin-api'
import { Coins, Building2, StickyNote, History, ShieldPlus, ChevronRight } from 'lucide-react'
import '../styles/team.css'

interface AddCreditsDialogProps {
  user: AdminUser | null
  open: boolean
  onClose: () => void
  onAdded: (advertiserId: string, newBalance: number) => void
}

export function AddCreditsDialog({ user, open, onClose, onAdded }: AddCreditsDialogProps) {
  const [amount, setAmount]   = useState('')
  const [note, setNote]       = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const advertiserId   = user?.profile?.advertiser_id ?? null
  const advertiserName = user?.profile?.advertisers?.name ?? user?.email ?? ''
  const currentBalance = user?.profile?.advertisers?.credit_balance ?? 0

  function handleOpenChange(open: boolean) {
    if (!open) {
      setAmount('')
      setNote('')
      onClose()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!advertiserId) return

    const parsed = parseInt(amount, 10)
    if (isNaN(parsed) || parsed <= 0) {
      toast.error('Enter a positive number of credits')
      return
    }

    setIsLoading(true)
    try {
      const { newBalance } = await adminAddCredits(advertiserId, parsed, note || undefined)
      toast.success(`Added ${parsed.toLocaleString()} credits. New balance: ${newBalance.toLocaleString()}`)
      onAdded(advertiserId, newBalance)
      handleOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add credits')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md admin-dialog-content">
        <DialogHeader className="admin-dialog-header">
          <DialogTitle className="admin-dialog-title">
            <div className="admin-dialog-title-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                <Coins size={22} />
            </div>
            Manage Credits
          </DialogTitle>
          <DialogDescription className="pt-2">
            Add impression credits to this advertiser's account balance.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="admin-dialog-body space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                        <Building2 size={20} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Organization</span>
                        <span className="text-sm font-bold text-slate-900">{advertiserName}</span>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Balance</span>
                    <span className="text-lg font-black text-emerald-600">{currentBalance.toLocaleString()}</span>
                </div>
            </div>

            <div className="space-y-4">
                <div className="admin-form-group">
                    <Label htmlFor="credits-amount" className="admin-form-label flex items-center gap-2">
                        <ShieldPlus size={14} className="text-slate-400" />
                        Credit Multiplier
                    </Label>
                    <div className="relative group">
                        <Input
                            id="credits-amount"
                            type="number"
                            min="1"
                            step="1"
                            placeholder="e.g. 10000"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            autoFocus
                            className="admin-form-input h-12 text-lg font-bold pr-16"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase letter-spacing-1">
                            Units
                        </div>
                    </div>
                </div>

                <div className="admin-form-group">
                    <Label htmlFor="credits-note" className="admin-form-label flex items-center gap-2">
                        <StickyNote size={14} className="text-slate-400" />
                        Transaction Note
                    </Label>
                    <Input
                        id="credits-note"
                        placeholder="e.g. Trial package, manual top-up..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="admin-form-input h-11"
                    />
                </div>
            </div>

            <div className="p-4 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl flex items-center justify-between group cursor-default">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <History size={16} />
                    </div>
                    <span className="text-xs font-bold text-emerald-800">New balance after update</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-emerald-600">
                        {(currentBalance + (parseInt(amount) || 0)).toLocaleString()}
                    </span>
                    <ChevronRight size={14} className="text-emerald-300 group-hover:translate-x-0.5 transition-transform" />
                </div>
            </div>
          </div>

          <DialogFooter className="admin-dialog-footer">
            <Button 
                type="button" 
                variant="ghost" 
                onClick={() => handleOpenChange(false)}
                className="flex-1 rounded-xl h-11 hover:bg-slate-50 font-bold"
            >
              Cancel
            </Button>
            <Button 
                type="submit" 
                disabled={isLoading || !advertiserId}
                className="flex-1 rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95 font-bold flex items-center gap-2"
            >
              {isLoading ? 'Processing...' : 'Apply Credits'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
