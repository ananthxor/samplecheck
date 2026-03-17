# Phase 3: Dashboard & Navigation Shell - Research

**Researched:** 2026-02-19
**Domain:** Application shell (sidebar navigation, dashboard layout, search, footer), shadcn/ui components, react-router layout routes, static ad type data model
**Confidence:** HIGH

## Summary

Phase 3 transforms the bare Phase 2 placeholder (a temporary nav bar and centered "Coming in Phase 3" text) into a proper application shell: collapsible sidebar navigation, a dashboard home page with ad type browsing cards, a command-palette search, a Platform Suite promotional section, and a footer with placeholder links. This is a purely frontend phase with no new backend/database work -- all data (ad types, navigation items, platform suite products, footer links) is static/hardcoded in this phase.

The existing codebase already has react-router v7 with `createBrowserRouter`, an `AuthProvider` context, `ProtectedRoute`/`AdminRoute` guards, and shadcn/ui configured (new-york style, neutral base color, CSS variables enabled). The `components.json` is set up but no shadcn/ui components have been installed yet -- only the `cn()` utility exists. The Phase 2 `DashboardPlaceholder` in `router.tsx` and all page components (`SettingsPage`, `AdminUsersPage`) render their own full-page layouts with `min-h-screen bg-gray-50`. Phase 3 must introduce a shared layout shell that wraps all authenticated routes, then refactor existing pages to remove their standalone layout wrappers.

The shadcn/ui Sidebar component is the correct foundation for the navigation shell. It provides `SidebarProvider`, `Sidebar`, `SidebarContent`, `SidebarHeader`, `SidebarFooter`, `SidebarGroup`, `SidebarMenu*` components, collapsible behavior (icon mode for collapsed state), mobile sheet overlay, keyboard toggle (Cmd+B), and integrates cleanly with react-router via the `asChild` prop on `SidebarMenuButton` combined with `useLocation` for active state detection. The `SidebarInset` component wraps the main content area alongside the sidebar.

