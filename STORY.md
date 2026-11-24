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
| Echo | A sighting of that fugitive | Report criminal, fugitive page |
| A new echo opens a glitch | Reporting a criminal opens a new bounty | Report criminal |
| Status LEAKED → ASSESSING → CONTAINING → FIXED | Wanted → Tracking → Cornered → Captured or Banished | Board, fugitive page |
| Commander = defender + admin rights | Only commanders change status, assign hunters and delete | Dashboard, Board |

The database still stores glitches, echoes and the four original statuses. Only the words on screen changed.

## What you can do

- **Report a criminal** (phone friendly): name, threat, area and what you saw. A prison-break alarm goes off.
- **Dashboard:** every fugitive, newest first, plus the **orb**. The danger level is the share of fugitives still loose. The orb cracks, turns red and sounds the alarm as danger rises, and heals as fugitives are captured.
- **Bounties:** wanted posters. A hunter claims a bounty and earns **shards** when the fugitive is captured or banished.
- **Board:** the hunt as four columns. Commanders drag fugitives from Wanted to Captured.
- **Hunters:** the leaderboard, ranked by shards, with titles from Initiate to Archon.
- **Roulette:** gamble your shards. The leaderboard only counts what you earned.
- **Live:** every screen updates within 2 seconds, without a refresh.
- **Roblox:** the same city as a 3D world. It reads the danger level and the open bounties per area from our app, so the world changes while we hunt.

## Demo flow (about 3 minutes)

1. **Open in the world.** "The Null Vault has been breached." Show the dashboard: danger at 58%, the orb cracked and red, 7 fugitives loose.
2. **Defender on a phone** reports a new criminal at the Forge. The alarm fires.
3. **Commander on the laptop** did not touch anything: the fugitive appears on the dashboard and the danger level rises.
4. **Roblox** shows the same change in the 3D city.
5. **The hunt.** A defender claims the bounty. The commander drags it across the board: Tracking, Cornered, Captured.
6. **The payoff.** The danger level drops, the orb heals, the hunter earns shards and climbs the leaderboard.
7. **Close.** "Every glitch is a fugitive, every echo a sighting. Mission Control turns incident response into a hunt."

## Before the demo

- `npm run db:seed` resets the story to the opening state (58% danger, 5 of 12 captured). It also logs everyone out.
- Logins: **Warden** (commander), **Ember**, **Nyx**, **Rook** (defenders). Password `achrona`.
- Start the tunnel once and leave it running; the Roblox script needs its URL.
- Record a backup video of the full flow, including Roblox, in case the network fails on stage.
