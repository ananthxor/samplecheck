import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Info, PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/auth-context'
import { DateRangeSelect } from '@/features/analytics/components/date-range-select'
import { getDateRange, type DateRangePreset } from '@/features/analytics/lib/analytics-types'
import { adminAddCredits } from '@/features/admin/api/admin-api'
import { supabase } from '@/lib/supabase'
import { generateCdnBundle, getBundleUrl } from '@/features/editor/lib/bundle-generator'
import { useCreditBalance } from '../hooks/use-credit-balance'
import { useTransactions, useCreateCheckout } from '../hooks/use-billing'
import { useCreativeConsumption } from '../hooks/use-billing-consumption'
import { CreditPackCard } from '../components/credit-pack-card'
import { TransactionTable } from '../components/transaction-table'
import { ConsumptionSummary } from '../components/consumption-summary'
import { CreativeConsumptionTable } from '../components/creative-consumption-table'
import { BillingExportButton } from '../components/billing-export-button'

const CREDIT_PACKS = [
  {
    packId: '50k',
    credits: 50_000,
    label: 'Starter',
    price: '$49',
  },
  {
    packId: '200k',
    credits: 200_000,
    label: 'Growth',
    price: '$149',
    popular: true,
  },
  {
    packId: '1m',
    credits: 1_000_000,
    label: 'Scale',
    price: '$499',
  },
]

const balanceFormatter = new Intl.NumberFormat('en-US')

