import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema.ts'

// Server-only: never import this from client code.
const sqlite = new Database(process.env.DB_FILE_NAME ?? 'local.db')
sqlite.pragma('journal_mode = WAL')
// SQLite ignores foreign keys (and ON DELETE CASCADE) unless this is on.
sqlite.pragma('foreign_keys = ON')

// The "cornered" step (CONTAINING) was removed; move old rows back to tracking.
// Safe to run on every start: it only touches rows that still have it,
// and skips a fresh database that has no tables yet.
const hasGlitches = sqlite
  .prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'glitches'`)
  .get()
if (hasGlitches) {
  sqlite.prepare(`UPDATE glitches SET status = 'ASSESSING' WHERE status = 'CONTAINING'`).run()
}

export const db = drizzle(sqlite, { schema })
