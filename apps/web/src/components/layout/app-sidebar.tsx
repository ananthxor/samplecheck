import { Link, useLocation } from 'react-router'
import {
  LayoutDashboard,
  Palette,
  Megaphone,
  BarChart3,
  FileText,
  Crosshair,
  CreditCard,
  BookOpen,
  Settings,
  Users,
  LogOut,
  ChevronsUpDown,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import type { LucideIcon } from 'lucide-react'

interface NavItem {
  title: string
  url: string
  icon: LucideIcon
}

const platformNavItems: NavItem[] = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Creatives', url: '/creatives', icon: Palette },
  { title: 'Campaigns', url: '/campaigns', icon: Megaphone },
  { title: 'Trackers', url: '/trackers', icon: Crosshair },
  { title: 'Analytics', url: '/analytics', icon: BarChart3 },
  { title: 'Reports', url: '/reports', icon: FileText },
  { title: 'Billing', url: '/billing', icon: CreditCard },
  { title: 'Guide', url: '/guide', icon: BookOpen },
]

const accountNavItems: NavItem[] = [
  { title: 'Settings', url: '/settings', icon: Settings },
]

const adminNavItems: NavItem[] = [
  { title: 'Users', url: '/admin/users', icon: Users },
]

function getInitials(email: string): string {
  const parts = email.split('@')
  const name = parts[0] ?? ''
  if (name.includes('.')) {
    const [first, last] = name.split('.')
    return ((first?.[0] ?? '') + (last?.[0] ?? '')).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function AppSidebar() {
  const location = useLocation()
  const { user, isAdmin, isOrgAdmin, signOut } = useAuth()
  const userEmail = user?.email ?? ''

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="ScrollToday">
              <Link to="/">
                {/* Icon for collapsed (icon-only) mode */}
                <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg overflow-hidden">
                  <img
                    src="/favicon.ico"
                    alt="ScrollToday"
                    className="size-8 object-contain"
                    style={{ backgroundRepeat: 'no-repeat', backgroundSize: '24px 24px', backgroundPosition: 'center', backgroundImage: 'linear-gradient(white, white)' }}
                  />
                </div>
                {/* Full wordmark for expanded mode */}
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-lg font-bold tracking-tight">
                    <span className="text-white">Scroll</span>
                    <span className="text-primary">Today</span>
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/50">
                    Ad Platform
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-[0.5px] text-sidebar-foreground/40">
            Platform
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {platformNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-[0.5px] text-sidebar-foreground/40">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(isAdmin || isOrgAdmin) && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-[0.5px] text-sidebar-foreground/40">
              {isAdmin ? 'Admin' : 'Organization'}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Team page: visible to org_admin and super_admin */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === '/team'}
                    tooltip="Team"
                  >
                    <Link to="/team">
                      <Users />
                      <span>Team</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Users page: super_admin only — all users across all orgs */}
                {isAdmin && adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url}
                      tooltip={item.title}
                    >
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  tooltip={userEmail}
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">
                      {getInitials(userEmail)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate text-xs text-muted-foreground">
                      {userEmail}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void signOut()}>
                  <LogOut />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
