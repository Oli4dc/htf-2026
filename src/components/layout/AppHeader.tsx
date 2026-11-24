import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Activity, LogOut, Shield, ShieldCheck } from 'lucide-react'
import { IconButton } from '#/components/ui/IconButton.tsx'
import { logout } from '#/lib/auth.functions.ts'
import type { Guardian } from '#/lib/guardian.ts'

export function AppHeader({ guardian }: { guardian: Guardian }) {
  const router = useRouter()
  const logoutFn = useServerFn(logout)
  const isCommander = guardian.role === 'commander'
  const RoleIcon = isCommander ? ShieldCheck : Shield

  async function handleLogout() {
    await logoutFn()
    await router.navigate({ to: '/login' })
  }

  return (
    <header className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 sm:px-8 lg:px-16">
      <div className="flex items-center gap-3">
        {/* The sidebar logo is hidden on phones. */}
        <span className="flex size-9 items-center justify-center rounded-lg bg-linear-to-br from-accent-from to-accent-to text-white sm:hidden">
          <Activity className="size-5" />
        </span>
        <div className="leading-tight">
          <p className="text-xs tracking-widest text-muted uppercase">Achrona</p>
          <p className="font-semibold text-fg">Guardians of the Grid</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 rounded-full border border-line py-1 pr-3 pl-1">
          <span className="flex size-8 items-center justify-center rounded-full bg-sidebar text-sm font-semibold text-white">
            {guardian.codename.charAt(0).toUpperCase()}
          </span>
          <div className="leading-tight">
            <p className="text-sm font-medium text-fg">{guardian.codename}</p>
            <p
              className={`inline-flex items-center gap-1 text-xs font-medium capitalize ${isCommander ? 'text-accent' : 'text-muted'}`}
            >
              <RoleIcon className="size-3.5" />
              {guardian.role}
            </p>
          </div>
        </div>
        <IconButton
          aria-label="Log out"
          title="Log out"
          onClick={handleLogout}
          className="size-10 rounded-full hover:bg-subtle"
        >
          <LogOut className="size-5" />
        </IconButton>
      </div>
    </header>
  )
}
