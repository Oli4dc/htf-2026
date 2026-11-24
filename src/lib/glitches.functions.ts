import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { asc, count, desc, eq, getTableColumns } from 'drizzle-orm'
import { db } from '#/db/index.ts'
import { echoes, glitches, guardians } from '#/db/schema.ts'
import { requireCommander, requireGuardian } from '#/lib/auth.server.ts'
import { setBountyStatus } from '#/lib/bounty.server.ts'
import {
  DEFAULT_TARGET_NAME,
  MAX_THREAT,
  MIN_THREAT,
  defaultReward,
  isLocation,
  type Location,
} from '#/lib/bounty.ts'
import {
  ECHO_MAX_LENGTH,
  computeMagicLevel,
  isGlitchStatus,
  type GlitchDetail,
  type GlitchStatus,
  type GlitchSummary,
} from '#/lib/glitch.ts'

function parseGlitchId(value: unknown) {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new Error('Invalid glitch id.')
  return id
}

export const getGlitches = createServerFn({ method: 'GET' }).handler(
  async (): Promise<GlitchSummary[]> => {
    requireGuardian()
    return db
      .select({ ...getTableColumns(glitches), echoCount: count(echoes.echoId) })
      .from(glitches)
      .leftJoin(echoes, eq(echoes.glitchId, glitches.glitchId))
      .groupBy(glitches.glitchId)
      .orderBy(desc(glitches.timestamp), desc(glitches.glitchId))
      .all()
  },
)

export const getGlitch = createServerFn({ method: 'GET' })
  .validator((glitchId: number) => parseGlitchId(glitchId))
  .handler(async ({ data: glitchId }): Promise<GlitchDetail> => {
    requireGuardian()
    const glitch = db.select().from(glitches).where(eq(glitches.glitchId, glitchId)).get()
    if (!glitch) throw notFound()

    const glitchEchoes = db
      .select({
        echoId: echoes.echoId,
        description: echoes.description,
        timestamp: echoes.timestamp,
        guardian: { codename: guardians.codename, role: guardians.role },
      })
      .from(echoes)
      .innerJoin(guardians, eq(guardians.guardianId, echoes.reportingGuardianId))
      .where(eq(echoes.glitchId, glitchId))
      .orderBy(asc(echoes.timestamp), asc(echoes.echoId))
      .all()

    return { ...glitch, echoes: glitchEchoes }
  })

type ReportEchoInput = {
  description: string
  glitchId?: number
  /** Only used when the echo opens a new bounty. */
  targetName?: string
  threat?: number
  location?: Location
}

/**
 * Without glitchId the echo opens a new bounty (WANTED, ANOMALY, default reward
 * from its threat); with it, the echo is a sighting on that bounty.
 */
export const reportEcho = createServerFn({ method: 'POST' })
  .validator((data: ReportEchoInput) => {
    const description = String(data.description ?? '').trim()
    if (!description) throw new Error('Describe what you sensed.')
    if (description.length > ECHO_MAX_LENGTH) {
      throw new Error(`Keep it under ${ECHO_MAX_LENGTH} characters.`)
    }
    const glitchId = data.glitchId == null ? undefined : parseGlitchId(data.glitchId)

    const threat = data.threat == null ? MIN_THREAT : Number(data.threat)
    if (!Number.isInteger(threat) || threat < MIN_THREAT || threat > MAX_THREAT) {
      throw new Error(`Threat must be from ${MIN_THREAT} to ${MAX_THREAT}.`)
    }
    if (data.location != null && !isLocation(data.location)) throw new Error('Unknown location.')
    const targetName = String(data.targetName ?? '').trim().slice(0, 80) || DEFAULT_TARGET_NAME

    return {
      description,
      glitchId,
      bounty: {
        targetName,
        threat,
        location: data.location ?? ('central_nexus' as const),
        kind: 'ANOMALY' as const,
        reward: defaultReward(threat, 'ANOMALY'),
      },
    }
  })
  .handler(async ({ data }): Promise<{ glitchId: number }> => {
    // Reporter always comes from the session, never from the client.
    const guardian = requireGuardian()
    const timestamp = new Date().toISOString()

    return db.transaction((tx) => {
      let glitchId = data.glitchId
      if (glitchId === undefined) {
        glitchId = tx
          .insert(glitches)
          .values({ description: data.description, timestamp, ...data.bounty })
          .returning({ glitchId: glitches.glitchId })
          .get().glitchId
      } else {
        const exists = tx
          .select({ glitchId: glitches.glitchId })
          .from(glitches)
          .where(eq(glitches.glitchId, glitchId))
          .get()
        if (!exists) throw new Error('That glitch no longer exists.')
      }

      tx.insert(echoes)
        .values({
          description: data.description,
          timestamp,
          reportingGuardianId: guardian.guardianId,
          glitchId,
        })
        .run()

      return { glitchId }
    })
  })

export const updateGlitchStatus = createServerFn({ method: 'POST' })
  .validator((data: { glitchId: number; status: GlitchStatus }) => {
    if (!isGlitchStatus(data.status)) throw new Error('Unknown status.')
    return { glitchId: parseGlitchId(data.glitchId), status: data.status }
  })
  .handler(async ({ data }) => {
    requireCommander()
    // Also sets or clears resolvedAt, so bounty rewards stay correct.
    setBountyStatus(data.glitchId, data.status)
  })

export const deleteGlitch = createServerFn({ method: 'POST' })
  .validator((glitchId: number) => parseGlitchId(glitchId))
  .handler(async ({ data: glitchId }) => {
    requireCommander()
    // Echoes go with it (ON DELETE CASCADE).
    db.delete(glitches).where(eq(glitches.glitchId, glitchId)).run()
  })

/** Magic level of Achrona in percent, computed on the server. */
export const getMagicLevel = createServerFn({ method: 'GET' }).handler(async (): Promise<number> => {
  requireGuardian()
  const rows = db.select({ status: glitches.status }).from(glitches).all()
  return computeMagicLevel(rows.map((row) => row.status))
})