**Primary recommendation:** Install the shadcn/ui Sidebar, Command, Card, Badge, Separator, Tooltip, Avatar, DropdownMenu, Input, Skeleton, Sheet, and Button components. Create an `AppShell` layout route that wraps all authenticated routes using `SidebarProvider` + `Sidebar` + `SidebarInset` + `Outlet`. Build the dashboard home page with a responsive card grid for ad types (static data), a Platform Suite section, and a footer. Implement search as a Command palette dialog triggered by Ctrl+K.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UI-01 | Dashboard with ad type cards for browsing (matching Airtory-style layout) | Static ad type data (7 types with 14 formats); card grid layout using shadcn/ui Card components; each card links to template browsing (placeholder route for Phase 4) |
| UI-02 | Sidebar navigation to all platform sections | shadcn/ui Sidebar component with collapsible icon mode; menu groups for main sections (Dashboard, Creatives, Campaigns, Analytics, Billing) and admin section (Users); react-router Link via `asChild` prop |
| UI-03 | Footer with placeholder links (support, showcase, policies) | Static footer component inside `SidebarInset` main area; links render as `<a>` tags pointing to `#` or placeholder routes; no actual content pages yet |
| UI-04 | Search functionality across ad formats and platform sections | shadcn/ui Command component as dialog (Ctrl+K trigger); static searchable items list (ad formats + navigation sections); `onSelect` navigates via react-router |
| UI-05 | Platform Suite section with placeholder cards (Audio, ADCTV, Social Display) | Section on dashboard page below ad type cards; styled as "coming soon" cards with distinctive visual treatment; non-clickable or linking to placeholder |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| shadcn/ui Sidebar | latest (via CLI) | Collapsible sidebar navigation with icon mode, mobile sheet, keyboard shortcut | Official shadcn/ui component built on Radix primitives; provides SidebarProvider, SidebarMenu*, SidebarGroup, SidebarRail, useSidebar hook; integrates with react-router via `asChild` |
| shadcn/ui Command | latest (via CLI) | Search/command palette dialog (Ctrl+K) | Built on cmdk library; provides CommandDialog, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty; keyboard-navigable with grouping |
| shadcn/ui Card | latest (via CLI) | Ad type browsing cards, Platform Suite cards | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction components |
| lucide-react | ^0.564.x | Icon library for sidebar items, cards, search | Tree-shakable SVG icons; shadcn/ui's default icon library; each icon is a typed React component |
| react-router (existing) | ^7.13.0 | Layout routes with Outlet for shared shell | Already installed; `createBrowserRouter` already used; add layout route wrapping authenticated children |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui Button | latest | Action buttons, sidebar trigger | General-purpose button across the shell |
| shadcn/ui Avatar | latest | User avatar in sidebar footer/header | Display user initials in sidebar user section |
| shadcn/ui DropdownMenu | latest | User menu (profile, settings, sign out) | Sidebar footer user dropdown |
| shadcn/ui Tooltip | latest | Collapsed sidebar icon tooltips | Required by Sidebar component for icon-mode labels |
| shadcn/ui Separator | latest | Visual dividers between sidebar sections | Between menu groups and in footer |
| shadcn/ui Badge | latest | Status indicators, card labels | Ad type card category labels |
| shadcn/ui Input | latest | Search input in header area | Visible search trigger that opens Command dialog |
| shadcn/ui Skeleton | latest | Loading states for cards | Dashboard card loading placeholders |
| shadcn/ui Sheet | latest | Mobile sidebar overlay | Dependency of Sidebar component for mobile behavior |
| shadcn/ui Breadcrumb | latest | Page location indicator in header | Shows current section in top bar (e.g., Dashboard > Ad Types) |
| tw-animate-css | latest | Animation utilities for Tailwind | Required by shadcn/ui for transitions and animations |
| class-variance-authority | latest | Component variant management | Required by shadcn/ui Button and other components with variants |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn/ui Sidebar | Custom sidebar with Tailwind | shadcn/ui Sidebar handles collapsible state, mobile overlay, keyboard shortcut, cookie persistence, icon mode out of the box -- building this from scratch would take days |
| shadcn/ui Command (cmdk) | Custom search with Input + Popover | cmdk provides fuzzy matching, keyboard navigation, grouping, empty states for free -- hand-rolling search is error-prone |
| lucide-react | heroicons or @radix-ui/react-icons | lucide-react is shadcn/ui's default; largest icon set (1500+); tree-shakable; other icon libraries work but require more integration effort |
| Static ad type data | Supabase table for ad types | No database table for ad types exists yet; ad type/format hierarchy is static seed data defined in constants; DB-backed browsing comes in Phase 4 with templates |

**Installation:**
```bash
# From apps/web directory
pnpm add lucide-react cmdk tw-animate-css class-variance-authority

# Add shadcn/ui components (CLI handles Radix dependencies)
pnpx shadcn@latest add sidebar command card button avatar dropdown-menu tooltip separator badge input skeleton sheet breadcrumb collapsible
```

**Note:** The shadcn CLI (`pnpx shadcn@latest add`) reads `components.json` (already configured at `apps/web/components.json`) and copies component source files into `src/components/ui/`. It also installs any required Radix UI peer dependencies automatically. The project already has `clsx` and `tailwind-merge` installed.

## Architecture Patterns

### Recommended Project Structure

