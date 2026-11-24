# Teammate tasks: Guardians of the Grid

Extensions you can build while the other half of the team works on the core (schema, Overview, live updates, themes, AI) on the **same branch**.
Each task lives in **new files**, so we don't get merge conflicts. You can paste a task section into Claude as its brief.

## 1. Setup

```powershell
git pull
npm install --ignore-scripts   # plain `npm install` fails on Windows (better-sqlite3 tries to compile)
Remove-Item local.db*          # only if you have an old database
npm run db:setup               # creates local.db + demo data
npm run dev                    # http://localhost:3000
```

Demo logins (password `achrona` for all): **Warden** (commander), **Ember** and **Nyx** (defenders).
Reset the demo data at any time with `npm run db:seed`.

## 2. Rules for sharing one branch

- **Don't touch:** `src/db/schema.ts`, `src/lib/glitches.functions.ts`, `src/routes/_authed/index.tsx`, `src/components/GlitchesTable.tsx`, `src/styles.css`, `src/components/layout/TopBar.tsx` (except adding a nav link). Need a database column? Ask first.
- **Shared files:** `TopBar.tsx`, `_authed.tsx`. Only add **one line** each (an import plus a usage, or one nav item).
- `git pull --rebase` before every push. Commit small and often.
- Conflict in `src/routeTree.gen.ts`? It's generated: take either side, run `npm run dev`, and it rebuilds itself.
- After pulling a schema change: `npm run db:setup`.
- No new npm packages without asking first.

## 3. How the code works (copy these patterns)

**Stack:** TanStack Start (React + server functions), Drizzle ORM on SQLite, Tailwind v4, lucide-react icons, TypeScript.

**Folders**
```
src/routes/login.tsx                  public login page
src/routes/_authed.tsx                layout + login guard for everything inside _authed/
src/routes/_authed/index.tsx          Overview          ->  /
src/routes/_authed/bounties.tsx       Bounties          ->  /bounties  (commanders post bounties here)
src/routes/_authed/glitches/$glitchId.tsx  Glitch detail ->  /glitches/142
src/lib/*.functions.ts                server functions (callable from components and loaders)
src/lib/*.server.ts                   server-only helpers (never import them in components)
src/components/                       UI pieces
```
A new page = a new file in `src/routes/_authed/`. The URL follows the file name, and the login guard applies automatically.

