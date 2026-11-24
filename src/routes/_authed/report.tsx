import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { RadioTower } from 'lucide-react'
import { EchoForm } from '#/components/EchoForm.tsx'
import { Card } from '#/components/ui/Card.tsx'

export const Route = createFileRoute('/_authed/report')({
  component: ReportPage,
})

function ReportPage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-line bg-panel text-mint">
          <RadioTower className="size-6" />
        </span>
        <div>
          <h1 className="font-heading text-4xl text-fg sm:text-5xl">Report an echo</h1>
          <p className="mt-1 text-muted">
            Sensed something off in Achrona? Your echo opens a new glitch so the guardians can
            respond.
          </p>
        </div>
      </div>

      <Card className="p-4 sm:p-6">
        <EchoForm
          onReported={(glitchId) =>
            navigate({ to: '/glitches/$glitchId', params: { glitchId: String(glitchId) } })
          }
        />
      </Card>

      <p className="text-sm text-muted">
        Adding to a glitch that is already known? Open it from the overview and add your echo
        there.
      </p>
    </div>
  )
}