```
apps/web/src/
├── components/
│   ├── ui/                     # shadcn/ui primitives (auto-generated by CLI)
│   │   ├── sidebar.tsx
│   │   ├── command.tsx
│   │   ├── card.tsx
│   │   ├── button.tsx
│   │   ├── avatar.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── tooltip.tsx
│   │   ├── separator.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   ├── skeleton.tsx
│   │   ├── sheet.tsx
│   │   ├── breadcrumb.tsx
│   │   └── collapsible.tsx
│   └── layout/                 # Application shell components
│       ├── app-shell.tsx       # Root layout: SidebarProvider + Sidebar + SidebarInset + Outlet
│       ├── app-sidebar.tsx     # Sidebar content: logo, nav groups, user section
│       ├── app-header.tsx      # Top header bar: breadcrumb, search trigger, user info
│       ├── app-footer.tsx      # Footer: placeholder links (support, showcase, policies)
│       └── search-dialog.tsx   # Command palette: search ad formats + platform sections
├── features/
│   ├── dashboard/
│   │   ├── pages/
│   │   │   └── dashboard-page.tsx      # Main dashboard with ad type cards + platform suite
│   │   ├── components/
│   │   │   ├── ad-type-card.tsx         # Individual ad type browsing card
│   │   │   ├── ad-type-grid.tsx         # Responsive grid of ad type cards
│   │   │   └── platform-suite-section.tsx  # Platform Suite placeholder cards
│   │   └── data/
│   │       └── ad-types.ts             # Static ad type/format definitions
│   ├── auth/                   # (existing - pages refactored to remove standalone layouts)
│   └── admin/                  # (existing - pages refactored to remove standalone layouts)
├── contexts/
│   └── auth-context.tsx        # (existing - no changes)
├── hooks/
│   └── use-auth.ts             # (existing - no changes)
├── lib/
│   ├── utils.ts                # (existing - cn() utility)
│   └── supabase.ts             # (existing - no changes)
└── router.tsx                  # Updated: AppShell layout route wrapping all authenticated children
```

### Pattern 1: Layout Route with Shared Shell

**What:** A pathless layout route in react-router that renders the `AppShell` component (sidebar + header + footer + Outlet). All authenticated child routes render inside the Outlet, inheriting the shared navigation shell.

**When to use:** Always for the authenticated application. Every page after login should have the sidebar and header.

**Example:**
```typescript
// router.tsx - Layout route pattern with createBrowserRouter
import { createBrowserRouter } from 'react-router'
import { ProtectedRoute, AdminRoute } from '@/features/auth/components/protected-route'
import { AppShell } from '@/components/layout/app-shell'

export const router = createBrowserRouter([
  {
    path: '/login',
    lazy: async () => {
      const { default: Component } = await import('@/features/auth/pages/login-page')
      return { Component }
    },
  },
  {
    // ProtectedRoute checks auth, redirects to /login or /change-password
    element: <ProtectedRoute />,
    children: [
      {
        path: '/change-password',
        lazy: async () => {
          const { default: Component } = await import('@/features/auth/pages/change-password-page')
          return { Component }
        },
      },
      {
        // AppShell layout route - renders sidebar + header + Outlet
        element: <AppShell />,
        children: [
          {
            index: true,  // renders at "/"
            lazy: async () => {
              const { default: Component } = await import('@/features/dashboard/pages/dashboard-page')
              return { Component }
            },
          },
          {
            path: '/settings',
            lazy: async () => {
              const { default: Component } = await import('@/features/auth/pages/settings-page')
              return { Component }
            },
          },
          {
            element: <AdminRoute />,
            children: [
              {
                path: '/admin/users',
                lazy: async () => {
                  const { default: Component } = await import('@/features/admin/pages/admin-users-page')
                  return { Component }
                },
              },
            ],
          },
          // Future routes for creatives, campaigns, analytics, billing
        ],
      },
    ],
  },
])
```

**Key detail:** The `/change-password` route is outside the `AppShell` wrapper because forced password change should be a full-screen experience without navigation distractions (matching the existing pattern from Phase 2).

### Pattern 2: SidebarProvider + SidebarInset Layout

**What:** The `AppShell` uses `SidebarProvider` at the root, renders `AppSidebar` on the left, and `SidebarInset` wrapping the main content area (header + Outlet + footer).

**When to use:** This is the shell structure for all authenticated pages.

**Example:**
```typescript
// components/layout/app-shell.tsx
import { Outlet } from 'react-router'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { AppHeader } from './app-header'
import { AppFooter } from './app-footer'

export function AppShell() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
        <AppFooter />
      </SidebarInset>
    </SidebarProvider>
  )
}
```

### Pattern 3: Sidebar Navigation with react-router Integration

**What:** Sidebar menu items use `SidebarMenuButton asChild` with react-router `Link` components. Active state is determined by comparing `useLocation().pathname` against each item's path.

**When to use:** For all navigation links in the sidebar.

