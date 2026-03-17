---
phase: 03-dashboard-navigation-shell
plan: 01
subsystem: ui
tags: [shadcn-ui, sidebar, react-router, tailwind-css-4, layout-routes, lucide-react]

# Dependency graph
requires:
  - phase: 02-authentication-admin
    provides: AuthProvider, ProtectedRoute, AdminRoute, useAuth hook, SettingsPage, AdminUsersPage
provides:
  - AppShell layout route wrapping all authenticated pages
  - Collapsible sidebar with Platform, Account, Admin nav groups
  - AppHeader with breadcrumb and search trigger placeholder
  - AppFooter with 5 placeholder links
  - 15 shadcn/ui component primitives (sidebar, command, card, button, etc.)
  - SectionPlaceholder for future phase pages
  - Full neutral theme CSS variables for Tailwind CSS 4
affects: [03-02-dashboard-search, 04-template-editor, all-future-ui-phases]

# Tech tracking
tech-stack:
  added: [lucide-react, cmdk, tw-animate-css, class-variance-authority, shadcn/ui-sidebar, shadcn/ui-command, shadcn/ui-card, shadcn/ui-button, shadcn/ui-avatar, shadcn/ui-dropdown-menu, shadcn/ui-tooltip, shadcn/ui-separator, shadcn/ui-badge, shadcn/ui-input, shadcn/ui-skeleton, shadcn/ui-sheet, shadcn/ui-breadcrumb, shadcn/ui-collapsible, shadcn/ui-dialog]
  patterns: [layout-route-pattern, sidebar-provider-pattern, breadcrumb-from-pathname, shadcn-component-composition]

key-files:
  created:
    - apps/web/src/components/layout/app-shell.tsx
    - apps/web/src/components/layout/app-sidebar.tsx
    - apps/web/src/components/layout/app-header.tsx
    - apps/web/src/components/layout/app-footer.tsx
    - apps/web/src/components/ui/sidebar.tsx
    - apps/web/src/components/ui/command.tsx
    - apps/web/src/components/ui/card.tsx
    - apps/web/src/hooks/use-mobile.ts
  modified:
    - apps/web/src/router.tsx
    - apps/web/src/index.css
    - apps/web/src/features/auth/pages/settings-page.tsx
    - apps/web/src/features/admin/pages/admin-users-page.tsx
    - apps/web/package.json

key-decisions:
  - "SidebarProvider includes TooltipProvider internally -- no separate TooltipProvider wrapper needed in AppShell"
  - "SidebarInset used as main content wrapper instead of raw div for proper sidebar spacing behavior"
  - "Breadcrumbs derived from pathname using static route-to-label mapping"
  - "Search trigger is a visual-only button placeholder (search dialog built in Plan 02)"
  - "shadcn CLI wrote files to @/ literal directory -- moved to src/ during execution"

patterns-established:
  - "Layout route pattern: ProtectedRoute > AppShell > page children"
  - "Sidebar nav items: array of {title, url, icon} with SidebarMenuButton asChild + Link"
  - "Page components render content only -- no full-page wrappers (AppShell provides chrome)"
  - "CSS theme variables in @theme inline block for Tailwind CSS 4 integration"

# Metrics
duration: 12min
completed: 2026-02-19
---

# Phase 3 Plan 1: Navigation Shell Summary

**Collapsible sidebar navigation shell with shadcn/ui components, breadcrumb header, footer links, and layout route pattern wrapping all authenticated pages**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-19T19:48:00Z
- **Completed:** 2026-02-19T20:00:00Z
- **Tasks:** 2
- **Files modified:** 22

## Accomplishments
- Installed 15 shadcn/ui component primitives and 4 runtime dependencies with full neutral theme CSS variables
- Built AppShell layout (sidebar + header + footer) using SidebarProvider pattern from shadcn/ui
- Collapsible sidebar with icon mode (Cmd/Ctrl+B toggle), 6 platform nav items, admin group, user dropdown
- Refactored router to layout route pattern; existing pages (Settings, Admin Users) render inside shell without double backgrounds
- Placeholder pages for Creatives, Campaigns, Analytics, Billing ready for future phases

## Task Commits

Each task was committed atomically:

1. **Task 1: Install shadcn/ui components and configure CSS theme variables** - `fd885cf` (chore)
2. **Task 2: Create AppShell layout, sidebar, header, footer, refactor router and existing pages** - `9fbb494` (feat)

