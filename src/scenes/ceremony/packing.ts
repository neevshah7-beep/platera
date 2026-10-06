import * as THREE from 'three'
import { visibleGate } from '../visible'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { studioSource } from '../env'
import { buildCarton, CARTON, FLAP_OPEN, TISSUE_OPEN_ANGLE } from './courier'

/**
 * BEFORE CHECKOUT · PREPARED AND PACKED. Two acts on the counter, one camera:
 *   I   The case. The pieces the visitor has just bought, their own photographs, are
 *       lowered onto espresso velvet in an open Platera case; the satin-lined lid swings
 *       closed on a soft spring, and a gold band is drawn around it.
 *   II  The courier box. A Platera kraft carton slides in beside it, flaps open, lined
 *       with ivory tissue. The case is lifted across and set inside; the tissue folds
 *       over it and is sealed with a gold P; the flaps close, short then long; Platera
 *       tape is drawn along the seam and down the ends; the shipping label is pressed on.
 * (The gift box is a different thing, and stays on the homepage.)
 * Plays once, reports each act (onPhase) and the end (onDone), then keeps rendering the
 * packed carton under a slow drifting camera. Units are centimetres.
 */
export type PackPiece = { base: string; width: number; height: number; maps: boolean }
export type PackPhase = 'case' | 'courier'
export type PackingApi = { resize: () => void; skip: () => void; dispose: () => void }

export function createPacking(canvas: HTMLCanvasElement, pieces: PackPiece[], onDone: () => void, onPhase?: (p: PackPhase) => void): PackingApi {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  const gate = visibleGate(canvas)
  renderer.localClippingEnabled = true
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
  studioSource().then((tex) => {
    envTex = pmrem.fromEquirectangular(tex).texture
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

  const key = new THREE.SpotLight(0xfff1dc, 3200, 260, 0.62, 0.7, 1.6)
  key.position.set(-30, 70, 40)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  scene.add(key, key.target)
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x6a4420, 0.25))

  // The courier carton waits off to the right; it slides in once the case is sealed.
  const carton = buildCarton()
  const CX = 62
  carton.group.position.set(CX + 150, 0, 0)
  scene.add(carton.group)
  document.fonts?.ready.then(() => carton.redraw())
  const [tapePlane] = carton.tapeMat.clippingPlanes!
  const [tabPlane] = carton.tabMat.clippingPlanes!
  const { W, H, T } = CARTON

  // Timeline (seconds).
  const T_PIECE = 0.9, PER = 1.3
  const T_LID = T_PIECE + n * PER + 0.8
  const T_BAND = T_LID + 2.0
  const T2 = T_BAND + 1.5 // act II: the courier box
  const T_SLIDE = T2, T_LIFT = T2 + 1.2, T_TISSUE = T2 + 3.2, T_SEAL = T2 + 4.3, T_SHORT = T2 + 4.9, T_LONG = T2 + 5.5, T_TAPE = T2 + 6.4, T_TAB = T2 + 7.3, T_LABEL = T2 + 8.0
  const T_END = T2 + 9.2
  let lidA = -1.95, lidV = 0
  let done = false
  let phase: PackPhase = 'case'
  const smooth = (x: number) => {
    const k = Math.min(1, Math.max(0, x))
    return k * k * (3 - 2 * k)
  }
  // A fold that settles with a touch of give, as board does.
  const fold = (x: number) => {
    const k = Math.min(1, Math.max(0, x))
    return 1 - Math.pow(1 - k, 3) * Math.cos(k * 4.2)
  }
  const lerp = (a: number, b: number, k: number) => a + (b - a) * k
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

    // ACT II · the courier box.
    if (phase === 'case' && t > T2) {
      phase = 'courier'
      onPhase?.('courier')
    }
    carton.group.position.x = CX + 150 * (1 - ease((t - T_SLIDE) / 1.5))
    // The case is lifted across in an arc and set down on the carton's floor.
    const lift = smooth((t - T_LIFT) / 1.9)
    caseGroup.position.set(CX * lift, T * lift + Math.sin(Math.PI * lift) * 26, 0)
    caseGroup.rotation.z = -Math.sin(Math.PI * lift) * 0.1
    // Tissue folds over, front then back; the gold P seals it.
    const { tissue, flaps, sticker, label } = carton
    tissue.front.rotation.x = lerp(TISSUE_OPEN_ANGLE, -Math.PI / 2 + 0.03, smooth((t - T_TISSUE) / 0.7))
    tissue.back.rotation.x = lerp(-TISSUE_OPEN_ANGLE, Math.PI / 2 - 0.03, smooth((t - T_TISSUE - 0.45) / 0.7))
    const s = ease((t - T_SEAL) / 0.45)
    sticker.visible = t > T_SEAL
    sticker.position.y = H - 0.2 + (1 - s) * 12
    sticker.rotation.y = (1 - s) * 2
    // The flaps close: short ones first, then the long ones meet over them.
    flaps.right.rotation.z = lerp(-FLAP_OPEN, Math.PI / 2, fold((t - T_SHORT) / 0.6))
    flaps.left.rotation.z = lerp(FLAP_OPEN, -Math.PI / 2, fold((t - T_SHORT - 0.12) / 0.6))
    flaps.back.rotation.x = lerp(-FLAP_OPEN, Math.PI / 2, fold((t - T_LONG) / 0.65))
    flaps.front.rotation.x = lerp(FLAP_OPEN, -Math.PI / 2, fold((t - T_LONG - 0.15) / 0.65))
    // Tape drawn along the seam from the left, then down both ends.
    const x0 = carton.group.position.x - W / 2 - 0.3
    tapePlane.constant = t < T_TAPE ? x0 - 1 : x0 + (W + 0.6) * smooth((t - T_TAPE) / 0.85)
    tabPlane.constant = -(H + T * 2 + 0.2 - 9 * smooth((t - T_TAB) / 0.5))
    // The label is pressed on with a little bounce.
    const l = Math.min(1, Math.max(0, (t - T_LABEL) / 0.42))
    label.visible = t > T_LABEL
    label.position.y = H + T * 1.5 + 0.1 + (1 - l) * (1 - l) * 9
    label.scale.setScalar(1 + 0.12 * (1 - l) + Math.sin(l * Math.PI) * 0.03)

    // The camera: a slow arc over the counter; for act II it widens to take in both,
    // follows the case across, and settles over the carton.
    const zk = smooth((t - T2) / 1.6)
    const fk = smooth((t - T_LIFT + 0.3) / 2.6)
    const settle = smooth((t - T_SHORT) / 3)
    // On a wide screen the words sit on the left, so the carton is framed to the right.
    const side = camera.aspect >= 1 ? 1 : 0
    const tx = CX * fk - 15 * side * zk, ty = 3 + 4 * fk
    // Once packed, the camera all but stops: a breath of drift, not an orbit.
    const tc = t <= T_END ? t : T_END + (t - T_END) * 0.15
    const a = 0.35 - Math.min(tc, T2) * 0.03 - Math.max(0, tc - T2) * 0.012
    const r = 70 + 40 * zk - 8 * settle
    const h = 62 - Math.min(tc, T2) * 0.8 + 26 * zk - 4 * settle
    camera.position.set(tx + Math.sin(a) * r, h, Math.cos(a) * r)
    camera.lookAt(tx, ty, 0)
    key.position.set(-30 + tx, 70, 40)
    key.target.position.set(tx, 0, 0)
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
    // Jump to the packed carton (every motion is a function of time, so this lands cleanly).
    skip: () => {
      if (start < 0) start = performance.now()
      start = Math.min(start, performance.now() - (T_END + 0.1) * 1000)
    },
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