**Example:**
```typescript
// components/layout/app-sidebar.tsx
import { Link, useLocation } from 'react-router'
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarFooter,
  SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarRail,
} from '@/components/ui/sidebar'
import { LayoutDashboard, Palette, Megaphone, BarChart3, CreditCard, Settings, Users } from 'lucide-react'

const mainNavItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Creatives', url: '/creatives', icon: Palette },
  { title: 'Campaigns', url: '/campaigns', icon: Megaphone },
  { title: 'Analytics', url: '/analytics', icon: BarChart3 },
  { title: 'Billing', url: '/billing', icon: CreditCard },
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {/* Logo / brand */}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
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
      </SidebarContent>
      <SidebarFooter>
        {/* User avatar + dropdown menu */}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
```

### Pattern 4: Command Palette Search

**What:** A search dialog triggered by clicking a search input in the header or pressing Ctrl+K (Cmd+K on Mac). The dialog uses the shadcn/ui Command component to provide fuzzy-filtered search across static lists of ad formats and platform sections.

**When to use:** For UI-04 search functionality.

**Example:**
```typescript
// components/layout/search-dialog.tsx
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  CommandDialog, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { AD_TYPES } from '@/features/dashboard/data/ad-types'

const platformSections = [
  { name: 'Dashboard', url: '/' },
  { name: 'Creatives', url: '/creatives' },
  { name: 'Campaigns', url: '/campaigns' },
  { name: 'Analytics', url: '/analytics' },
  { name: 'Billing', url: '/billing' },
  { name: 'Settings', url: '/settings' },
]

export function SearchDialog() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSelect = useCallback((url: string) => {
    setOpen(false)
    navigate(url)
  }, [navigate])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search ad formats, sections..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Ad Formats">
          {AD_TYPES.flatMap((type) =>
            type.formats.map((format) => (
              <CommandItem
                key={format.id}
                onSelect={() => handleSelect(`/creatives?format=${format.id}`)}
              >
                {format.name} ({type.name})
              </CommandItem>
            ))
          )}
        </CommandGroup>
        <CommandGroup heading="Platform Sections">
          {platformSections.map((section) => (
            <CommandItem
              key={section.url}
              onSelect={() => handleSelect(section.url)}
            >
              {section.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
```

### Pattern 5: Static Ad Type Data Model

**What:** Ad type and format data is defined as a static TypeScript constant array, not fetched from the database. Each ad type has a name, slug, description, icon reference, and array of formats. This data drives the dashboard cards and the search palette.

**When to use:** For Phase 3 dashboard cards and search. In Phase 4, this data will be extended with template associations and may be partially moved to the database.