## Files Created/Modified
- `apps/web/src/components/layout/app-shell.tsx` - Root layout: SidebarProvider + AppSidebar + SidebarInset + AppHeader + Outlet + AppFooter
- `apps/web/src/components/layout/app-sidebar.tsx` - Sidebar with Platform/Account/Admin nav groups, user dropdown with avatar
- `apps/web/src/components/layout/app-header.tsx` - Header with SidebarTrigger, breadcrumb, search placeholder button
- `apps/web/src/components/layout/app-footer.tsx` - Footer with 5 placeholder links and copyright
- `apps/web/src/components/ui/sidebar.tsx` - shadcn/ui Sidebar component (fixed import path from @/components/lib/utils to @/lib/utils)
- `apps/web/src/components/ui/*.tsx` - 14 additional shadcn/ui component primitives
- `apps/web/src/hooks/use-mobile.ts` - Mobile breakpoint detection hook for sidebar responsive behavior
- `apps/web/src/index.css` - Full neutral theme CSS variables with sidebar variables and @theme inline block
- `apps/web/src/router.tsx` - Layout route pattern: ProtectedRoute > AppShell > authenticated children
- `apps/web/src/features/auth/pages/settings-page.tsx` - Removed min-h-screen/bg-gray-50 wrapper
- `apps/web/src/features/admin/pages/admin-users-page.tsx` - Removed min-h-screen/bg-gray-50 wrapper
- `apps/web/package.json` - Added lucide-react, cmdk, tw-animate-css, class-variance-authority + Radix peer deps

## Decisions Made
- SidebarProvider already includes TooltipProvider internally, so no separate wrapper needed in AppShell
- Used SidebarInset as the main content area wrapper (provides proper sidebar spacing and flex layout)
- Breadcrumbs derived from pathname via static route-to-label mapping (simple, sufficient for current routes)
- Search trigger renders as visual placeholder button only -- actual CommandDialog search built in Plan 02
- change-password route kept outside AppShell (full-screen forced password change, no navigation distractions)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] shadcn CLI created files in @/ literal directory instead of src/**
- **Found during:** Task 1 (shadcn/ui component installation)
- **Issue:** The shadcn CLI interpreted the `@/components/ui` alias in components.json literally, creating files at `apps/web/@/components/ui/` instead of `apps/web/src/components/ui/`
- **Fix:** Moved all 15 component files and use-mobile.ts hook from `@/` to `src/` directories, removed empty `@/` directory
- **Files modified:** All shadcn/ui component files, use-mobile.ts
- **Verification:** TypeScript compiles, build succeeds
- **Committed in:** fd885cf (Task 1 commit)

**2. [Rule 1 - Bug] Fixed sidebar.tsx import path**
- **Found during:** Task 1 (post-installation verification)
- **Issue:** sidebar.tsx imported from `@/components/lib/utils` which doesn't exist; correct path is `@/lib/utils`
- **Fix:** Changed import path to `@/lib/utils`
- **Files modified:** apps/web/src/components/ui/sidebar.tsx
- **Verification:** TypeScript compiles
- **Committed in:** fd885cf (Task 1 commit)

**3. [Rule 2 - Missing Critical] Added full neutral theme CSS variables**
- **Found during:** Task 1 (CSS verification)
- **Issue:** shadcn CLI only added sidebar-specific CSS variables to index.css; missing core variables (background, foreground, primary, secondary, etc.) needed by all shadcn/ui components
- **Fix:** Added complete neutral theme `:root` and `.dark` variable blocks plus `@theme inline` mappings and `tw-animate-css` import
- **Files modified:** apps/web/src/index.css
- **Verification:** Build succeeds, components render with proper theming
- **Committed in:** fd885cf (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (1 bug, 1 missing critical, 1 blocking)
**Impact on plan:** All auto-fixes were necessary for correct component installation. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Navigation shell is complete and wrapping all authenticated routes
- Plan 02 (Dashboard page, search dialog, ad type cards) can build directly inside the AppShell outlet
- All shadcn/ui primitives needed for Plan 02 are installed and working
- Placeholder pages ready to be replaced by actual implementations in their respective phases

## Self-Check: PASSED

All 11 claimed files verified to exist on disk. Both task commits (fd885cf, 9fbb494) verified in git log.

---
*Phase: 03-dashboard-navigation-shell*
*Completed: 2026-02-19*
