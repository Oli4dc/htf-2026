import { useState, type FormEvent } from 'react'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Hexagon, LogIn } from 'lucide-react'
import { getCurrentGuardian, login } from '#/lib/auth.functions.ts'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    if (await getCurrentGuardian()) throw redirect({ to: '/' })
  },
  component: LoginPage,
})

const inputClass =
  'w-full rounded-xl border border-line bg-app/60 px-4 py-3 text-lg text-fg placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-glow focus:outline-none'

function LoginPage() {
  const router = useRouter()
  const loginFn = useServerFn(login)
  const [codename, setCodename] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const result = await loginFn({ data: { codename, password } })
      if (result.error) {
        setError(result.error)
        return
      }
      await router.invalidate()
      await router.navigate({ to: '/' })
    } catch {
      setError('The grid is unreachable. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-app px-4 py-10">
      {/* Background glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-cyan/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -left-24 size-96 rounded-full bg-mint/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Hexagon
            className="size-14 text-cyan drop-shadow-[0_0_10px_rgb(53_214_230/0.7)]"
            strokeWidth={1.5}
          />
          <div>
            <h1 className="font-heading text-5xl leading-none text-fg sm:text-6xl">
              Achrona Mission Control
            </h1>
            <p className="mt-3 text-sm tracking-[0.3em] text-mint uppercase">Guardians of the Grid</p>
            <p className="mt-3 text-lg text-muted">Identify yourself, guardian. The Desync won't wait.</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-line bg-panel p-6 shadow-2xl shadow-black/40"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-base font-medium text-fg">Codename</span>
            <input
              value={codename}
              onChange={(e) => setCodename(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              required
              placeholder="e.g. Warden"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-base font-medium text-fg">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className={inputClass}
            />
          </label>

          {error && (
            <p role="alert" className="rounded-lg bg-red-500/15 px-3 py-2 text-base text-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-copper px-5 py-4 text-xl font-bold text-copper-ink shadow-md shadow-black/30 transition hover:brightness-110 disabled:opacity-60"
          >
            <LogIn className="size-5" />
            {busy ? 'Opening the gate…' : 'Enter mission control'}
          </button>
        </form>

        {/* Demo hint for judges; remove before going "live". */}
        <p className="mt-6 text-center text-base text-muted">
          Demo: <span className="text-fg">Warden</span> (commander),{' '}
          <span className="text-fg">Ember</span> or <span className="text-fg">Nyx</span> (defenders) ·
          password <span className="font-mono text-fg">achrona</span>
        </p>
      </div>
    </div>
  )
}
