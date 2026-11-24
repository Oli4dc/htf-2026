import { Link } from '@tanstack/react-router'
import { Activity, LayoutGrid, RadioTower, SquareKanban, type LucideIcon } from 'lucide-react'

type NavItem = {
  label: string
  icon: LucideIcon
  to: '/' | '/board' | '/report'
}

const navItems: NavItem[] = [
  { label: 'Overview', icon: LayoutGrid, to: '/' },
  { label: 'Glitch board', icon: SquareKanban, to: '/board' },
  { label: 'Report echo', icon: RadioTower, to: '/report' },
]

// Icon-only items: the label lives in aria-label/title for screen readers and hover.
const itemClass =
  'flex size-12 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white'
const activeClass = 'bg-white/10 text-white'

/** Left rail on desktop, bottom bar on phones. */
export function Sidebar() {
  return (
    <aside className="fixed inset-x-0 bottom-0 z-20 flex h-16 items-center justify-center bg-sidebar sm:sticky sm:top-0 sm:h-screen sm:w-20 sm:shrink-0 sm:flex-col sm:justify-start sm:py-5">
      <Link
        to="/"
        aria-label="Achrona mission control"
        className="mb-6 hidden size-12 items-center justify-center rounded-xl bg-linear-to-br from-accent-from to-accent-to text-white shadow-md shadow-black/30 sm:flex"
      >
        <Activity className="size-7" strokeWidth={2} />
      </Link>

      <nav className="flex gap-6 sm:w-full sm:flex-1 sm:flex-col sm:items-center sm:gap-1">
        {navItems.map(({ label, icon: Icon, to }) => (
          <Link
            key={label}
            to={to}
            aria-label={label}
            title={label}
            className={itemClass}
            activeOptions={{ exact: true }}
            activeProps={{ className: activeClass }}
          >
            <Icon className="size-6" strokeWidth={1.5} />
          </Link>
        ))}
      </nav>
    </aside>
  )
}
