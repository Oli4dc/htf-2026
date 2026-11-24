import { sql } from 'drizzle-orm'
import { db } from './index.ts'
import { echoes, glitches, guardians, rouletteSpins, sessions } from './schema.ts'
import { hashPassword } from '../lib/password.server.ts'
import { defaultReward, type BountyKind, type BountyObjective, type Location } from '../lib/bounty.ts'

// Demo logins; every guardian shares this password.
const DEMO_PASSWORD = 'achrona'

const WARDEN = 1
const EMBER = 2
const NYX = 3
const ROOK = 4

const guardianRows: (typeof guardians.$inferInsert)[] = [
  { guardianId: WARDEN, codename: 'Warden', role: 'commander', passwordHash: hashPassword(DEMO_PASSWORD) },
  { guardianId: EMBER, codename: 'Ember', role: 'defender', passwordHash: hashPassword(DEMO_PASSWORD) },
  { guardianId: NYX, codename: 'Nyx', role: 'defender', passwordHash: hashPassword(DEMO_PASSWORD) },
  { guardianId: ROOK, codename: 'Rook', role: 'defender', passwordHash: hashPassword(DEMO_PASSWORD) },
]

// Relative to now, so the demo always looks fresh.
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()

type SeedBounty = {
  id: number
  targetName: string
  kind: BountyKind
  objective: BountyObjective
  threat: number
  location: Location
  status: (typeof glitches.$inferInsert)['status']
  hunter: number | null
  /** [guardianId, minutesAgo, description]; the first sighting opens the bounty. */
  sightings: [number, number, string][]
}

const seedBounties: SeedBounty[] = [
  // The prison break: four fugitives out of the Null Vault, about three hours ago.
  { id: 150, targetName: 'The Hollow Warden', kind: 'FUGITIVE', objective: 'CAPTURE', threat: 5,
    location: 'citadel', status: 'LEAKED', hunter: null, sightings: [
      [NYX, 175, 'Null Vault alarm: cell zero is empty. The Hollow Warden walked out through the wall'],
      [EMBER, 40, 'Hollow footsteps on the Citadel walls, and nobody there to make them'],
    ] },
  { id: 151, targetName: 'Mother of Static', kind: 'FUGITIVE', objective: 'BANISH', threat: 4,
    location: 'portal_gate', status: 'ASSESSING', hunter: EMBER, sightings: [
      [EMBER, 170, 'Mother of Static humming at the Portal Gate. Every rune in range went silent'],
      [ROOK, 60, 'Travellers through the Portal Gate arrive with their memories scrambled'],
    ] },
  { id: 152, targetName: 'The Glass Wraith', kind: 'FUGITIVE', objective: 'CAPTURE', threat: 3,
    location: 'crystal_spire', status: 'CONTAINING', hunter: NYX, sightings: [
      [ROOK, 165, 'Reflections in the Crystal Spire move on their own'],
      [NYX, 30, 'Wraith cornered in the top chamber. All mirrors covered'],
    ] },
  { id: 153, targetName: 'Tick-Tock Jack', kind: 'FUGITIVE', objective: 'CAPTURE', threat: 2,
    location: 'forge', status: 'LEAKED', hunter: null, sightings: [
      [EMBER, 160, 'Anvils at the Forge ring before they are struck. Someone laughing in the smoke'],
    ] },

  // General bounties in every stage of the hunt.
  { id: 154, targetName: 'Upward Rain', kind: 'ANOMALY', objective: 'BANISH', threat: 1,
    location: 'central_nexus', status: 'LEAKED', hunter: null, sightings: [
      [NYX, 25, 'Rain falling upwards over the fountain of the Central Nexus'],
    ] },
  { id: 155, targetName: 'The Whispering Shelves', kind: 'ANOMALY', objective: 'BANISH', threat: 2,
    location: 'archive', status: 'ASSESSING', hunter: ROOK, sightings: [
      [ROOK, 300, 'Books in the Archive whisper the endings of other books'],
      [ROOK, 120, 'The whispers get louder near the restricted section'],
    ] },
  { id: 156, targetName: 'Ember Moths', kind: 'ANOMALY', objective: 'BANISH', threat: 3,
    location: 'forge', status: 'CONTAINING', hunter: EMBER, sightings: [
      [EMBER, 500, 'A swarm of burning moths is eating the magic out of the forge lamps'],
      [WARDEN, 200, 'Forge sealed off. The moths are trapped in the east hall'],
    ] },
  { id: 157, targetName: 'The Looping Bell', kind: 'ANOMALY', objective: 'BANISH', threat: 2,
    location: 'citadel', status: 'FIXED', hunter: NYX, sightings: [
      [NYX, 1500, 'The Citadel bell rings the same hour over and over'],
      [NYX, 1300, 'Bell rune scrubbed. The loop is broken'],
    ] },

  // Earlier hunts, already paid out, so the leaderboard has history.
  { id: 158, targetName: 'Shade of the Old Gate', kind: 'ANOMALY', objective: 'CAPTURE', threat: 4,
    location: 'portal_gate', status: 'FIXED', hunter: EMBER, sightings: [
      [ROOK, 4300, 'A shadow without an owner guards the old Portal Gate'],
      [EMBER, 4000, 'Shade caught in a lantern trap and delivered to the Null Vault'],
    ] },
  { id: 159, targetName: 'Mirror Twin', kind: 'ANOMALY', objective: 'CAPTURE', threat: 3,
    location: 'crystal_spire', status: 'FIXED', hunter: ROOK, sightings: [
      [NYX, 3600, 'Every guardian at the Crystal Spire meets themselves coming back'],
      [ROOK, 3400, 'The twin is in the Null Vault. Only one of each guardian again'],
    ] },
  { id: 160, targetName: 'The Gravity Knot', kind: 'ANOMALY', objective: 'BANISH', threat: 5,
    location: 'central_nexus', status: 'FIXED', hunter: EMBER, sightings: [
      [EMBER, 2900, 'Carts, cats and a fountain floating above the Central Nexus'],
      [WARDEN, 2800, 'Knot is pulling in the market stalls. All guardians to the Nexus'],
      [EMBER, 2600, 'Knot untied and banished. Everything came down at once. Sorry about the cats'],
    ] },
  { id: 161, targetName: 'Clockwork Rats', kind: 'ANOMALY', objective: 'CAPTURE', threat: 1,
    location: 'archive', status: 'FIXED', hunter: NYX, sightings: [
      [ROOK, 2200, 'Ticking rats chewing through the Archive catalogue'],
      [NYX, 2100, 'Rats wound down and boxed up'],
    ] },
]

