import { useLocation } from 'react-router'
import { SearchIcon, Building2 } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/auth-context'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { CreditBalanceBadge } from '@/features/billing/components/credit-balance-badge'
import { LowBalanceWarning } from '@/features/billing/components/low-balance-warning'

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/settings': 'Settings',
  '/creatives': 'Creatives',
  '/campaigns': 'Campaigns',
  '/analytics': 'Analytics',
  '/billing': 'Billing',
  '/admin': 'Admin',
  '/admin/users': 'Users',
}

function getBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  if (pathname === '/') {
    return [{ label: 'Dashboard' }]
  }

  const segments = pathname.split('/').filter(Boolean)
  const crumbs: { label: string; href?: string }[] = []

  let path = ''
  for (let i = 0; i < segments.length; i++) {
    path += '/' + segments[i]
    const label = routeLabels[path] ?? segments[i]!
    const isLast = i === segments.length - 1

    crumbs.push({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      href: isLast ? undefined : path,
    })
  }

  return crumbs
}

export function AppHeader() {
  const location = useLocation()
  const breadcrumbs = getBreadcrumbs(location.pathname)
  const { isAdmin, activeAdvertiserId, setActiveAdvertiserId, advertisers } = useAuth()

  return (
    <header data-slot="site-header" className="flex h-16 shrink-0 items-center gap-2 px-4 bg-white shadow-[0_1px_0_hsl(214_32%_88%),0_2px_12px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.label} className="contents">
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {crumb.href ? (
                    <BreadcrumbLink href={crumb.href}>
                      {crumb.label}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="ml-auto flex items-center gap-3">
        {isAdmin && advertisers.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-md border bg-muted/30 px-2.5 py-1">
            <Building2 className="text-muted-foreground size-3.5 shrink-0" />
            <select
              value={activeAdvertiserId ?? ''}
              onChange={(e) => setActiveAdvertiserId(e.target.value || null)}
              className="border-input bg-background h-7 rounded border px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All Organizations</option>
              {advertisers.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        )}
        <CreditBalanceBadge />
        <button
          type="button"
          className="flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent cursor-pointer"
          aria-label="Search"
          onClick={() => {
            document.dispatchEvent(
              new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }),
            )
          }}
        >
          <SearchIcon className="size-4" />
        </button>
        <LowBalanceWarning />
      </div>
    </header>
  )
}
