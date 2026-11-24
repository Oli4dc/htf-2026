import { relations } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
// Relative imports: drizzle-kit loads this file and doesn't resolve the `#/` alias.
import {
  BOUNTY_KINDS,
  BOUNTY_OBJECTIVES,
  DEFAULT_TARGET_NAME,
  LOCATIONS,
} from '../lib/bounty.ts'
import { GLITCH_STATUSES } from '../lib/glitch.ts'
import { GUARDIAN_ROLES } from '../lib/guardian.ts'

export const guardians = sqliteTable('guardians', {
  guardianId: integer('guardian_id').primaryKey({ autoIncrement: true }),
  codename: text('codename').notNull().unique(),
  role: text('role', { enum: GUARDIAN_ROLES }).notNull(),
  passwordHash: text('password_hash').notNull(),
})

/** Every glitch is also a bounty (src/lib/bounty.ts). The bounty columns all have defaults. */
export const glitches = sqliteTable(
  'glitches',
  {
    glitchId: integer('glitch_id').primaryKey({ autoIncrement: true }),
    status: text('status', { enum: GLITCH_STATUSES }).notNull().default('LEAKED'),
    description: text('description').notNull(),
    /** ISO 8601, so lexical order is chronological order. */
    timestamp: text('timestamp').notNull(),
    targetName: text('target_name').notNull().default(DEFAULT_TARGET_NAME),
    kind: text('kind', { enum: BOUNTY_KINDS }).notNull().default('ANOMALY'),
    objective: text('objective', { enum: BOUNTY_OBJECTIVES }).notNull().default('CAPTURE'),
    /** In shards. */
    reward: integer('reward').notNull().default(100),
    /** 1-5, checked on the server. */
    threat: integer('threat').notNull().default(1),
    location: text('location', { enum: LOCATIONS }).notNull().default('central_nexus'),
    /** The hunter on this bounty; one per bounty. */
    claimedByGuardianId: integer('claimed_by_guardian_id').references(
      () => guardians.guardianId,
      { onDelete: 'set null' },
    ),
    /** ISO 8601; set when the bounty reaches its final status. */
    resolvedAt: text('resolved_at'),
  },
  (table) => [index('glitches_claimed_by_idx').on(table.claimedByGuardianId)],
)

export const echoes = sqliteTable(
  'echoes',
  {
    echoId: integer('echo_id').primaryKey({ autoIncrement: true }),
    description: text('description').notNull(),
    /** ISO 8601 */
    timestamp: text('timestamp').notNull(),
    reportingGuardianId: integer('reporting_guardian_id')
      .notNull()
      .references(() => guardians.guardianId),
    glitchId: integer('glitch_id')
      .notNull()
      .references(() => glitches.glitchId, { onDelete: 'cascade' }),
  },
  (table) => [index('echoes_glitch_id_idx').on(table.glitchId)],
)

/**
 * One row per roulette spin. Spendable shards = rewards of resolved bounties
 * + sum(payout) - sum(wager). The leaderboard ignores this table.
 */
export const rouletteSpins = sqliteTable(
  'roulette_spins',
  {
    spinId: integer('spin_id').primaryKey({ autoIncrement: true }),
    guardianId: integer('guardian_id')
      .notNull()
      .references(() => guardians.guardianId, { onDelete: 'cascade' }),
    /** 'red' | 'black' | 'green' or a single number '0'..'36'. */
    bet: text('bet').notNull(),
    wager: integer('wager').notNull(),
    /** 0..36, drawn on the server. */
    result: integer('result').notNull(),
    /** Shards paid back, including the wager when won; 0 when lost. */
    payout: integer('payout').notNull(),
    /** ISO 8601 */
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('roulette_spins_guardian_id_idx').on(table.guardianId)],
)

/** Login sessions; the id is the random token stored in the cookie. */
export const sessions = sqliteTable('sessions', {
  sessionId: text('session_id').primaryKey(),
  guardianId: integer('guardian_id')
    .notNull()
    .references(() => guardians.guardianId, { onDelete: 'cascade' }),
  /** ISO 8601 */
  expiresAt: text('expires_at').notNull(),
})

export const guardiansRelations = relations(guardians, ({ many }) => ({
  echoes: many(echoes),
  claimedBounties: many(glitches),
}))

export const glitchesRelations = relations(glitches, ({ many, one }) => ({
  echoes: many(echoes),
  hunter: one(guardians, {
    fields: [glitches.claimedByGuardianId],
    references: [guardians.guardianId],
  }),
}))

export const echoesRelations = relations(echoes, ({ one }) => ({
  glitch: one(glitches, {
    fields: [echoes.glitchId],
    references: [glitches.glitchId],
  }),
  guardian: one(guardians, {
    fields: [echoes.reportingGuardianId],
    references: [guardians.guardianId],
  }),
}))
