import { ease, spring, type SpringConfig } from '@tokens/motion'

/**
 * Springs, easings and noise: the physics every moving thing on the site runs on.
 * Constants live in tokens/motion.ts (Experience Bible §7).
 */
/** A cubic-bezier evaluator (same maths as CSS), for driving shaders and cameras with the eases above. */
export function bezier([x1, y1, x2, y2]: readonly [number, number, number, number]) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t
  const sy = (t: number) => ((ay * t + by) * t + cy) * t
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx
  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x
      const d = dx(t)
      if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break
      t -= e / d
    }
    return sy(t)
  }
}

export const easeCamera = bezier(ease.camera)
export const easeEntry = bezier(ease.entry)

/**
 * A damped spring on one value, integrated semi-implicitly at a fixed 240 Hz substep so it
 * behaves the same at 30 fps and 144 fps. Mass is 1. No allocation per step.
 */
export class Spring {
  value: number
  velocity = 0
  target: number
  constructor(
    initial: number,
    public config: SpringConfig = spring.default,
  ) {
    this.value = initial
    this.target = initial
  }
  step(dt: number) {
    const h = 1 / 240
    let t = Math.min(dt, 0.1)
    while (t > 1e-6) {
      const s = Math.min(h, t)
      const f = -this.config.stiffness * (this.value - this.target) - this.config.damping * this.velocity
      this.velocity += f * s
      this.value += this.velocity * s
      t -= s
    }
    return this.value
  }
  snap(v: number) {
    this.value = this.target = v
    this.velocity = 0
  }
}

/** Three springs for a vector. */
export class Spring3 {
  x: Spring
  y: Spring
  z: Spring
  constructor(v: [number, number, number], config: SpringConfig = spring.default) {
    this.x = new Spring(v[0], config)
    this.y = new Spring(v[1], config)
    this.z = new Spring(v[2], config)
  }
  set(x: number, y: number, z: number) {
    this.x.target = x
    this.y.target = y
    this.z.target = z
  }
  step(dt: number, out: { set: (x: number, y: number, z: number) => unknown }) {
    out.set(this.x.step(dt), this.y.step(dt), this.z.step(dt))
  }
  snap(x: number, y: number, z: number) {
    this.x.snap(x)
    this.y.snap(y)
    this.z.snap(z)
  }
  get speed() {
    return Math.hypot(this.x.velocity, this.y.velocity, this.z.velocity)
  }
}

/** Smooth 1D value noise, for the handheld camera and the ±8% light breathing. */
export function noise1(t: number, seed = 0) {
  const i = Math.floor(t)
  const f = t - i
  const h = (n: number) => {
    const s = Math.sin((n + seed * 57.13) * 127.1) * 43758.5453
    return s - Math.floor(s)
  }
  const u = f * f * (3 - 2 * f)
  return (h(i) * (1 - u) + h(i + 1) * u) * 2 - 1
}
