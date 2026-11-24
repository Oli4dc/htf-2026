import { Outlet, createFileRoute, redirect, useLocation } from '@tanstack/react-router'
import { AppHeader } from '#/components/layout/AppHeader.tsx'
import { Sidebar } from '#/components/layout/Sidebar.tsx'
import { TopBar } from '#/components/layout/TopBar.tsx'
import { getCurrentGuardian } from '#/lib/auth.functions.ts'
import { useLiveUpdates } from '#/lib/useLiveUpdates.ts'

// Pathless layout: every route inside src/routes/_authed/ needs a session.
// This only guards pages; each server function checks the session again.
export const Route = createFileRoute('/_authed')({
  beforeLoad: async () => {
    const guardian = await getCurrentGuardian()
    if (!guardian) throw redirect({ to: '/login' })
    return { guardian }
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  const { guardian } = Route.useRouteContext()
  useLiveUpdates()
  const isDashboard = useLocation({ select: (location) => location.pathname === '/' })

  // The dashboard already has the Achrona night theme; the other pages follow later.
  if (isDashboard) {
    return (
      <div className="theme-achrona flex min-h-screen flex-col">
        <TopBar guardian={guardian} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      {/* pb-16 leaves room for the bottom bar on phones. */}
      <div className="flex min-w-0 flex-1 flex-col pb-16 sm:pb-0">
        <AppHeader guardian={guardian} />
        <main className="flex-1 px-4 py-6 sm:px-8 lg:px-16 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
