import { Loader2 } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CreditPackCardProps {
  packId: string
  credits: number
  label: string
  price: string
  popular?: boolean
  onPurchase: (packId: string) => void
  loading?: boolean
}

export function CreditPackCard({
  packId,
  credits,
  label,
  price,
  popular,
  onPurchase,
  loading,
}: CreditPackCardProps) {
  return (
    <Card
      className={cn(
        'relative transition-shadow hover:shadow-lg',
        popular && 'border-primary border-2'
      )}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge>Most Popular</Badge>
        </div>
      )}
      <CardHeader className="text-center">
        <CardTitle className="text-lg">{label}</CardTitle>
        <CardDescription className="text-base">
          {credits.toLocaleString()} Impressions
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-3xl font-bold">{price}</p>
        <p className="text-muted-foreground mt-1 text-sm">one-time purchase</p>
      </CardContent>
      <CardFooter className="justify-center">
        <Button
          className="w-full"
          onClick={() => onPurchase(packId)}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" />
              Processing...
            </>
          ) : (
            'Buy Now'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
