import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
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

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar guardian={guardian} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
