import { Link, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Hexagon, LogOut } from 'lucide-react'
import { logout } from '#/lib/auth.functions.ts'
import type { Guardian } from '#/lib/guardian.ts'

const navClass =
  'rounded-lg px-3 py-2 text-base font-medium text-muted transition-colors hover:bg-subtle hover:text-fg'

/** Top bar of the Achrona night theme (design/dashboard.png). */
export function TopBar({ guardian }: { guardian: Guardian }) {
  const router = useRouter()
  const logoutFn = useServerFn(logout)
  const isCommander = guardian.role === 'commander'

  async function handleLogout() {
    await logoutFn()
    await router.navigate({ to: '/login' })
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-white/10 bg-topbar px-4 py-3 sm:px-8">
      <div className="flex items-center gap-4 sm:gap-8">
        <Link to="/" className="flex items-center gap-3">
          <Hexagon className="size-9 shrink-0 text-cyan drop-shadow-[0_0_8px_rgb(53_214_230/0.7)]" strokeWidth={1.75} />
          <span className="font-heading text-3xl leading-none text-fg sm:text-4xl">
            Achrona Mission Control
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link to="/board" className={navClass}>
            Board
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <span className="text-lg font-medium text-fg">{guardian.codename}</span>
        <span
          className={`rounded-lg border px-3 py-1 text-sm font-semibold capitalize ${
            isCommander
              ? 'border-orange-400 bg-orange-400/10 text-orange-300'
              : 'border-cyan bg-cyan/10 text-cyan'
          }`}
        >
          {guardian.role}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-base font-medium text-fg transition-colors hover:bg-subtle"
        >
          <LogOut className="size-5" />
          Logout
        </button>
      </div>
    </header>
  )
}
