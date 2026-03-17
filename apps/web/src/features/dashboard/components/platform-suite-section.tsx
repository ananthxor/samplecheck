import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PLATFORM_SUITE } from '../data/ad-types'

export function PlatformSuiteSection() {
  return (
    <section>
      <Separator className="mb-8" />
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Platform Suite</h2>
        <p className="mt-1 text-muted-foreground">
          Expand your reach with our upcoming products
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {PLATFORM_SUITE.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.id} className="opacity-75">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      Coming Soon
                    </Badge>
                  </div>
                </div>
                <CardDescription className="mt-2">
                  {item.description}
                </CardDescription>
              </CardHeader>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
