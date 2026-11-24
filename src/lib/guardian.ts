export const GUARDIAN_ROLES = ['defender', 'commander'] as const

export type GuardianRole = (typeof GUARDIAN_ROLES)[number]

/** Public guardian data; never includes the password hash. */
export type Guardian = {
  guardianId: number
  codename: string
  role: GuardianRole
}
