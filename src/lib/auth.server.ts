import { randomBytes } from 'node:crypto'
import { redirect } from '@tanstack/react-router'
import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { db } from '#/db/index.ts'
import { guardians, sessions } from '#/db/schema.ts'
import type { Guardian } from '#/lib/guardian.ts'

// Server-only helpers. Call them inside server function handlers.

const SESSION_COOKIE = 'achrona_session'
const SESSION_DAYS = 7

export function createSession(guardianId: number) {
  const sessionId = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  db.insert(sessions)
    .values({ sessionId, guardianId, expiresAt: expires.toISOString() })
    .run()
  setCookie(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires,
  })
}

export function destroySession() {
  const sessionId = getCookie(SESSION_COOKIE)
  if (sessionId) db.delete(sessions).where(eq(sessions.sessionId, sessionId)).run()
  deleteCookie(SESSION_COOKIE, { path: '/' })
}

/** The guardian behind the session cookie, or null. */
export function getSessionGuardian(): Guardian | null {
  const sessionId = getCookie(SESSION_COOKIE)
  if (!sessionId) return null

  const row = db
    .select({
      guardianId: guardians.guardianId,
      codename: guardians.codename,
      role: guardians.role,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(guardians, eq(guardians.guardianId, sessions.guardianId))
    .where(eq(sessions.sessionId, sessionId))
    .get()

  if (!row) return null
  if (row.expiresAt < new Date().toISOString()) {
    db.delete(sessions).where(eq(sessions.sessionId, sessionId)).run()
    return null
  }
  return { guardianId: row.guardianId, codename: row.codename, role: row.role }
}

/** Sends guests to the login page. */
export function requireGuardian(): Guardian {
  const guardian = getSessionGuardian()
  if (!guardian) throw redirect({ to: '/login' })
  return guardian
}

export function requireCommander(): Guardian {
  const guardian = requireGuardian()
  if (guardian.role !== 'commander') {
    throw new Error('Only commanders can do this.')
  }
  return guardian
}
