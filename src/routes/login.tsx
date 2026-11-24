import { useState, type FormEvent } from 'react'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Activity, LogIn } from 'lucide-react'
import { getCurrentGuardian, login } from '#/lib/auth.functions.ts'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    if (await getCurrentGuardian()) throw redirect({ to: '/' })
  },
  component: LoginPage,
})

const inputClass =
  'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-accent-from focus:ring-4 focus:ring-accent/30 focus:outline-none'

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-sidebar px-4 py-10">
      {/* Background glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-accent/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -left-24 size-96 rounded-full bg-accent-from/20 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-accent-from to-accent-to text-white shadow-lg shadow-black/40">
            <Activity className="size-8" />
          </span>
          <div>
            <p className="text-xs tracking-[0.3em] text-white/50 uppercase">Achrona mission control</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Guardians of the Grid</h1>
            <p className="mt-2 text-white/60">Identify yourself, guardian. The Desync won't wait.</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-white/80">Codename</span>
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
            <span className="text-sm font-medium text-white/80">Password</span>
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
            <p role="alert" className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-br from-accent-from to-accent-to px-5 py-3 font-medium text-white shadow-md shadow-black/30 transition hover:brightness-110 disabled:opacity-60"
          >
            <LogIn className="size-5" />
            {busy ? 'Opening the gate…' : 'Enter mission control'}
          </button>
        </form>

        {/* Demo hint for judges; remove before going "live". */}
        <p className="mt-6 text-center text-sm text-white/50">
          Demo: <span className="text-white/80">Warden</span> (commander),{' '}
          <span className="text-white/80">Ember</span> or <span className="text-white/80">Nyx</span>{' '}
          (defenders) · password <span className="font-mono text-white/80">achrona</span>
        </p>
      </div>
    </div>
  )
}