**Example:**
```typescript
// features/dashboard/data/ad-types.ts
import type { LucideIcon } from 'lucide-react'
import {
  MousePointerClick, Film, Image, Newspaper, Sparkles, Tv, Share2
} from 'lucide-react'

export interface AdFormat {
  id: string
  name: string
  slug: string
  description: string
}

export interface AdType {
  id: string
  name: string
  slug: string
  description: string
  icon: LucideIcon
  formats: AdFormat[]
}

export const AD_TYPES: AdType[] = [
  {
    id: 'interactive',
    name: 'Interactive',
    slug: 'interactive',
    description: 'Engage users with swipeable, tappable, and gamified ad experiences',
    icon: MousePointerClick,
    formats: [
      { id: 'carousel', name: 'Swipeable Carousel', slug: 'carousel', description: 'Swipe through product cards' },
      { id: 'cube', name: '3D Cube Carousel', slug: 'cube', description: 'Rotating cube with content faces' },
      { id: 'scratch', name: 'Scratch to Reveal', slug: 'scratch', description: 'Scratch overlay to reveal content' },
      { id: 'flipcard', name: 'Flipcard', slug: 'flipcard', description: 'Tap to flip and reveal other side' },
      { id: 'quiz', name: 'Quiz / Poll', slug: 'quiz', description: 'Answer questions, get results' },
      { id: 'slider', name: 'Before/After Slider', slug: 'slider', description: 'Swipe to reveal comparison' },
      { id: 'accordion', name: 'Accordion', slug: 'accordion', description: 'Click to expand/collapse sections' },
    ],
  },
  {
    id: 'animated',
    name: 'Animated',
    slug: 'animated',
    description: 'Eye-catching motion graphics and timed animations',
    icon: Sparkles,
    formats: [
      { id: 'animated-banner', name: 'Animated Banner', slug: 'animated-banner', description: 'CSS/GSAP animation sequences' },
      { id: 'countdown', name: 'Countdown Timer', slug: 'countdown', description: 'Urgency-driven animated countdown' },
    ],
  },
  {
    id: 'video',
    name: 'Video',
    slug: 'video',
    description: 'Video-based ads with end cards and click-to-play',
    icon: Film,
    formats: [
      { id: 'video-endcard', name: 'Video with End Card', slug: 'video-endcard', description: 'Video plays, CTA appears at end' },
      { id: 'click-to-play', name: 'Click to Play', slug: 'click-to-play', description: 'Thumbnail expands to video on click' },
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    slug: 'standard',
    description: 'Classic display banner formats for broad reach',
    icon: Image,
    formats: [
      { id: 'static-banner', name: 'Static Banner', slug: 'static-banner', description: 'Image + text + CTA button' },
      { id: 'multi-frame', name: 'Multi-Frame Banner', slug: 'multi-frame', description: 'Auto-rotating frames' },
    ],
  },
  {
    id: 'native',
    name: 'Native',
    slug: 'native',
    description: 'Ads that blend seamlessly with publisher content',
    icon: Newspaper,
    formats: [
      { id: 'in-feed', name: 'In-Feed Native', slug: 'in-feed', description: 'Blends with publisher content feed' },
    ],
  },
]

// Platform Suite items (placeholder products for future expansion)
export interface PlatformSuiteItem {
  id: string
  name: string
  description: string
  icon: LucideIcon
  comingSoon: true
}

export const PLATFORM_SUITE: PlatformSuiteItem[] = [
  { id: 'audio', name: 'Audio', description: 'Audio ad creation and distribution', icon: Tv, comingSoon: true },
  { id: 'adctv', name: 'ADCTV', description: 'Connected TV ad builder', icon: Tv, comingSoon: true },
  { id: 'social-display', name: 'Social Display', description: 'Social media display formats', icon: Share2, comingSoon: true },
]
```

### Anti-Patterns to Avoid

- **Inline full-page layouts in every page component:** The existing Phase 2 pages (`SettingsPage`, `AdminUsersPage`) each render `<div className="min-h-screen bg-gray-50">` and their own layout wrappers. Phase 3 must refactor these to remove standalone layouts so the shared `AppShell` provides the consistent chrome. Page components should render only their content, not full-page wrappers.

- **Fetching ad type data from the database in Phase 3:** There is no `ad_types` or `ad_formats` table in the schema. The ad type hierarchy is application-level constant data. Do not create database tables for this -- keep it as TypeScript constants. Phase 4 will introduce template associations.

- **Putting the sidebar state in React Context or Zustand:** The shadcn/ui `SidebarProvider` already manages sidebar state (open/collapsed, mobile overlay). Do not duplicate this state management. Use the `useSidebar` hook to read state.

- **Nesting AppShell inside ProtectedRoute component:** The `AppShell` should be a separate layout route *inside* the `ProtectedRoute` children, not mixed into the ProtectedRoute component itself. ProtectedRoute handles auth redirects; AppShell handles visual layout. Keep these concerns separate.

- **Making the footer a complex component with real content:** The requirements explicitly state "placeholder links" for support, showcase, and policies. These are links to `#` or future routes. Do not build full footer content pages.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Collapsible sidebar with mobile support | Custom sidebar with useState + media queries + Sheet | shadcn/ui Sidebar component | Handles collapsed/expanded state, icon mode, mobile sheet overlay, cookie persistence, keyboard shortcut (Cmd+B), resize handling, `useSidebar` hook -- enormous scope to build correctly from scratch |
| Search/command palette | Custom search input with dropdown results | shadcn/ui Command (cmdk) | Provides fuzzy matching, keyboard navigation (up/down/enter), grouping, empty state, dialog mode -- cmdk is the standard for command palettes in React |
| Active nav link detection | Custom path comparison logic | react-router `useLocation` + `SidebarMenuButton isActive` | shadcn Sidebar already has `isActive` prop with proper styling; just compare `location.pathname` |
| Responsive card grid | Custom CSS grid with breakpoints | Tailwind CSS responsive grid (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) | Tailwind's responsive utilities handle all breakpoints; no custom CSS needed |
| User avatar with initials fallback | Custom avatar component | shadcn/ui Avatar with AvatarFallback | Handles image loading, fallback to initials, proper sizing |

