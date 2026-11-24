import { createFileRoute } from '@tanstack/react-router'
import { isValidGridKey } from '#/lib/grid.server.ts'
import { PlayerError, joinFromRoblox, parseHunterName, parseRobloxUserId } from '#/lib/roblox.server.ts'

// Called by the Roblox server when a player picks a hunter name. Same key check as /api/roblox/state.
// Body: { robloxUserId, name } -> 200 { guardianId, codename } | 409 { error } (shown to the player)
export const Route = createFileRoute('/api/roblox/join')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isValidGridKey(request.headers.get('x-grid-key'))) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
        try {
          const body = (await request.json()) as { robloxUserId?: unknown; name?: unknown }
          const hunter = joinFromRoblox(parseRobloxUserId(body.robloxUserId), parseHunterName(body.name))
          return Response.json(hunter)
        } catch (err) {
          if (err instanceof PlayerError) return Response.json({ error: err.message }, { status: 409 })
          return Response.json({ error: 'Bad request' }, { status: 400 })
        }
      },
    },
  },
})
