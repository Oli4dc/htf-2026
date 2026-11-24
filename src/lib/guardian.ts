export const GUARDIAN_ROLES = ['defender', 'commander'] as const

export type GuardianRole = (typeof GUARDIAN_ROLES)[number]

/**
 * What the role is called on screen. The database keeps 'defender' (the assignment's
 * word, and what the server and the Roblox client check); players know them as hunters.
 */
export const ROLE_LABELS: Record<GuardianRole, string> = {
  defender: 'Hunter',
  commander: 'Commander',
}

export function roleLabel(role: string) {
  return ROLE_LABELS[role as GuardianRole] ?? role
}

/** Public guardian data; never includes the password hash. */
export type Guardian = {
  guardianId: number
  codename: string
  role: GuardianRole
}
