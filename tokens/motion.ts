/**
 * MOTION CONSTANTS — Experience Bible §7. The single source of truth for every moving
 * thing on the site. The same values are published to CSS as custom properties in
 * src/app/globals.css (--spring-*, --ease-*, --dur-*, --stagger-base) for the DOM.
 *
 * Pacing: every curve roughly 30% slower than instinct. Weight, not speed.
 */
export const spring = {
  /** camera, large masses */
  soft: { stiffness: 40, damping: 14 },
  /** UI, cards, magnetic elements */
  default: { stiffness: 90, damping: 18 },
  /** cursor, small elements */
  snappy: { stiffness: 180, damping: 22 },
  /** camera parallax (§5): max ±0.4 units */
  parallax: { stiffness: 60, damping: 18 },
} as const

export type SpringConfig = { stiffness: number; damping: number }

export const ease = {
  entry: [0.16, 1, 0.3, 1],
  exit: [0.7, 0, 0.84, 0],
  camera: [0.65, 0, 0.35, 1],
} as const

export const duration = { micro: 180, ui: 420, camera: 1600 } as const

/** Base stagger; multiplied by distance from the trigger point (cursor's last position). */
export const stagger = { base: 40 } as const

/** §5 camera constants. */
export const camera = {
  parallaxMax: 0.4,
  handheldAmplitude: 0.0015,
  handheldHz: 0.3,
} as const

/** §2 velocity-linked constants. */
export const velocityFx = {
  chromaticMin: 0.0008,
  chromaticMax: 0.004,
} as const
