import { AD_TYPES } from '../data/ad-types'
import { AdTypeCard } from './ad-type-card'

export function AdTypeGrid() {
  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Ad Types</h2>
        <p className="mt-1 text-muted-foreground">
          Choose an ad type to browse templates and start creating
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {AD_TYPES.map((adType) => (
          <AdTypeCard key={adType.id} adType={adType} />
        ))}
      </div>
    </section>
  )
}
