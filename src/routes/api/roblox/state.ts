import { createFileRoute } from '@tanstack/react-router'
import { getGridState, isValidGridKey } from '#/lib/grid.server.ts'

// Polled by the Roblox place. No session: the caller proves itself with the x-grid-key header.
export const Route = createFileRoute('/api/roblox/state')({
  server: {
    handlers: {
      GET: ({ request }) => {
        if (!isValidGridKey(request.headers.get('x-grid-key'))) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return Response.json(getGridState(), { headers: { 'Cache-Control': 'no-store' } })
      },
    },
  },
})
