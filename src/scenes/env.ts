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
 * The studio light, prefiltered for reflections (PMREM), ready to use. Prefiltering compiles
 * its own shaders and renders dozens of passes, a stall of 50–850 ms, so it is done once per
 * visit: the first scene prefilters it and reads the result back, and every later scene is
 * handed a copy to upload (a few milliseconds), with no shaders to compile.
 */
let prefiltered: { data: Uint16Array; width: number; height: number } | null = null
export function studioEnvironment(renderer: THREE.WebGLRenderer, tex: THREE.DataTexture): THREE.Texture {
  if (prefiltered) {
    const t = new THREE.DataTexture(prefiltered.data, prefiltered.width, prefiltered.height, THREE.RGBAFormat, THREE.HalfFloatType)
    t.mapping = THREE.CubeUVReflectionMapping
    t.colorSpace = THREE.LinearSRGBColorSpace
    t.minFilter = t.magFilter = THREE.LinearFilter
    t.generateMipmaps = false
    t.needsUpdate = true
    return t
  }
  const pmrem = new THREE.PMREMGenerator(renderer)
  const rt = pmrem.fromEquirectangular(tex)
  pmrem.dispose()
  try {
    // Read back as 32-bit floats (always readable from a float target), stored as half floats.
    const gl = renderer.getContext() as WebGL2RenderingContext
    const { width, height } = rt
    const f32 = new Float32Array(width * height * 4)
    const prev = renderer.getRenderTarget()
    renderer.setRenderTarget(rt)
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, f32)
    renderer.setRenderTarget(prev)
    if (gl.getError() === gl.NO_ERROR && f32.some((v) => v > 0)) {
      const data = new Uint16Array(f32.length)
      for (let i = 0; i < f32.length; i++) data[i] = THREE.DataUtils.toHalfFloat(f32[i])
      prefiltered = { data, width, height }
    }
  } catch {}
  return rt.texture
}

/**
 * Compiles every shader a scene needs without blocking the page (the driver compiles them in
 * parallel where it can), so a scene's first frame never freezes the scroll. Resolves when
 * every program is ready (a long safety limit only guards against a driver that never says).
 */
export function warmUp(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, target: THREE.WebGLRenderTarget | null = null): Promise<void> {
  // Compile for where the scene is really drawn: a scene drawn into an effects buffer gets
  // different shaders from one drawn to the screen.
  const prev = renderer.getRenderTarget()
  renderer.setRenderTarget(target)
  // The shadow pass draws casters with depth materials the scene itself never lists, so
  // they would compile, blocking, at the first shadow. Stand-ins with the same materials
  // are compiled alongside the scene instead.
  const shadows = new THREE.Scene()
  const plain = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking })
  const made: THREE.Material[] = [plain]
  if (renderer.shadowMap.enabled)
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh || !m.castShadow) return
      let depth = m.customDepthMaterial as THREE.Material | undefined
      const src = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.MeshStandardMaterial
      if (!depth && src.alphaTest > 0 && src.map) {
        depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: src.map, alphaTest: src.alphaTest })
        made.push(depth)
      }
      shadows.add(new THREE.Mesh(m.geometry, depth ?? plain))
    })
  const compiling = [renderer.compileAsync(scene, camera), shadows.children.length ? renderer.compileAsync(shadows, camera) : null]
  renderer.setRenderTarget(prev)
  const ready = Promise.all(compiling)
    .then(() => undefined)
    .catch(() => undefined)
  return Promise.race([ready, new Promise<void>((r) => setTimeout(r, 20000))])
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

/**
 * A photograph as a texture, decoded off the main thread (ImageBitmap) and uploaded in an
 * idle moment. The texture is returned at once and fills in when ready, so building a scene
 * never waits on, or stalls for, its images.
 */
const bitmaps = new THREE.ImageBitmapLoader().setOptions({ imageOrientation: 'flipY', premultiplyAlpha: 'none' })
export function photoTexture(renderer: THREE.WebGLRenderer, url: string, color = true, onLoad?: () => void): THREE.Texture {
  const tex = new THREE.Texture()
  tex.flipY = false
  if (color) tex.colorSpace = THREE.SRGBColorSpace
  bitmaps.load(url, (bmp) => {
    tex.image = bmp
    tex.needsUpdate = true
    uploadWhenIdle(renderer, tex)
    onLoad?.()
  })
  return tex
}

/**
 * Runs a scene's construction in slices across frames, a few milliseconds per frame, so no
 * single frame carries a whole build (a scene ahead of you is put together while you scroll,
 * without a hitch). Stops quietly if the scene is disposed part-way.
 */
export function sliced(steps: (() => void)[], alive: () => boolean, budget = 6): Promise<void> {
  return new Promise((resolve) => {
    let i = 0
    const run = () => {
      if (!alive()) return resolve()
      const t0 = performance.now()
      while (i < steps.length) {
        const ts = performance.now()
        steps[i++]()
        const took = performance.now() - ts
        if (took > 25 && process.env.NODE_ENV !== 'production') console.info(`[scene] slice ${i - 1}/${steps.length} took ${Math.round(took)} ms: ${String(steps[i - 1]).replace(/\s+/g, ' ').slice(0, 90)}`)
        if (performance.now() - t0 > budget) break
      }
      if (i < steps.length) requestAnimationFrame(run)
      else resolve()
    }
    requestAnimationFrame(run)
  })
}

/** One step per texture the scene already has an image for: upload it to the GPU ahead of
 * the first frame (used with sliced(), so each upload has a frame to itself). */
export function uploadSteps(renderer: THREE.WebGLRenderer, scene: THREE.Scene): (() => void)[] {
  const seen = new Set<THREE.Texture>()
  scene.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined
    for (const mat of Array.isArray(m) ? m : m ? [m] : [])
      for (const v of Object.values(mat)) if (v instanceof THREE.Texture && v.image) seen.add(v)
  })
  return [...seen].map((t) => () => {
    try {
      renderer.initTexture(t)
    } catch {}
  })
}
