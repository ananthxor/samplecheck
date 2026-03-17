---
phase: 09-billing-credit-system
plan: 02
subsystem: billing-ui
tags: [tanstack-query, supabase, react, polling, toast, sonner, lucide-react, credit-balance]

# Dependency graph
requires:
  - phase: 09-billing-credit-system
    plan: 01
    provides: "credit_transactions table, add_impression_credits function, create-checkout Edge Function, stripe-webhook Edge Function"
  - phase: 01-foundation-data-schema
    provides: "advertisers table with credit_balance column, Supabase client, database types"
  - phase: 03-dashboard-shell
    provides: "AppHeader component, AppShell layout, sidebar navigation"
provides:
  - "Billing API layer: fetchCreditBalance, fetchTransactions, createCheckoutSession"
  - "useCreditBalance hook with 30-second polling via TanStack Query refetchInterval"
  - "useTransactions hook for credit transaction history"
  - "useCreateCheckout mutation hook for Stripe Checkout redirect"
  - "CreditBalanceBadge component in app header with formatted balance and /billing link"
  - "LowBalanceWarning component with 10% threshold toast detection and deduplication"
affects: [09-billing-page, 10-analytics]

# Tech tracking
tech-stack:
  added: []
  patterns: [refetchInterval-polling, invisible-toast-effect-component, threshold-detection-with-ref-dedup]

key-files:
  created:
    - apps/web/src/features/billing/api/billing-api.ts
    - apps/web/src/features/billing/hooks/use-credit-balance.ts
    - apps/web/src/features/billing/hooks/use-billing.ts
    - apps/web/src/features/billing/components/credit-balance-badge.tsx
    - apps/web/src/features/billing/components/low-balance-warning.tsx
  modified:
    - apps/web/src/components/layout/app-header.tsx

key-decisions:
  - "Intl.NumberFormat('en-US') for credit balance formatting with thousands separators"
  - "LowBalanceWarning uses useRef to track last warning balance, preventing re-triggering on unchanged poll cycles"
  - "toast.dismiss('low-balance') clears warning when balance recovers above threshold"

patterns-established:
  - "Polling hook: TanStack Query refetchInterval for near-real-time data without WebSocket"
  - "Invisible effect component: renders null, manages side-effects via useEffect (LowBalanceWarning pattern)"
  - "Threshold toast: sonner id-based deduplication with Infinity duration for persistent warnings"

requirements-completed: [BILL-02, BILL-04]

# Metrics
duration: 2min
completed: 2026-02-24
---

# Phase 9 Plan 2: Billing Frontend Summary

**Credit balance badge in app header with 30-second TanStack Query polling, billing API layer with Supabase queries, and low-balance warning toast at 10% threshold**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-24T08:03:06Z
- **Completed:** 2026-02-24T08:05:17Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Created billing API layer with fetchCreditBalance, fetchTransactions, and createCheckoutSession functions
- Built useCreditBalance hook with 30-second polling (refetchInterval: 30_000) and 10-second staleTime
- Built useTransactions and useCreateCheckout hooks following existing creatives pattern
- Created CreditBalanceBadge component with Coins icon, Intl.NumberFormat formatting, and Link to /billing
- Created LowBalanceWarning invisible component that fires persistent toast when balance drops below 10% of last purchase
- Integrated both components into AppHeader right section

## Task Commits

Each task was committed atomically:

1. **Task 1: Billing API layer and TanStack Query hooks** - `a828f9d` (feat)
2. **Task 2: Credit balance badge in header and low-balance warning toast** - `5779611` (feat)

**Plan metadata:** [pending] (docs: complete plan)

## Files Created/Modified

- `apps/web/src/features/billing/api/billing-api.ts` - Supabase queries for credit balance, transactions, and Stripe checkout session
- `apps/web/src/features/billing/hooks/use-credit-balance.ts` - TanStack Query hook with 30s polling for credit balance
- `apps/web/src/features/billing/hooks/use-billing.ts` - TanStack Query hooks for transactions and checkout mutation
- `apps/web/src/features/billing/components/credit-balance-badge.tsx` - Compact badge with Coins icon, formatted number, and /billing link
- `apps/web/src/features/billing/components/low-balance-warning.tsx` - Invisible component managing low-balance toast side-effect
- `apps/web/src/components/layout/app-header.tsx` - Added CreditBalanceBadge and LowBalanceWarning to header right section

## Decisions Made

1. **Intl.NumberFormat for balance formatting** -- Used `Intl.NumberFormat('en-US').format()` for consistent thousands separators (e.g., 50,000). Preferred over `.toLocaleString()` for explicit locale control.
2. **useRef for toast deduplication** -- LowBalanceWarning tracks `lastWarningBalance` via useRef to avoid re-triggering the toast on every 30-second poll cycle when balance hasn't changed. Only fires when balance actually changes to a new below-threshold value.
3. **toast.dismiss on recovery** -- When balance goes above threshold, the warning toast is explicitly dismissed via `toast.dismiss('low-balance')`, providing clean UX when credits are topped up.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. All billing backend dependencies (Edge Functions, database tables) were deployed in Plan 09-01.

## Next Phase Readiness

Plan 09-02 frontend data layer is complete. Ready for:
- **09-03**: Billing page with credit pack purchase cards, transaction history table, and payment success/cancel handling. Will consume useTransactions, useCreateCheckout, and useCreditBalance hooks.
- **Phase 10**: Analytics dashboard can independently consume the billing data layer.

**No blockers for downstream plans.**

## Self-Check: PASSED

All claimed artifacts verified:

| Artifact | Status |
|----------|--------|
| Commit a828f9d | FOUND |
| Commit 5779611 | FOUND |
| apps/web/src/features/billing/api/billing-api.ts | FOUND |
| apps/web/src/features/billing/hooks/use-credit-balance.ts | FOUND |
| apps/web/src/features/billing/hooks/use-billing.ts | FOUND |
| apps/web/src/features/billing/components/credit-balance-badge.tsx | FOUND |
| apps/web/src/features/billing/components/low-balance-warning.tsx | FOUND |
| apps/web/src/components/layout/app-header.tsx (modified) | FOUND |
| TypeScript compilation | PASSED (zero errors) |

---
*Phase: 09-billing-credit-system*
*Completed: 2026-02-24*
