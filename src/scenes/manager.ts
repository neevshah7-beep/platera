/**
 * THE SCENE MANAGER. Every 3D scene on a page registers its section and how to build and
 * dispose itself. One shared loop decides which scenes exist:
 *   · at most MAX_LIVE scenes are alive (WebGL contexts and decoded frames freed otherwise),
 *     so a laptop GPU, even one shared with other work, is never exhausted;
 *   · a scene is built when its section is on screen or within one screen of it, and only
 *     when the hand is not mid-fling, so building never interrupts a scroll;
 *   · a scene is freed once it is two screens away (hysteresis, so nothing thrashes);
 *   · if the GPU drops a scene's context, the scene is disposed and rebuilt cleanly.
 */
export type Live = { dispose: () => void }
type Entry = { el: HTMLElement; build: () => Live | null; live: Live | null; dist: number; failedAt: number }

const MAX_LIVE = 2
const entries = new Set<Entry>()
let raf = 0
let lastY = 0
let lastT = 0
let velocity = 0 // viewport heights per second
let lastBuild = 0

function distance(el: HTMLElement): number {
  const r = el.getBoundingClientRect()
  const vh = innerHeight
  if (r.bottom > 0 && r.top < vh) return 0
  return r.top >= vh ? (r.top - vh) / vh : -r.bottom / vh
}

function loop(now: number) {
  raf = requestAnimationFrame(loop)
  const dt = Math.max(1, now - lastT) / 1000
  velocity = velocity * 0.8 + (Math.abs(scrollY - lastY) / innerHeight / dt) * 0.2
  lastY = scrollY
  lastT = now
  for (const e of entries) e.dist = distance(e.el)
  const ranked = [...entries].sort((a, b) => a.dist - b.dist)
  // Look further ahead than a screen, so a scene is built (and its shaders warmed) before
  // it arrives even when the page is moving briskly.
  const wanted = new Set(ranked.filter((e) => e.dist < 1.8).slice(0, MAX_LIVE))

  // Free what is far away, or beyond the live budget.
  for (const e of ranked) {
    if (e.live && (e.dist > 2.4 || (!wanted.has(e) && ranked.filter((x) => x.live).length > MAX_LIVE))) {
      e.live.dispose()
      e.live = null
    }
  }
  // Build at most one scene per 250 ms: the nearest wanted one. A visible scene is built
  // at once; a scene still ahead waits for the scroll to slow down.
  if (now - lastBuild > 250) {
    const next = ranked.find((e) => wanted.has(e) && !e.live && now - e.failedAt > 3000)
    if (next && (next.dist === 0 || velocity < 1.2)) {
      lastBuild = now
      try {
        const t0 = performance.now()
        next.live = next.build()
        const ms = performance.now() - t0
        if (ms > 40 && process.env.NODE_ENV !== 'production') console.info(`[scene] built #${next.el.id} in ${Math.round(ms)} ms`)
      } catch (err) {
        console.warn('[scene] build failed', err)
        next.failedAt = now
      }
    }
  }
}

export function registerScene(el: HTMLElement, build: () => Live | null) {
  const entry: Entry = { el, build, live: null, dist: Infinity, failedAt: -1e9 }
  entries.add(entry)
  if (!raf) {
    lastY = scrollY
    lastT = performance.now()
    raf = requestAnimationFrame(loop)
  }
  return {
    /** Dispose and let the manager rebuild (e.g. after a lost WebGL context). */
    reset() {
      entry.live?.dispose()
      entry.live = null
      entry.failedAt = performance.now() - 2500
    },
    unregister() {
      entry.live?.dispose()
      entry.live = null
      entries.delete(entry)
      if (!entries.size) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    },
  }
}

/** Velocity of the scroll, in viewport heights per second (for effects that answer speed). */
export const scrollVelocity = () => velocity
