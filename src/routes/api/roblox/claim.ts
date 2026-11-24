import { createFileRoute } from '@tanstack/react-router'
import { isValidGridKey } from '#/lib/grid.server.ts'
import { PlayerError, claimFromRoblox, parseGlitchId, parseRobloxUserId } from '#/lib/roblox.server.ts'

// Called by the Roblox server when a player presses "Take this bounty". Same key check as /api/roblox/state.
// Body: { robloxUserId, glitchId } -> 200 { ok: true } | 409 { error } (shown to the player)
export const Route = createFileRoute('/api/roblox/claim')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isValidGridKey(request.headers.get('x-grid-key'))) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
        try {
          const body = (await request.json()) as { robloxUserId?: unknown; glitchId?: unknown }
          claimFromRoblox(parseRobloxUserId(body.robloxUserId), parseGlitchId(body.glitchId))
          return Response.json({ ok: true })
        } catch (err) {
          if (err instanceof PlayerError) return Response.json({ error: err.message }, { status: 409 })
          return Response.json({ error: 'Bad request' }, { status: 400 })
        }
      },
    },
  },
})
