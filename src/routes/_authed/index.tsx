import { createFileRoute } from '@tanstack/react-router'
import { GlitchesTable } from '#/components/GlitchesTable.tsx'
import { MagicPanel } from '#/components/MagicPanel.tsx'
import { TopHunters } from '#/components/bounty/TopHunters.tsx'
import { getLeaderboard } from '#/lib/bounties.functions.ts'
import { getGlitches, getMagicLevel } from '#/lib/glitches.functions.ts'

export const Route = createFileRoute('/_authed/')({
  loader: async () => {
    const [glitches, magicLevel, hunters] = await Promise.all([
      getGlitches(),
      getMagicLevel(),
      getLeaderboard(),
    ])
    return { glitches, magicLevel, hunters }
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { glitches, magicLevel, hunters } = Route.useLoaderData()
  const { guardian } = Route.useRouteContext()
  const open = glitches.filter((g) => g.status !== 'FIXED').length

  return (
    <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
      {/* Right column on desktop; first on phones. */}
      <div className="flex flex-col gap-6 lg:order-last">
        <MagicPanel level={magicLevel} captured={glitches.length - open} total={glitches.length} />
        <TopHunters hunters={hunters} guardianId={guardian.guardianId} />
      </div>

      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-panel p-4 sm:p-6 lg:col-span-2 lg:max-h-[calc(100vh-9.5rem)]">
        <header className="flex items-baseline justify-between gap-4">
          <h1 className="font-heading text-4xl leading-none text-fg">Fugitives</h1>
          <p className="text-base text-muted">
            {open} on the loose · {glitches.length - open} captured
          </p>
        </header>
        <div className="min-h-0 lg:overflow-y-auto lg:pr-1">
          <GlitchesTable glitches={glitches} isCommander={guardian.role === 'commander'} />
        </div>
      </section>
    </div>
  )
}
