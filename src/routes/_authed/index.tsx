import { Link, createFileRoute } from '@tanstack/react-router'
import { RadioTower } from 'lucide-react'
import { GlitchesTable } from '#/components/GlitchesTable.tsx'
import { StatusBadge, statusMeta } from '#/components/StatusBadge.tsx'
import { Card } from '#/components/ui/Card.tsx'
import { getGlitches } from '#/lib/glitches.functions.ts'
import { GLITCH_STATUSES } from '#/lib/glitch.ts'

export const Route = createFileRoute('/_authed/')({
  loader: () => getGlitches(),
  component: OverviewPage,
})

function OverviewPage() {
  const glitches = Route.useLoaderData()
  const { guardian } = Route.useRouteContext()

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-fg">Overview</h1>
          <p className="mt-1 text-muted">
            Every echo from the field, newest first. Hold the line against The Desync.
          </p>
        </div>
        <Link
          to="/report"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-br from-accent-from to-accent-to px-5 py-3 font-medium text-white shadow-md shadow-glow transition hover:brightness-110"
        >
          <RadioTower className="size-5" />
          Report echo
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {GLITCH_STATUSES.map((status) => (
          <Card key={status} className="flex flex-col gap-3 p-4 sm:p-5">
            <StatusBadge status={status} />
            <p className="text-3xl font-semibold text-fg">
              {glitches.filter((g) => g.status === status).length}
            </p>
            <p className="text-sm text-muted">{statusMeta[status].hint}</p>
          </Card>
        ))}
      </div>

      <GlitchesTable glitches={glitches} isCommander={guardian.role === 'commander'} />
    </div>
  )
}
