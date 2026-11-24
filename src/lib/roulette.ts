// Roulette rules, shared by the server and the wheel. Single-zero (European) wheel.

/** Pocket order clockwise, starting at the top. */
export const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14,
  31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
] as const

const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36])

export type PocketColor = 'red' | 'black' | 'green'

export function colorOf(n: number): PocketColor {
  if (n === 0) return 'green'
  return RED.has(n) ? 'red' : 'black'
}

/** A colour, or one number as a string ('0'..'36'). */
export type RouletteBet = PocketColor | `${number}`

export function isRouletteBet(value: unknown): value is RouletteBet {
  if (value === 'red' || value === 'black' || value === 'green') return true
  if (typeof value !== 'string' || !/^\d{1,2}$/.test(value)) return false
  return Number(value) <= 36
}

/**
 * Total paid back (wager included), 0 when lost.
 * Red/black pays 2x, green (the zero) and a single number pay 36x.
 */
export function payoutFor(bet: RouletteBet, result: number, wager: number) {
  if (bet === 'red' || bet === 'black') return colorOf(result) === bet ? wager * 2 : 0
  if (bet === 'green') return result === 0 ? wager * 36 : 0
  return Number(bet) === result ? wager * 36 : 0
}

export function betLabel(bet: string) {
  if (bet === 'red') return 'Red'
  if (bet === 'black') return 'Black'
  if (bet === 'green') return 'Green (0)'
  return `Number ${bet}`
}

export const MAX_WAGER = 10_000

export type Spin = {
  spinId: number
  bet: string
  wager: number
  result: number
  payout: number
  createdAt: string
}
