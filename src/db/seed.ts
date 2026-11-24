import { sql } from 'drizzle-orm'
import { db } from './index.ts'
import { echoes, glitches, guardians, rouletteSpins, sessions } from './schema.ts'
import { hashPassword } from '../lib/password.server.ts'

// Resets the database to a clean start: the demo logins and an empty board.
// No bounties, sightings or roulette spins: the demo creates them live.

// Demo logins; every guardian shares this password.
const DEMO_PASSWORD = 'achrona'

const guardianRows: (typeof guardians.$inferInsert)[] = [
  { guardianId: 1, codename: 'Warden', role: 'commander', passwordHash: hashPassword(DEMO_PASSWORD) },
  { guardianId: 2, codename: 'Ember', role: 'defender', passwordHash: hashPassword(DEMO_PASSWORD) },
  { guardianId: 3, codename: 'Nyx', role: 'defender', passwordHash: hashPassword(DEMO_PASSWORD) },
  { guardianId: 4, codename: 'Rook', role: 'defender', passwordHash: hashPassword(DEMO_PASSWORD) },
]

// Wipe and refill so the seed can be re-run safely. Children first, because of foreign keys.
db.transaction((tx) => {
  tx.delete(sessions).run()
  tx.delete(rouletteSpins).run()
  tx.delete(echoes).run()
  tx.delete(glitches).run()
  tx.delete(guardians).run()
  tx.run(sql`DELETE FROM sqlite_sequence`)

  tx.insert(guardians).values(guardianRows).run()
})

console.log(`Seeded ${guardianRows.length} guardians and an empty bounty board.`)
console.log(
  `Demo logins: Warden (commander), Ember, Nyx and Rook (hunters); password "${DEMO_PASSWORD}".`,
)
