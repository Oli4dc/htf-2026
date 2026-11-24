import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { AppHeader } from '#/components/layout/AppHeader.tsx'
import { Sidebar } from '#/components/layout/Sidebar.tsx'
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
