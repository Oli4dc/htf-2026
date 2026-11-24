import { useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'

/**
 * Re-runs the loaders of the current page on a timer, so new glitches,
 * echoes and status changes show up without a refresh.
 * Form input is kept: only loader data is replaced.
 */
let holds = 0

/**
 * Stop live updates until the returned function is called, e.g. while the roulette
 * wheel turns. Calling the release function twice is harmless.
 */
export function holdLiveUpdates() {
  holds += 1
  let released = false
  return () => {
    if (released) return
    released = true
    holds -= 1
  }
}

export function useLiveUpdates(intervalMs = 2000) {
  const router = useRouter()

  useEffect(() => {
    let running = false

    async function refresh() {
      // Skip hidden tabs and never stack requests on a slow connection.
      if (running || document.hidden || !navigator.onLine || holds > 0) return
      running = true
      try {
        await router.invalidate()
      } catch {
        // Network hiccup: try again on the next tick.
      } finally {
        running = false
      }
    }

    const timer = setInterval(refresh, intervalMs)
    // Catch up at once when the guardian comes back to the tab.
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [router, intervalMs])
}