// Wipe and refill so the seed can be re-run safely.
db.transaction((tx) => {
  tx.delete(sessions).run()
  tx.delete(rouletteSpins).run()
  tx.delete(echoes).run()
  tx.delete(glitches).run()
  tx.delete(guardians).run()
  tx.run(sql`DELETE FROM sqlite_sequence`)

  tx.insert(guardians).values(guardianRows).run()

  for (const bounty of seedBounties) {
    const [, openedMinutesAgo, openingDescription] = bounty.sightings[0]
    const [, lastMinutesAgo] = bounty.sightings[bounty.sightings.length - 1]
    tx.insert(glitches)
      .values({
        glitchId: bounty.id,
        status: bounty.status,
        description: openingDescription,
        timestamp: minutesAgo(openedMinutesAgo),
        targetName: bounty.targetName,
        kind: bounty.kind,
        objective: bounty.objective,
        threat: bounty.threat,
        reward: defaultReward(bounty.threat, bounty.kind),
        location: bounty.location,
        claimedByGuardianId: bounty.hunter,
        resolvedAt: bounty.status === 'FIXED' ? minutesAgo(lastMinutesAgo) : null,
      })
      .run()
    tx.insert(echoes)
      .values(
        bounty.sightings.map(([guardianId, ago, description]) => ({
          description,
          timestamp: minutesAgo(ago),
          reportingGuardianId: guardianId,
          glitchId: bounty.id,
        })),
      )
      .run()
  }
})

const sightingCount = seedBounties.reduce((sum, b) => sum + b.sightings.length, 0)
console.log(
  `Seeded ${guardianRows.length} guardians, ${seedBounties.length} bounties, ${sightingCount} sightings.`,
)
console.log(
  `Demo logins: Warden (commander), Ember, Nyx and Rook (defenders); password "${DEMO_PASSWORD}".`,
)