**Key insight:** Phase 3 is a UI assembly phase, not a feature-logic phase. Almost every piece has an existing component solution. The value is in correct composition, not custom implementation.

## Common Pitfalls

### Pitfall 1: Tailwind CSS 4 + shadcn/ui CSS Variable Compatibility

**What goes wrong:** shadcn/ui components expect CSS custom properties (e.g., `--sidebar-width`, `--background`, `--foreground`) defined in the global CSS file. Tailwind CSS 4 uses a CSS-first configuration approach (`@import "tailwindcss"`) without a `tailwind.config.js` file. If the CSS variables are not set up correctly, shadcn/ui components render without proper theming.

**Why it happens:** The current `index.css` contains only `@import "tailwindcss"` with no CSS variable definitions. When shadcn/ui components are installed, they need the theme variables to be present.

**How to avoid:** After adding the first shadcn/ui component via CLI, the CLI may update `index.css` with CSS variable definitions. If it does not (due to manual installation), manually add the required CSS custom properties from shadcn/ui's theming guide. The `neutral` base color was selected in `components.json` -- use the neutral color palette variables.

**Warning signs:** Components render but look unstyled, have no border radius, or show raw CSS variable names in computed styles.

### Pitfall 2: Router Layout Nesting Order

**What goes wrong:** Placing `AppShell` outside `ProtectedRoute` causes the sidebar to flash before the auth check completes. Placing `AppShell` at the same level as `ProtectedRoute` means unauthenticated users briefly see the navigation shell before being redirected to login.

**Why it happens:** React Router renders the tree top-down. If the shell renders before the auth guard, there's a visual flash.

**How to avoid:** Nest the route tree as: `ProtectedRoute` (auth check) > `AppShell` (layout) > child pages. The `ProtectedRoute` returns a loading spinner during auth check, preventing the shell from rendering until auth is confirmed.

**Warning signs:** Sidebar/header visible for a split second on the login page, or layout flash on page refresh.

### Pitfall 3: Existing Page Component Refactoring

**What goes wrong:** After introducing the `AppShell` with consistent background and padding, existing pages like `SettingsPage` and `AdminUsersPage` render double backgrounds, double padding, or conflicting `min-h-screen` styles because they still contain their own layout wrappers from Phase 2.

**Why it happens:** Phase 2 pages were built as standalone full-page components with their own `min-h-screen bg-gray-50` containers. The AppShell now provides these.

**How to avoid:** When introducing the `AppShell`, also refactor `SettingsPage`, `AdminUsersPage`, and remove the `DashboardPlaceholder` from `router.tsx`. Each page should render only its content section (heading, content area) without outer layout wrappers. The `<main>` element in `AppShell` provides padding and flex layout.

**Warning signs:** Double padding, nested scroll containers, conflicting background colors on settings/admin pages.

### Pitfall 4: shadcn/ui CLI in Monorepo Context

**What goes wrong:** Running `pnpx shadcn@latest add sidebar` from the wrong directory, or the CLI not finding `components.json`, or installing dependencies at the root instead of `apps/web`.

**Why it happens:** In a pnpm monorepo, the CLI must run from the `apps/web` directory where `components.json` lives. Running from the root will fail because there's no `components.json` at root level.

**How to avoid:** Always `cd apps/web` before running shadcn CLI commands. Verify `components.json` exists and has the correct aliases (`@/components`, `@/lib/utils`, `@/components/ui`). After running the CLI, verify component files were created in `src/components/ui/`.

**Warning signs:** CLI errors about missing config, components appearing at root level instead of in `apps/web/src/components/ui/`, or import path resolution failures.

### Pitfall 5: Sidebar Collapsible Mode and Tooltip Dependency

