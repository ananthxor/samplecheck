import { Outlet } from 'react-router'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { AppHeader } from './app-header'
import { AppFooter } from './app-footer'
import { SearchDialog } from './search-dialog'

export function AppShell() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1 min-h-0 flex-col overflow-auto p-4 md:p-6">
          <Outlet />
        </div>
        <AppFooter />
      </SidebarInset>
      <SearchDialog />
    </SidebarProvider>
  )
}
