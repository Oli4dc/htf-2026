import { createServerFn } from '@tanstack/react-start'
import { sql } from 'drizzle-orm'
import { db } from '#/db/index.ts'
import { guardians } from '#/db/schema.ts'
import { createSession, destroySession, getSessionGuardian } from '#/lib/auth.server.ts'
import { verifyPassword } from '#/lib/password.server.ts'

export const getCurrentGuardian = createServerFn({ method: 'GET' }).handler(
  async () => getSessionGuardian(),
)

type LoginInput = { codename: string; password: string }

export const login = createServerFn({ method: 'POST' })
  .validator((data: LoginInput) => ({
    codename: String(data.codename ?? '').trim(),
    password: String(data.password ?? ''),
  }))
  .handler(async ({ data }): Promise<{ error: string | null }> => {
    const guardian = db
      .select()
      .from(guardians)
      // Case-insensitive, so "warden" works for "Warden".
      .where(sql`lower(${guardians.codename}) = ${data.codename.toLowerCase()}`)
      .get()

    // Same message for unknown codename and wrong password.
    if (!guardian || !verifyPassword(data.password, guardian.passwordHash)) {
      return { error: 'Unknown codename or wrong password.' }
    }

    createSession(guardian.guardianId)
    return { error: null }
  })

export const logout = createServerFn({ method: 'POST' }).handler(async () => {
  destroySession()
})
