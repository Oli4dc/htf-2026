import { useSyncExternalStore } from 'react'

// While the roulette wheel turns, the header keeps showing the balance from before
// the spin, even if fresh data arrives. The roulette page holds it and releases it
// when the wheel stops.

let held: number | null = null
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function holdShards(value: number) {
  held = value
  emit()
}

export function releaseShards() {
  held = null
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** The shard total to show: the held value during a spin, otherwise the real one. */
export function useDisplayedShards(actual: number) {
  const value = useSyncExternalStore(
    subscribe,
    () => held,
    () => null,
  )
  return value ?? actual
}