**Server function (read data)**: see `src/lib/glitches.functions.ts`:
```ts
import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index.ts'
import { requireGuardian } from '#/lib/auth.server.ts'

export const getLeaderboard = createServerFn({ method: 'GET' }).handler(async () => {
  requireGuardian() // ALWAYS first: no session -> redirect to /login
  return db.select()/* ... */.all()
})
```
- With input: `.validator((data: { id: number }) => /* check + return */)` (in this version it's `.validator`, not `inputValidator`).
- Commander-only: `requireCommander()` instead of `requireGuardian()`.
- The logged-in guardian comes from `requireGuardian()`. **Never** trust a guardian id sent by the browser.

**Page with data**
```tsx
export const Route = createFileRoute('/_authed/leaderboard')({
  loader: () => getLeaderboard(),
  component: LeaderboardPage,
})
function LeaderboardPage() {
  const rows = Route.useLoaderData()
  const { guardian } = Route.useRouteContext() // { guardianId, codename, role }
}
```

**Calling a server function from a button**: `const fn = useServerFn(myFn); await fn({ data })`, then `await router.invalidate()` to reload page data.

**Database tables** (`src/db/schema.ts`)
- `guardians`: guardianId, codename, role (`defender` | `commander`)
- `glitches`: glitchId (number), status (`LEAKED` | `ASSESSING` | `FIXED`, shown as Wanted, Tracking, Captured), description, timestamp (ISO text)
- `echoes`: echoId, description, timestamp, reportingGuardianId, glitchId

**Helpers you can reuse**
- `formatGlitchId(142)` → `"GL-0142"` (`src/lib/glitch.ts`). Never store this format.
- `<StatusBadge status="LEAKED" />` and `statusMeta` (labels and colours) in `src/components/StatusBadge.tsx`
- `<TimeAgo iso={timestamp} />` in `src/components/ui/TimeAgo.tsx`
- `<Card>` in `src/components/ui/Card.tsx`, `<IconButton>` in `src/components/ui/IconButton.tsx`

**Styling**: use the theme colour classes instead of fixed colours, so dark mode and lockdown work later:
`bg-app` `bg-panel` `bg-subtle` `border-line` `text-fg` `text-muted` `text-accent` `text-mint` `shadow-glow`. The app now has a dark "Achrona night" theme: never use `bg-white` or light colours like `bg-red-50`.
Panel: `rounded-2xl border border-line bg-panel p-6`. Page title: `font-heading text-4xl text-fg` (Pirata One).
Main button: `rounded-xl bg-copper px-5 py-3 text-lg font-bold text-copper-ink hover:brightness-110`.
Mobile first: it must look good at phone width (we demo on a phone).

**Tone:** all code and comments in English. UI text stays in the world of Achrona: *guardians, glitches, echoes, The Desync, the High Council, magic*.

**Before you push:** `npx tsc --noEmit` must pass, and click through your feature in the browser.

---

## 4. Tasks, in this order

**Working features first, looks later.** Keep styling simple; the whole team does a layout/polish pass at the end.

### Task 1: Magic gauge component (needed by the core team soon)
A visual meter of the magic level in Achrona.
- New `src/components/MagicGauge.tsx`: `<MagicGauge level={72} />` where `level` is 0–100.
- Half-circle SVG gauge with the number large in the middle ("72%") and the label "Magic in Achrona".
- Colour shifts with level: green (> 70) → amber (40–70) → red (< 40). The needle or arc animates when the level changes (CSS transition).
- **Only the component.** The core team calculates the level on the server and puts it on the Overview. Make a temporary test page if you want to try values (delete it before pushing).

### Task 2: Leaderboard
A ranking with badges for the most active defenders.
- New `src/lib/leaderboard.functions.ts` (GET, `requireGuardian()` first): per guardian → codename, role, number of echoes reported, number of glitches they opened (= their echo was the first one on the glitch).
- New `src/routes/_authed/leaderboard.tsx`: podium for the top 3 + list. Badges from simple rules, for example: *First Responder* (opened the most glitches), *Echo Hunter* (10+ echoes), *Night Watch* (an echo between 00:00 and 06:00). Highlight the logged-in guardian.
- One nav link in `src/components/layout/TopBar.tsx` (copy the `Board` link).
- Later, once glitch assignment exists, we'll add "glitches fixed".

### Task 3: Map of Achrona (SVG) + map component
A map that shows exactly where in Achrona a glitch is.
- Draw a stylised fantasy map as **SVG** (Figma/Inkscape/hand-written), viewBox `0 0 1000 600`. Districts used in our data: *Lantern Quarter, Gilded Square, Archive Vaults, Northern Wells, Ashen Row, Silver Canal, Market, Old Orchard, City Gate, Crystal Observatory, Eastern Clock Tower*. Label them on the map.
- New `src/components/AchronaMap.tsx`: `<AchronaMap pins={[{ glitchId, x, y, status }]} />`. x/y are in viewBox units. Pins are coloured by status (reuse `statusMeta`), LEAKED pins pulse, hover shows `GL-0142`, click navigates to `/glitches/$glitchId`.
- Send the core team an x/y coordinate per district. We add the x/y columns, seed data and the page.

### Task 4: Report for the High Council (PDF)
Export the key data as a PDF.
- New `src/lib/council-report.functions.ts` (GET, `requireGuardian()`): counts per status, open glitches with their echo count, the 5 most recent echoes, the most active guardian.
- New `src/routes/_authed/council-report.tsx`: a formal "Report to the High Council of Achrona" page (date, summary, tables) with a **"Download PDF"** button that calls `window.print()`. The browser's *Save as PDF* does the rest, so no package is needed.
- Print styling with Tailwind `print:` classes: hide the sidebar, header and button (`print:hidden`), white background, black text.
- Link to it with one nav link in `TopBar.tsx`.

### Task 5: Keyboard shortcuts
- New `src/lib/useShortcuts.ts` hook + `src/components/ShortcutsHelp.tsx` overlay. Mount both with one line in `src/routes/_authed.tsx`.
- Keys: <kbd>j</kbd>/<kbd>k</kbd> next/previous glitch on the detail page (get the list via the existing `getGlitches` server function), <kbd>n</kbd> → `/bounties`, <kbd>g</kbd> → `/`, <kbd>?</kbd> open/close help, <kbd>Esc</kbd> close.
- **Ignore keys while typing** in an input or textarea.

### Task 6: Offline banner
- New `src/components/OfflineBanner.tsx`: listens to the browser `online`/`offline` events. When offline, show a fixed banner: *"Connection to mission control lost. Echoes can't reach the grid until you're back online."* Hide it when back online.
- One line in `src/routes/_authed.tsx`. Test with DevTools → Network → Offline.

### Optional, if time is left
- **Ley line sensors:** a page with simulated sensor readings (magic flow, time drift per district) generated by a server function, drawn as simple SVG line charts. Ask before adding a chart library.
- **Notifications:** a browser notification when a new LEAKED glitch appears. Wait until the core team has live updates.
- **Chatbot "Ask the Oracle":** only if we get an API key; it needs a new package, so ask first.

## 5. Owned by the core team (don't start these)
Search/filters, glitch assignment, kanban board, live updates, magic level calculation, dark mode + lockdown, map data and page, AI glitch types and runbook, image uploads.

Not doing: speech-to-text.
