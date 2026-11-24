import { sql } from 'drizzle-orm'
import { db } from './index.ts'
import { echoes, glitches, guardians, sessions } from './schema.ts'
import { hashPassword } from '../lib/password.server.ts'

// Demo logins; every guardian shares this password.
const DEMO_PASSWORD = 'achrona'

const WARDEN = 1
const EMBER = 2
const NYX = 3

const guardianRows: (typeof guardians.$inferInsert)[] = [
  { guardianId: WARDEN, codename: 'Warden', role: 'commander', passwordHash: hashPassword(DEMO_PASSWORD) },
  { guardianId: EMBER, codename: 'Ember', role: 'defender', passwordHash: hashPassword(DEMO_PASSWORD) },
  { guardianId: NYX, codename: 'Nyx', role: 'defender', passwordHash: hashPassword(DEMO_PASSWORD) },
]

// Relative to now, so the demo always looks fresh.
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()

type SeedGlitch = {
  id: number
  status: (typeof glitches.$inferInsert)['status']
  /** [guardianId, minutesAgo, description]; the first echo opens the glitch. */
  echoes: [number, number, string][]
}

const seedGlitches: SeedGlitch[] = [
  { id: 131, status: 'FIXED', echoes: [
    [NYX, 4320, 'Echo sensors in the Lantern Quarter report every signal twice'],
    [EMBER, 4200, 'Duplicates traced to a mirrored rune on relay 7'],
    [WARDEN, 4100, 'Rune scrubbed and relay recalibrated. Signals single again'],
  ] },
  { id: 132, status: 'FIXED', echoes: [
    [EMBER, 3600, 'Fountain in Gilded Square flows upwards for ten seconds every hour'],
    [NYX, 3500, 'Gravity ward on the fountain was out of sync with the city clock'],
  ] },
  { id: 133, status: 'CONTAINING', echoes: [
    [NYX, 2880, 'Portal flicker in the archive vaults; books arrive before they are requested'],
    [EMBER, 2700, 'Flicker spreads to the lower stacks. Sealed the vault doors'],
    [NYX, 1500, 'Containment wards holding, flicker down to once per hour'],
  ] },
  { id: 134, status: 'ASSESSING', echoes: [
    [EMBER, 2160, 'Magic reserves in the Northern Wells dropping faster than expected'],
    [NYX, 2000, 'Drain is steady at 3% per hour, no visible leak'],
  ] },
  { id: 135, status: 'FIXED', echoes: [
    [NYX, 1800, 'Street lamps on Ashen Row light up at noon and go dark at night'],
  ] },
  { id: 136, status: 'CONTAINING', echoes: [
    [EMBER, 1440, 'Ferry across the Silver Canal arrives at the dock it just left'],
    [WARDEN, 1300, 'Ferry suspended. Defenders posted at both docks'],
  ] },
  { id: 137, status: 'ASSESSING', echoes: [
    [NYX, 720, 'Market merchants repeat the same sentence over and over'],
    [EMBER, 650, 'Loop lasts 40 seconds and resets on the bell of the clock tower'],
  ] },
  { id: 138, status: 'LEAKED', echoes: [
    [EMBER, 360, 'Shadows in the Old Orchard move a second after their owners'],
  ] },
  { id: 139, status: 'LEAKED', echoes: [
    [NYX, 180, 'Dragon statue at the city gate blinked. Twice'],
    [EMBER, 120, 'Confirmed: statue eyes follow passing guardians'],
  ] },
  { id: 140, status: 'ASSESSING', echoes: [
    [EMBER, 90, 'Snow falling upwards above the Crystal Observatory'],
  ] },
  { id: 141, status: 'LEAKED', echoes: [
    [NYX, 45, 'Messenger ravens deliver letters that have not been written yet'],
  ] },
  { id: 142, status: 'LEAKED', echoes: [
    [EMBER, 12, 'Time loop detected near the eastern clock tower'],
    [NYX, 5, 'Clock tower bells ring thirteen times. The Desync is spreading'],
  ] },
]

// Wipe and refill so the seed can be re-run safely.
db.transaction((tx) => {
  tx.delete(sessions).run()
  tx.delete(echoes).run()
  tx.delete(glitches).run()
  tx.delete(guardians).run()
  tx.run(sql`DELETE FROM sqlite_sequence`)

  tx.insert(guardians).values(guardianRows).run()

  for (const glitch of seedGlitches) {
    const [, openedMinutesAgo, openingDescription] = glitch.echoes[0]
    tx.insert(glitches)
      .values({
        glitchId: glitch.id,
        status: glitch.status,
        description: openingDescription,
        timestamp: minutesAgo(openedMinutesAgo),
      })
      .run()
    tx.insert(echoes)
      .values(
        glitch.echoes.map(([guardianId, ago, description]) => ({
          description,
          timestamp: minutesAgo(ago),
          reportingGuardianId: guardianId,
          glitchId: glitch.id,
        })),
      )
      .run()
  }
})

const echoCount = seedGlitches.reduce((sum, g) => sum + g.echoes.length, 0)
console.log(
  `Seeded ${guardianRows.length} guardians, ${seedGlitches.length} glitches, ${echoCount} echoes.`,
)
console.log(`Demo logins: Warden (commander), Ember and Nyx (defenders); password "${DEMO_PASSWORD}".`)
