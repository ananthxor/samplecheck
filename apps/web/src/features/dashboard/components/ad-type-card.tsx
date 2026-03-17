import { Link } from 'react-router'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { AdType } from '../data/ad-types'

interface AdTypeCardProps {
  adType: AdType
}

export function AdTypeCard({ adType }: AdTypeCardProps) {
  const Icon = adType.icon

  return (
    <Link to={`/creatives/new/${adType.slug}`} className="group block">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{adType.name}</CardTitle>
              <Badge variant="secondary" className="mt-1">
                {adType.formats.length} format
                {adType.formats.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription>{adType.description}</CardDescription>
          <ul className="mt-3 space-y-1">
            {adType.formats.slice(0, 3).map((format) => (
              <li key={format.id} className="text-sm text-muted-foreground">
                {format.name}
              </li>
            ))}
            {adType.formats.length > 3 && (
              <li className="text-sm text-muted-foreground">
                +{adType.formats.length - 3} more
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </Link>
  )
}
