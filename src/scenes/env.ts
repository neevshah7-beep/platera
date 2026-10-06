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
