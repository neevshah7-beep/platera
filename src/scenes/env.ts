import * as THREE from 'three'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'

/**
 * The studio light (public/env/studio.exr), fetched and parsed once for the whole visit and
 * shared by every scene; each scene still prefilters it for its own renderer (PMREM).
 */
let source: Promise<THREE.DataTexture> | null = null
export function studioSource(): Promise<THREE.DataTexture> {
  source ??= new EXRLoader().loadAsync('/env/studio.exr').then((t) => {
    t.mapping = THREE.EquirectangularReflectionMapping
    return t
  })
  return source
}

/**
 * Compiles every shader a scene needs without blocking the page (the driver compiles them in
 * parallel where it can), so a scene's first frame never freezes the scroll. Resolves when
 * ready, or after a few seconds whatever happens, so a scene never stays blank.
 */
export function warmUp(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera): Promise<void> {
  const ready = renderer.compileAsync(scene, camera).then(() => undefined).catch(() => undefined)
  return Promise.race([ready, new Promise<void>((r) => setTimeout(r, 4000))])
}

/**
 * Uploads textures to the GPU one at a time in idle moments, instead of all at once in a
 * scene's first frame (a dozen large photographs uploaded together freeze the page).
 */
const queue: (() => void)[] = []
let pumping = false
const idle = (cb: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(cb, { timeout: 200 }) : setTimeout(cb, 16))
function pump() {
  if (pumping) return
  pumping = true
  const step = () => {
    const job = queue.shift()
    if (!job) {
      pumping = false
      return
    }
    job()
    idle(step)
  }
  idle(step)
}
export function uploadWhenIdle(renderer: THREE.WebGLRenderer, tex: THREE.Texture) {
  queue.push(() => {
    try {
      renderer.initTexture(tex)
    } catch {}
  })
  pump()
}
