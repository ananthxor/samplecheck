import { ExternalLink } from 'lucide-react'
import type { Tables } from '@scrolltoday/shared'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

type CreditTransaction = Tables<'credit_transactions'>

const TYPE_COLORS: Record<string, string> = {
  purchase: 'bg-green-100 text-green-800 border-green-200',
  adjustment: 'bg-blue-100 text-blue-800 border-blue-200',
  refund: 'bg-red-100 text-red-800 border-red-200',
}

interface TransactionTableProps {
  transactions: CreditTransaction[]
  loading?: boolean
}

export function TransactionTable({
  transactions,
  loading,
}: TransactionTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        <p>No transactions yet.</p>
        <p className="mt-1 text-sm">
          Purchase credits to get started.{' '}
          <a href="#credit-packs" className="text-primary underline">
            View credit packs
          </a>
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Credits</TableHead>
          <TableHead className="text-right">Balance After</TableHead>
          <TableHead>Receipt</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx) => (
          <TableRow key={tx.id}>
            <TableCell>
              {new Date(tx.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={TYPE_COLORS[tx.type] ?? ''}
              >
                {tx.type}
              </Badge>
            </TableCell>
            <TableCell className="text-right font-medium">
              {tx.amount > 0 ? '+' : ''}
              {tx.amount.toLocaleString()}
            </TableCell>
            <TableCell className="text-right">
              {tx.balance_after != null
                ? tx.balance_after.toLocaleString()
                : '---'}
            </TableCell>
            <TableCell>
              {tx.receipt_url ? (
                <a
                  href={tx.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex items-center gap-1 hover:underline"
                >
                  <ExternalLink className="size-3.5" />
                  View
                </a>
              ) : (
                <span className="text-muted-foreground">---</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
