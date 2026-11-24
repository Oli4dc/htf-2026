import { useCallback, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { RadioTower } from 'lucide-react'
import { CriminalAlarm } from '#/components/CriminalAlarm.tsx'
import { EchoForm } from '#/components/EchoForm.tsx'
import { Card } from '#/components/ui/Card.tsx'

export const Route = createFileRoute('/_authed/report')({
  component: ReportPage,
})

function ReportPage() {
  const navigate = useNavigate()
  // Set once the report is saved: the alarm shows, then we go to the new fugitive.
  const [escaped, setEscaped] = useState<{ glitchId: number; description: string } | null>(null)

  const closeAlarm = useCallback(() => {
    if (!escaped) return
    navigate({ to: '/glitches/$glitchId', params: { glitchId: String(escaped.glitchId) } })
  }, [escaped, navigate])

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-line bg-panel text-mint">
          <RadioTower className="size-6" />
        </span>
        <div>
          <h1 className="font-heading text-4xl text-fg sm:text-5xl">Report a criminal</h1>
          <p className="mt-1 text-muted">
            Spotted an escaped prisoner of the Time Prison? Your report opens a new case so the
            guardians can start the hunt.
          </p>
        </div>
      </div>

      <Card className="p-4 sm:p-6">
        <EchoForm onReported={(glitchId, description) => setEscaped({ glitchId, description })} />
      </Card>

      <p className="text-sm text-muted">
        Saw a fugitive who is already known? Open them from the dashboard and add your sighting
        there.
      </p>

      {escaped && (
        <CriminalAlarm
          glitchId={escaped.glitchId}
          description={escaped.description}
          onClose={closeAlarm}
        />
      )}
    </div>
  )
}
