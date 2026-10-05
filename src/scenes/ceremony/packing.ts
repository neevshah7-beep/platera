import * as THREE from 'three'
import { visibleGate } from '../visible'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'

/**
 * CHECKOUT, ACT I · PREPARED FOR YOU. The pieces the visitor has just bought, their own
 * photographs, are lowered one after another onto espresso velvet in an open Platera case
 * on the counter; the satin-lined lid swings closed on a soft spring, and a gold band is
 * drawn around the case to seal it. Plays once (about 6 s), then reports done.
 * Units are centimetres.
 */
export type PackPiece = { base: string; width: number; height: number; maps: boolean }
export type PackingApi = { resize: () => void; dispose: () => void }

export function createPacking(canvas: HTMLCanvasElement, pieces: PackPiece[], onDone: () => void): PackingApi {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  const gate = visibleGate(canvas)
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = 0.85
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap

  const scene = new THREE.Scene()
  const bg = new THREE.Color(0.91, 0.83, 0.65)
  scene.background = bg
  scene.fog = new THREE.Fog(bg, 160, 320)
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 500)
  const pmrem = new THREE.PMREMGenerator(renderer)
  let envTex: THREE.Texture | null = null
  new EXRLoader().load('/env/studio.exr', (tex) => {
    tex.mapping = THREE.EquirectangularReflectionMapping
    envTex = pmrem.fromEquirectangular(tex).texture
    tex.dispose()
    scene.environment = envTex
    scene.environmentIntensity = 0.6
    envReady = true
  })

  const counter = new THREE.Mesh(new THREE.PlaneGeometry(800, 500), new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.86, 0.68, 0.4), roughness: 0.5, sheen: 0.6, sheenColor: new THREE.Color(1, 0.9, 0.7) }))
  counter.rotation.x = -Math.PI / 2
  counter.receiveShadow = true
  scene.add(counter)

  const shell = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.9, 0.78, 0.58), roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color(1, 0.93, 0.8), clearcoat: 0.2 })
  const velvet = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.08, 0.04, 0.02), roughness: 0.95, sheen: 1, sheenRoughness: 0.5, sheenColor: new THREE.Color(0.4, 0.25, 0.14), envMapIntensity: 0.3 })
  const gold = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(1.0, 0.766, 0.336), metalness: 1, roughness: 0.16 })
  const satin = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.96, 0.92, 0.84), roughness: 0.35, sheen: 1, sheenColor: new THREE.Color(1, 1, 1) })

  const CW = 44, CD = 34, DEPTH = 4
  const caseGroup = new THREE.Group()
  scene.add(caseGroup)
  const base = new THREE.Mesh(new RoundedBoxGeometry(CW, DEPTH, CD, 4, 1), shell)
  base.position.y = DEPTH / 2
  base.castShadow = base.receiveShadow = true
  caseGroup.add(base)
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(CW - 2, CD - 2), velvet)
  bed.rotation.x = -Math.PI / 2
  bed.position.y = DEPTH + 0.02
  bed.receiveShadow = true
  caseGroup.add(bed)
  const lid = new THREE.Group()
  lid.position.set(0, DEPTH, -CD / 2)
  caseGroup.add(lid)
  const lidShell = new THREE.Mesh(new RoundedBoxGeometry(CW, 2.4, CD, 4, 1), shell)
  lidShell.position.set(0, 1.2, CD / 2)
  lidShell.castShadow = true
  lid.add(lidShell)
  const lining = new THREE.Mesh(new THREE.PlaneGeometry(CW - 2, CD - 2), satin)
  lining.rotation.x = Math.PI / 2
  lining.position.set(0, -0.02, CD / 2)
  lid.add(lining)
  // The sealing band: drawn around the closed case (scale grows along its length).
  const band = new THREE.Mesh(new THREE.BoxGeometry(CW + 0.6, DEPTH + 2.4 + 0.6, 3.2), gold)
  band.position.set(0, (DEPTH + 2.4) / 2, 0)
  band.scale.set(0.0001, 1, 1)
  band.castShadow = true
  caseGroup.add(band)

  // The pieces, laid in a row on the velvet.
  // The act begins only once the photographs (and the light) have arrived.
  let assetsReady = false
  let envReady = false
  const manager = new THREE.LoadingManager(() => (assetsReady = true))
  const loader = new THREE.TextureLoader(manager)
  const n = Math.max(1, pieces.length)
  const slotW = (CW - 6) / n
  const meshes = pieces.map((p, i) => {
    const s = Math.min(slotW * 0.92, CD - 8)
    const aspect = p.width / p.height
    const w = aspect >= 1 ? s : s * aspect
    const h = aspect >= 1 ? s / aspect : s
    const map = loader.load(`${p.base}-1600.webp`)
    map.colorSpace = THREE.SRGBColorSpace
    const mat = new THREE.MeshPhysicalMaterial({ map, roughness: 0.35, metalness: 0.4, envMapIntensity: 1.8, clearcoat: 0.8, clearcoatRoughness: 0.08, alphaTest: 0.5, side: THREE.DoubleSide })
    if (p.maps) {
      mat.normalMap = loader.load(`${p.base}-normal.webp`)
      mat.roughnessMap = loader.load(`${p.base}-dr.webp`)
      mat.roughness = 1
    }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)
    m.customDepthMaterial = new THREE.MeshDepthMaterial({ map, alphaTest: 0.5, depthPacking: THREE.RGBADepthPacking })
    m.castShadow = true
    m.rotation.x = -Math.PI / 2
    m.position.set(-CW / 2 + 3 + slotW * (i + 0.5), 60, 0)
    caseGroup.add(m)
    return m
  })

  const key = new THREE.SpotLight(0xfff1dc, 3200, 200, 0.6, 0.7, 1.6)
  key.position.set(-30, 70, 40)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  scene.add(key, key.target)
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x6a4420, 0.25))

  // Timeline (seconds).
  const T_PIECE = 0.9, PER = 1.3
  const T_LID = T_PIECE + n * PER + 0.8
  const T_BAND = T_LID + 2.0
  const T_END = T_BAND + 1.8
  let lidA = -1.95, lidV = 0
  let done = false
  const created = performance.now()
  let start = -1
  let raf = 0
  let last = performance.now()
  const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3)

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame)
    if (!gate.on) {
      last = now
      return
    }
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    if (start < 0) {
      if (!(assetsReady && envReady) && now - created < 8000) {
        camera.position.set(Math.sin(0.35) * 70, 62, Math.cos(0.35) * 70)
        camera.lookAt(0, 3, 0)
        renderer.render(scene, camera)
        return
      }
      start = now
      canvas.dataset.started = String(Math.round(now))
    }
    const t = (now - start) / 1000
    meshes.forEach((m, i) => {
      const k = ease((t - T_PIECE - i * PER) / 1.2)
      m.position.y = DEPTH + 0.3 + (1 - k) * 40
      m.rotation.z = (1 - k) * 0.6 * (i % 2 ? 1 : -1)
    })
    const target = t > T_LID ? 0 : -1.95
    lidV += (-28 * (lidA - target) - 8.5 * lidV) * dt
    lidA += lidV * dt
    lid.rotation.x = lidA
    band.scale.x = Math.max(0.0001, ease((t - T_BAND) / 1.3))
    // The camera drifts in a slow arc over the counter.
    const a = 0.35 - t * 0.03
    camera.position.set(Math.sin(a) * 70, 62 - t * 1.2, Math.cos(a) * 70)
    camera.lookAt(0, 3, 0)
    renderer.render(scene, camera)
    if (!done && t > T_END) {
      done = true
      onDone()
    }
  }

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.fov = w / h < 0.8 ? 46 : 30
    camera.updateProjectionMatrix()
  }
  resize()
  raf = requestAnimationFrame(frame)

  return {
    resize,
    dispose: () => {
      cancelAnimationFrame(raf)
      gate.dispose()
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose()
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : []
        mats.forEach((x) => {
          const p = x as THREE.MeshPhysicalMaterial
          p.map?.dispose()
          p.normalMap?.dispose()
          p.roughnessMap?.dispose()
          x.dispose()
        })
      })
      envTex?.dispose()
      pmrem.dispose()
      renderer.dispose()
    },
  }
}