**What goes wrong:** Using `collapsible="icon"` on the Sidebar component without installing the Tooltip component causes a runtime error. In icon-collapsed mode, the sidebar shows tooltips on hover to display the full menu item text.

**Why it happens:** The `SidebarMenuButton` `tooltip` prop requires `TooltipProvider` to be present. The shadcn Sidebar component internally uses Tooltip when in icon mode.

**How to avoid:** Always install the Tooltip component alongside Sidebar. Wrap the application (or at least the `SidebarProvider`) with `<TooltipProvider>`. The sidebar blocks from shadcn/ui include this setup.

**Warning signs:** Console error about Tooltip context, or collapsed sidebar items not showing tooltip labels on hover.

## Code Examples

### Dashboard Ad Type Card Component

```typescript
// features/dashboard/components/ad-type-card.tsx
import { Link } from 'react-router'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { AdType } from '../data/ad-types'

interface AdTypeCardProps {
  adType: AdType
}

export function AdTypeCard({ adType }: AdTypeCardProps) {
  const Icon = adType.icon
  return (
    <Link to={`/creatives?type=${adType.slug}`} className="block group">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{adType.name}</CardTitle>
              <Badge variant="secondary" className="mt-1">
                {adType.formats.length} format{adType.formats.length !== 1 ? 's' : ''}
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
```

### App Shell with SidebarProvider and Outlet

```typescript
// components/layout/app-shell.tsx
import { Outlet } from 'react-router'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppSidebar } from './app-sidebar'
import { AppHeader } from './app-header'
import { AppFooter } from './app-footer'
import { SearchDialog } from './search-dialog'

export function AppShell() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
          <AppFooter />
        </SidebarInset>
        <SearchDialog />
      </SidebarProvider>
    </TooltipProvider>
  )
}
```

### Footer with Placeholder Links

