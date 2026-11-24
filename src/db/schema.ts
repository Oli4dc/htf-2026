import { relations } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
// Relative imports: drizzle-kit loads this file and doesn't resolve the `#/` alias.
import { GLITCH_LOCATIONS, GLITCH_STATUSES } from '../lib/glitch.ts'
import { GUARDIAN_ROLES } from '../lib/guardian.ts'

export const guardians = sqliteTable('guardians', {
  guardianId: integer('guardian_id').primaryKey({ autoIncrement: true }),
  codename: text('codename').notNull().unique(),
  role: text('role', { enum: GUARDIAN_ROLES }).notNull(),
  passwordHash: text('password_hash').notNull(),
})

export const glitches = sqliteTable('glitches', {
  glitchId: integer('glitch_id').primaryKey({ autoIncrement: true }),
  status: text('status', { enum: GLITCH_STATUSES }).notNull().default('LEAKED'),
  description: text('description').notNull(),
  /** Area of Achrona. The default only exists so the column can be added to a filled table. */
  location: text('location', { enum: GLITCH_LOCATIONS }).notNull().default('central_nexus'),
  /** ISO 8601, so lexical order is chronological order. */
  timestamp: text('timestamp').notNull(),
})

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
}))

export const glitchesRelations = relations(glitches, ({ many }) => ({
  echoes: many(echoes),
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
