import { createBrowserRouter, Outlet } from 'react-router'
import { ProtectedRoute, AdminRoute, OrgAdminRoute } from '@/features/auth/components/protected-route'
import { AppShell } from '@/components/layout/app-shell'
import { AuthProvider } from '@/contexts/auth-context'

/**
 * Layout route that provides AuthContext.
 * /preview/:token is intentionally outside this so public previews
 * don't trigger user_profiles / advertisers queries.
 */
function AuthLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}

export const router = createBrowserRouter([
  // ── Public standalone routes (no AuthContext) ────────────────────────────
  {
    path: '/preview/:token',
    lazy: async () => {
      const { default: Component } = await import(
        '@/features/preview/pages/preview-page'
      )
      return { Component }
    },
  },

  // ── All other routes — AuthContext is available ──────────────────────────
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        lazy: async () => {
          const { default: Component } = await import(
            '@/features/auth/pages/login-page'
          )
          return { Component }
        },
      },
      {
        path: '/verify-2fa',
        lazy: async () => {
          const { default: Component } = await import(
            '@/features/auth/pages/verify-2fa-page'
          )
          return { Component }
        },
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '/change-password',
            lazy: async () => {
              const { default: Component } = await import(
                '@/features/auth/pages/change-password-page'
              )
              return { Component }
            },
          },
          {
            element: <AppShell />,
            children: [
              {
                index: true,
                lazy: async () => {
                  const { default: Component } = await import(
                    '@/features/dashboard/pages/dashboard-page'
                  )
                  return { Component }
                },
              },
              {
                path: '/settings',
                lazy: async () => {
                  const { default: Component } = await import(
                    '@/features/auth/pages/settings-page'
                  )
                  return { Component }
                },
              },
              {
                path: '/creatives/new/*',
                lazy: async () => {
                  const { default: Component } = await import(
                    '@/features/templates/pages/creatives-new-page'
                  )
                  return { Component }
                },
              },
              {
                // Direct editor entry for new creatives: /creatives/editor?template=flash-sale
                path: '/creatives/editor',
                lazy: async () => {
                  const { default: Component } = await import(
                    '@/features/editor/pages/editor-page'
                  )
                  return { Component }
                },
              },
              {
                path: '/creatives/:id/edit',
                lazy: async () => {
                  const { default: Component } = await import(
                    '@/features/templates/pages/creatives-edit-page'
                  )
                  return { Component }
                },
              },
              {
                path: '/creatives',
                lazy: async () => {
                  const { default: Component } = await import(
                    '@/features/creatives/pages/creatives-page'
                  )
                  return { Component }
                },
              },
              {
                path: '/campaigns',
                lazy: async () => {
                  const { default: Component } = await import(
                    '@/features/campaigns/pages/campaigns-page'
                  )
                  return { Component }
                },
              },
              {
                path: '/campaigns/:id',
                lazy: async () => {
                  const { default: Component } = await import(
                    '@/features/campaigns/pages/campaign-detail-page'
                  )
                  return { Component }
                },
              },
              {
                path: '/analytics',
                errorElement: (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <p className="text-destructive font-semibold">Analytics failed to load</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Check the browser console for details, then refresh the page.
                    </p>
                  </div>
                ),
                lazy: async () => {
                  const { default: Component } = await import(
                    '@/features/analytics/pages/analytics-page'
                  )
                  return { Component }
                },
              },
              {
                path: '/reports',
                lazy: async () => {
                  const { default: Component } = await import(
                    '@/features/reports/pages/reports-page'
                  )
                  return { Component }
                },
              },
              {
                path: '/trackers',
                lazy: async () => {
                  const { default: Component } = await import(
                    '@/features/trackers/pages/trackers-page'
                  )
                  return { Component }
                },
              },
              {
                path: '/billing',
                lazy: async () => {
                  const { default: Component } = await import(
                    '@/features/billing/pages/billing-page'
                  )
                  return { Component }
                },
              },
              {
                path: '/guide',
                lazy: async () => {
                  const { default: Component } = await import(
                    '@/features/guide/pages/guide-page'
                  )
                  return { Component }
                },
              },
              {
                element: <OrgAdminRoute />,
                children: [
                  {
                    path: '/team',
                    lazy: async () => {
                      const { default: Component } = await import(
                        '@/features/admin/pages/team-page'
                      )
                      return { Component }
                    },
                  },
                ],
              },
              {
                element: <AdminRoute />,
                children: [
                  {
                    path: '/admin/users',
                    lazy: async () => {
                      const { default: Component } = await import(
                        '@/features/admin/pages/admin-users-page'
                      )
                      return { Component }
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
])
