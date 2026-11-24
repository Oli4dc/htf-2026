# The story: Achrona Mission Control

Our pitch in one place, so the app, the Roblox world and the presentation tell the same story.

## One sentence

The Desync cracked open the Null Vault, Achrona's time prison, and its prisoners are loose in the city; Mission Control is where the guardians hunt them down before the magic runs out.

## The world

- **Achrona** is a city that runs on magic. **The Desync** is the force that breaks time and drains that magic.
- Every **glitch** in Achrona is caused by a **fugitive**: a prisoner who escaped from the **Null Vault**.
- **Guardians** protect the city. **Defenders** are the hunters in the field. **Commanders** run Mission Control.
- When a guardian spots something wrong, they send an **echo**: a sighting from the field.

## How the story maps to the assignment

The jury knows the assignment in these words. Say the link out loud during the pitch.

| Assignment | In our app | Where |
|---|---|---|
| Guardian with a role | Hunter (defender) or commander | Login, top bar |
| Glitch | A fugitive with a bounty: name, threat 1-5, reward, area | Dashboard, Bounties |
| Echo | A sighting of that fugitive | Fugitive page |
| A new echo opens a glitch | A commander posting a bounty opens a new glitch; hunters add sightings to existing bounties | Bounties (commanders), fugitive page |
| Status LEAKED → ASSESSING → FIXED | Wanted → Tracking → Captured | Bounties, fugitive page |
| Commander = defender + admin rights | Only commanders change any status, assign hunters and delete | Dashboard, fugitive page |

The database still stores glitches, echoes and the original statuses (minus CONTAINING). Only the words on screen changed.

## What you can do

- **Post a bounty** (commanders, on the Bounties page, phone friendly): name, threat, area, reward and what was seen. A prison-break alarm goes off.
- **Report a sighting** (everyone): on a fugitive's page, add what you saw in the field.
- **Dashboard:** every fugitive, newest first, plus the **orb**. The danger level is the share of fugitives still loose. The orb cracks, turns red and sounds the alarm as danger rises, and heals as fugitives are captured.
- **Bounties:** wanted posters. A hunter claims a bounty and earns **shards** when the fugitive is captured.
- **Hunters:** the leaderboard, ranked by shards, with titles from Initiate to Archon.
- **Roulette:** gamble your shards. The leaderboard only counts what you earned.
- **Live:** every screen updates within 2 seconds, without a refresh.
- **Roblox:** the same city as a 3D world. It reads the danger level and the open bounties per area from our app, so the world changes while we hunt.

## Demo flow (about 3 minutes)

1. **Open in the world.** "The Null Vault has been breached." Show the dashboard: danger at 58%, the orb cracked and red, 7 fugitives loose.
2. **Commander on a phone** posts a bounty on a new criminal at the Forge. The alarm fires.
3. **On the laptop** nobody touched anything: the fugitive appears on the dashboard and the danger level rises.
4. **Roblox** shows the same change in the 3D city.
5. **The hunt.** A defender claims the bounty and adds a sighting from the field. One press on the wanted poster and the fugitive is Captured.
6. **The payoff.** The danger level drops, the orb heals, the hunter earns shards and climbs the leaderboard.
7. **Close.** "Every glitch is a fugitive, every echo a sighting. Mission Control turns incident response into a hunt."

## Before the demo

- `npm run db:seed` resets the story to the opening state (58% danger, 5 of 12 captured). It also logs everyone out.
- Logins: **Warden** (commander), **Ember**, **Nyx**, **Rook** (defenders). Password `achrona`.
- Start the tunnel once and leave it running; the Roblox script needs its URL.
- Record a backup video of the full flow, including Roblox, in case the network fails on stage.