export default function BillingPage() {
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const successCleanupRef = useRef(false)
  const { isAdmin, effectiveAdvertiserId } = useAuth()

  const isSuccess = searchParams.get('success') === 'true'
  const isCanceled = searchParams.get('canceled') === 'true'

  const { data: balance, isLoading: balanceLoading } = useCreditBalance()
  const { data: transactions, isLoading: txLoading } = useTransactions()
  const createCheckout = useCreateCheckout()

  // Super admin: inline add-credits form state
  const [addAmount, setAddAmount] = useState('')
  const [addNote, setAddNote] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  async function handleAddCredits(e: React.FormEvent) {
    e.preventDefault()
    const advertiserId = effectiveAdvertiserId
    if (!advertiserId) {
      toast.error('Please select an organization first.')
      return
    }
    const parsed = parseInt(addAmount, 10)
    if (isNaN(parsed) || parsed === 0) {
      toast.error('Enter a non-zero number of credits (negative to deduct).')
      return
    }
    setIsAdding(true)
    try {
      const { newBalance } = await adminAddCredits(advertiserId, parsed, addNote || undefined)
      const action = parsed > 0 ? 'Added' : 'Deducted'
      const display = Math.abs(parsed).toLocaleString()
      toast.success(`${action} ${display} credits. New balance: ${newBalance.toLocaleString()}`)
      setAddAmount('')
      setAddNote('')
      void queryClient.invalidateQueries({ queryKey: ['credit-balance'] })
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
      void queryClient.invalidateQueries({ queryKey: ['creatives'] })

      // When adding credits, restore CDN bundles for creatives that were paused
      // (admin_add_credits SQL restores status to active, but bundle files need re-upload)
      if (parsed > 0) {
        void restoreCdnBundles(advertiserId)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add credits')
    } finally {
      setIsAdding(false)
    }
  }

  async function restoreCdnBundles(advertiserId: string) {
    // Find active creatives with rendered_html but no bundle_url (were paused due to credits)
    const { data: creatives } = await supabase
      .from('creatives')
      .select('id, rendered_html, width, height')
      .eq('advertiser_id', advertiserId)
      .eq('status', 'active')
      .is('bundle_url', null)
      .not('rendered_html', 'is', null)

    if (!creatives || creatives.length === 0) return

    let restored = 0
    for (const c of creatives) {
      const bundleJs = generateCdnBundle({
        renderedHtml: c.rendered_html!,
        width: c.width || 300,
        height: c.height || 250,
      })
      const { error: uploadError } = await supabase.storage
        .from('ad-bundles')
        .upload(`${c.id}.js`, new Blob([bundleJs], { type: 'application/javascript' }), {
          upsert: true,
          cacheControl: '3600',
        })
      if (uploadError) {
        console.warn('CDN bundle restore failed for', c.id, uploadError.message)
        continue
      }
      const bundleUrl = getBundleUrl(c.id)
      await supabase.from('creatives').update({ bundle_url: bundleUrl }).eq('id', c.id)
      restored++
    }
    if (restored > 0) {
      toast.success(`Restored ${restored} CDN bundle${restored > 1 ? 's' : ''}.`)
    }
  }

  const [datePreset, setDatePreset] = useState<DateRangePreset>('30d')
  const { start, end } = getDateRange(datePreset)
  const { summaryRows, creativeRows, isLoading: consumptionLoading } = useCreativeConsumption(start, end)

  // On success redirect, invalidate credit balance and poll for update
  useEffect(() => {
    if (!isSuccess || successCleanupRef.current) return
    successCleanupRef.current = true

    // Immediately invalidate to get fresh balance
    queryClient.invalidateQueries({ queryKey: ['credit-balance'] })
    queryClient.invalidateQueries({ queryKey: ['transactions'] })

    // Set up a short polling interval to catch webhook fulfillment
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['credit-balance'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    }, 3000)

    // After 5 seconds, clean up URL params
    const urlTimeout = setTimeout(() => {
      window.history.replaceState({}, '', '/billing')
    }, 5000)

    // Stop fast-polling after 30 seconds
    const pollTimeout = setTimeout(() => {
      clearInterval(interval)
    }, 30_000)

    return () => {
      clearInterval(interval)
      clearTimeout(urlTimeout)
      clearTimeout(pollTimeout)
    }
  }, [isSuccess, queryClient])

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your impression credits and view purchase history
        </p>
      </div>

      {/* Success banner */}
      {isSuccess && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/10 p-4 text-primary">
          <CheckCircle className="size-5 shrink-0" />
          <div>
            <p className="font-medium">Payment successful!</p>
            <p className="text-sm opacity-80">
              Your credits are being added to your account.
            </p>
          </div>
        </div>
      )}

      {/* Canceled banner */}
      {isCanceled && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted p-4 text-muted-foreground">
          <XCircle className="size-5 shrink-0" />
          <div>
            <p className="font-medium text-foreground">Checkout was canceled.</p>
            <p className="text-sm">No charges were made.</p>
          </div>
        </div>
      )}

      {/* Balance summary card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Available Impression Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">
            {balanceLoading
              ? '---'
              : balanceFormatter.format(balance ?? 0)}
          </p>
        </CardContent>
      </Card>

      {/* Consumption section — BILL-06, BILL-07, BILL-08, BILL-09 */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Consumption</h2>
            <p className="text-muted-foreground text-sm">
              Credits used by creative type for the selected period
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DateRangeSelect value={datePreset} onChange={setDatePreset} />
            <BillingExportButton
              summaryRows={summaryRows}
              creativeRows={creativeRows}
              dateRange={datePreset}
            />
          </div>
        </div>

        <ConsumptionSummary rows={summaryRows} loading={consumptionLoading} />

        <div className="mt-6">
          <h3 className="mb-3 text-base font-medium">Per-Creative Performance</h3>
          <CreativeConsumptionTable data={creativeRows} loading={consumptionLoading} />
        </div>
      </section>

      {/* Credits section — super admin adds manually, others buy via Stripe */}
      {isAdmin ? (
        <section id="add-credits">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Manage Credits</h2>
            <p className="text-muted-foreground text-sm">
              Add or deduct impression credits for the selected organization.
            </p>
          </div>
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <form onSubmit={(e) => void handleAddCredits(e)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="add-credits-amount">Credits</Label>
                  <Input
                    id="add-credits-amount"
                    type="number"
                    step="1"
                    placeholder="e.g. 10000 or -5000"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="add-credits-note">
                    Note <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="add-credits-note"
                    placeholder="e.g. Trial package, correction, manual top-up"
                    value={addNote}
                    onChange={(e) => setAddNote(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={isAdding || !effectiveAdvertiserId}>
                  <PlusCircle className="mr-2 size-4" />
                  {isAdding ? 'Processing...' : 'Apply Credits'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Use a positive number to add, negative to deduct.
                </p>
              </form>
            </CardContent>
          </Card>
        </section>
      ) : (
        <section id="credit-packs">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Purchase Credits</h2>
            <p className="text-muted-foreground text-sm">
              Select a credit pack to purchase. Credits never expire.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {CREDIT_PACKS.map((pack) => (
              <CreditPackCard
                key={pack.packId}
                packId={pack.packId}
                credits={pack.credits}
                label={pack.label}
                price={pack.price}
                popular={pack.popular}
                onPurchase={(packId) => createCheckout.mutate(packId)}
                loading={createCheckout.isPending}
              />
            ))}
          </div>
        </section>
      )}

      {/* Transaction history section */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Transaction History</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <TransactionTable
              transactions={transactions ?? []}
              loading={txLoading}
            />
          </CardContent>
        </Card>
      </section>

      {/* Free tier note */}
      <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-4">
        <Info className="text-muted-foreground mt-0.5 size-5 shrink-0" />
        <div>
          <p className="text-sm font-medium">
            Creating and previewing ads is always free
          </p>
          <p className="text-muted-foreground text-sm">
            Credits are only consumed when your ads are served to real users.
            You can build and preview unlimited ad creatives at no cost.
          </p>
        </div>
      </div>
    </div>
  )
}