```typescript
// components/layout/app-footer.tsx
import { Separator } from '@/components/ui/separator'

const footerLinks = [
  { label: 'Help & Support', href: '#' },
  { label: 'Showcase', href: '#' },
  { label: 'Creative Policy', href: '#' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
]

export function AppFooter() {
  return (
    <footer className="mt-auto">
      <Separator />
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 text-sm text-muted-foreground md:px-6">
        <p>&copy; {new Date().getFullYear()} ScrollToday. All rights reserved.</p>
        <nav className="flex flex-wrap gap-4">
          {footerLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom sidebar with useState + CSS transitions | shadcn/ui Sidebar component (Radix-based) | shadcn/ui Sidebar added mid-2024 | Eliminates 200+ lines of custom sidebar code; provides mobile, keyboard, cookie persistence for free |
| react-router-dom (separate package) | react-router (unified, v7) | React Router v7 (2025) | Single package import; already used in this project; layout routes via `element` without `path` |
| tailwind.config.js | Tailwind CSS 4 CSS-first config | Tailwind v4 (2025) | No config file needed; `@import "tailwindcss"` one-liner; CSS variables for theming |
| Custom command palette with Downshift | cmdk (via shadcn/ui Command) | cmdk gained popularity 2023-2024 | De-facto standard for command palettes; fuzzy matching, keyboard nav, accessible |
| Manual icon SVGs or icon fonts | lucide-react tree-shakable components | lucide-react became shadcn default 2023 | Each icon is a typed React component; tree-shaking means only used icons in bundle |

**Deprecated/outdated:**
- `react-router-dom` as a separate package: Use `react-router` directly in v7
- `tailwind.config.js` configuration file: Tailwind CSS 4 uses CSS-first configuration
- `@headlessui/react` for dropdowns/menus: Radix UI (via shadcn/ui) is the current standard
- Custom sidebar state management: shadcn/ui SidebarProvider handles all sidebar state

## Open Questions

1. **Sidebar navigation items for sections without pages yet**
   - What we know: The sidebar should list Dashboard, Creatives, Campaigns, Analytics, Billing, Settings. Only Dashboard and Settings have actual pages in Phase 3. Admin > Users exists for super_admin.
   - What's unclear: Should unimplemented sections (Creatives, Campaigns, Analytics, Billing) link to placeholder pages, or should they be visually indicated as "coming soon" and non-clickable?
   - Recommendation: Link them to simple placeholder pages that show the section name and "Coming in Phase X" message. This is consistent with the Phase 2 approach (DashboardPlaceholder showed "Coming in Phase 3") and makes the navigation feel complete. The placeholder pages are trivial to implement and will be replaced in their respective phases.

2. **Airtory-style layout specifics**
   - What we know: UI-01 says "matching Airtory-style layout". Airtory's format showcase organizes ads by Desktop/Mobile/Video categories with a filterable grid. Airtory's internal dashboard has a dark sidebar (109px width), header, and campaign-centric home page.
   - What's unclear: Exactly how close to Airtory's visual design the dashboard should be -- identical structure with different branding, or inspired-by with ScrollToday's own identity.
   - Recommendation: Use the same information architecture (ad type cards on dashboard, sidebar navigation to platform sections) but with ScrollToday's own visual identity using shadcn/ui's neutral theme. The "Airtory-style" reference is about the dashboard concept (ad type cards for browsing), not pixel-perfect replication.

3. **Search result destinations for ad formats**
   - What we know: Search should return results "across ad formats and platform sections". Platform sections link to routes. Ad format results should link to template browsing for that format.
   - What's unclear: The template browsing page does not exist until Phase 4. What URL should ad format search results navigate to?
   - Recommendation: Navigate to `/creatives?type={type_slug}&format={format_slug}` -- the URL will be a placeholder page in Phase 3 that shows the selected format name. In Phase 4, this becomes the actual template browsing view.

## Sources

### Primary (HIGH confidence)
- shadcn/ui Sidebar component documentation: https://ui.shadcn.com/docs/components/radix/sidebar -- Full API, props, SidebarProvider pattern, collapsible modes, useSidebar hook
- shadcn/ui Sidebar blocks gallery: https://ui.shadcn.com/blocks/sidebar -- 16 sidebar layout variants with code examples
- shadcn/ui Command component documentation: https://ui.shadcn.com/docs/components/radix/command -- CommandDialog, CommandInput, CommandList, CommandGroup, CommandItem, cmdk integration
- shadcn/ui manual installation guide: https://ui.shadcn.com/docs/installation/manual -- Dependencies, configuration steps, Vite support
- React Router v7 routing documentation: https://reactrouter.com/start/declarative/routing -- Layout routes, Outlet, nested routes, createBrowserRouter patterns
- lucide-react package: https://lucide.dev/guide/packages/lucide-react -- Installation, tree-shaking, React component usage (v0.564.x, actively maintained)

### Secondary (MEDIUM confidence)
- Airtory ad formats page: https://www.airtory.com/ad-formats -- Ad type organization (10+ categories), format hierarchy, information architecture
- Airtory formats showcase: https://formats.airtory.com/ -- Desktop/Mobile/Video categorization, card-based browsing, filter patterns
- Project Details.ini (in-repo Airtory platform analysis) -- Detailed sidebar navigation structure (109px, dark theme, sections: Campaigns, Data View, Others), route structure, component patterns (HIGH confidence for this project's reference material)
- Robin Wieruch React Router v7 tutorial (updated Jan 2026): https://www.robinwieruch.de/react-router-nested-routes/ -- Nested route patterns with layout components
- shadcn/ui complete guide 2026: https://designrevision.com/blog/shadcn-ui-guide -- Component overview, Tailwind CSS 4 compatibility, usage patterns

### Tertiary (LOW confidence)
- None -- all findings verified with primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- shadcn/ui Sidebar and Command are well-documented official components; react-router v7 layout patterns are verified against official docs; lucide-react is the default icon library for shadcn/ui
- Architecture: HIGH -- Layout route with Outlet is the standard react-router pattern; SidebarProvider + SidebarInset is the official shadcn/ui recommended structure; existing codebase patterns (createBrowserRouter, ProtectedRoute) are well-understood
- Pitfalls: HIGH -- CSS variable compatibility, router nesting order, existing page refactoring, and monorepo CLI issues are all documented or discovered through direct codebase analysis

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (30 days -- stable domain; shadcn/ui Sidebar and react-router v7 are mature)
