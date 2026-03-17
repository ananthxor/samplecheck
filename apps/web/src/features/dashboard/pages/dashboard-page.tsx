import { AdTypeGrid } from '../components/ad-type-grid'
import { PlatformSuiteSection } from '../components/platform-suite-section'

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome to ScrollToday
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Build and launch interactive, engagement-driven ad creatives in
          minutes
        </p>
      </div>
      <AdTypeGrid />
      <PlatformSuiteSection />
    </div>
  )
}
