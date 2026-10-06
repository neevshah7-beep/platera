import * as THREE from 'three'
import { visibleGate } from '../visible'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { studioSource } from '../env'

/**
 * THE LAMP (piece page). The piece lies on an espresso velvet pad in a gold-rimmed tray,
 * exactly as the photograph shows it, but lit: its generated normal, depth and roughness
 * maps let a moving light play across the metal and stones. The visitor carries a
 * jeweller's lamp with the pointer (it follows on a spring, with inertia, and drifts on
 * its own when left alone). Light moods recolour the lamp: the store's lamp, daylight, a
 * diya's flame, evening, a mandap's marigold glow.
 */
export type Mood = 'lamp' | 'daylight' | 'diya' | 'evening' | 'mandap'
export const MOODS: { id: Mood; label: string }[] = [
  { id: 'lamp', label: 'The lamp' },
  { id: 'daylight', label: 'Daylight' },
  { id: 'diya', label: 'Diya' },
  { id: 'evening', label: 'Evening' },
  { id: 'mandap', label: 'Mandap' },
]
const MOOD_LIGHT: Record<Mood, { color: number; key: number; ambient: number; env: number }> = {
  lamp: { color: 0xfff1dc, key: 1.0, ambient: 0.18, env: 0.7 },
  daylight: { color: 0xf2f6ff, key: 0.9, ambient: 0.4, env: 1.0 },
  diya: { color: 0xffa64d, key: 1.25, ambient: 0.05, env: 0.25 },
  evening: { color: 0xffd2a8, key: 0.8, ambient: 0.12, env: 0.45 },
  mandap: { color: 0xffbe5c, key: 1.0, ambient: 0.22, env: 0.55 },
}

export type LampApi = {
  pointer: (x: number, y: number) => void
  setMood: (m: Mood) => void
  resize: () => void
  dispose: () => void
}

export function createLamp(canvas: HTMLCanvasElement, piece: { base: string; width: number; height: number; maps: boolean }): LampApi {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', alpha: true })
  const gate = visibleGate(canvas)
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = 0.92
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(28, 1, 1, 400)
  const pmrem = new THREE.PMREMGenerator(renderer)
  let envTex: THREE.Texture | null = null
  studioSource().then((tex) => {
    envTex = pmrem.fromEquirectangular(tex).texture
    scene.environment = envTex
  })

  // The tray: espresso velvet in leather, a fine gold rim.
  const velvet = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.2, 0.11, 0.045), roughness: 0.95, sheen: 1, sheenRoughness: 0.45, sheenColor: new THREE.Color(0.62, 0.42, 0.22), envMapIntensity: 0.3 })
  const leather = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.2, 0.11, 0.05), roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.3 })
  const gold = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(1.0, 0.766, 0.336), metalness: 1, roughness: 0.14 })
  const TW = 52, TD = 40
  const frame = new THREE.Mesh(new RoundedBoxGeometry(TW, 2.2, TD, 4, 1), leather)
  frame.position.y = -1.1
  frame.receiveShadow = true
  scene.add(frame)
  // The velvet bed, gently domed like a cushion.
  const bedGeo = new THREE.PlaneGeometry(TW - 3, TD - 3, 60, 60)
  const bp = bedGeo.attributes.position as THREE.BufferAttribute
  for (let k = 0; k < bp.count; k++) {
    const u = bp.getX(k) / ((TW - 3) / 2), v = bp.getY(k) / ((TD - 3) / 2)
    bp.setZ(k, 0.6 * (1 - u * u) * (1 - v * v))
  }
  bedGeo.computeVertexNormals()
  const bed = new THREE.Mesh(bedGeo, velvet)
  bed.rotation.x = -Math.PI / 2
  bed.position.y = 0.02
  bed.receiveShadow = true
  scene.add(bed)
  for (const [w, d, x, z] of [[TW - 2.6, 0.18, 0, (TD - 2.6) / 2], [TW - 2.6, 0.18, 0, -(TD - 2.6) / 2], [0.18, TD - 2.6, (TW - 2.6) / 2, 0], [0.18, TD - 2.6, -(TW - 2.6) / 2, 0]] as const) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(w, 0.18, d), gold)
    r.position.set(x, 0.1, z)
    scene.add(r)
  }

  // The piece.
  const loader = new THREE.TextureLoader()
  const aspect = piece.width / piece.height
  const S = 34
  const w = aspect >= 1 ? S : S * aspect
  const h = aspect >= 1 ? S / aspect : S
  const map = loader.load(`${piece.base}-1600.webp`)
  map.colorSpace = THREE.SRGBColorSpace
  map.anisotropy = 8
  const mat = new THREE.MeshPhysicalMaterial({
    map,
    roughness: 0.35,
    metalness: 0.4,
    envMapIntensity: 1.8,
    clearcoat: 0.8,
    clearcoatRoughness: 0.08,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
  })
  if (piece.maps) {
    mat.normalMap = loader.load(`${piece.base}-normal.webp`)
    mat.normalScale.set(1.2, 1.2)
    mat.roughnessMap = loader.load(`${piece.base}-dr.webp`)
    mat.roughness = 1
  }
  const depthMat = new THREE.MeshDepthMaterial({ map, alphaTest: 0.5, depthPacking: THREE.RGBADepthPacking })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)
  mesh.customDepthMaterial = depthMat
  mesh.castShadow = true
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = 1.0
  scene.add(mesh)

  // Lights: the lamp the visitor carries (a spot, so it pools and casts the piece's
  // shadow), and a faint ambient.
  const lamp = new THREE.SpotLight(0xfff1dc, 2600, 120, 0.42, 0.8, 1.7)
  lamp.castShadow = true
  lamp.shadow.mapSize.set(2048, 2048)
  lamp.shadow.bias = -0.0003
  lamp.position.set(-14, 34, 16)
  scene.add(lamp, lamp.target)
  const amb = new THREE.HemisphereLight(0xfff4e0, 0x3a2410, 0.18)
  scene.add(amb)

  let mood: Mood = 'lamp'
  const lampColor = new THREE.Color(MOOD_LIGHT.lamp.color)
  const targetColor = new THREE.Color(MOOD_LIGHT.lamp.color)
  const goal = new THREE.Vector2(-0.3, 0.35)
  const pos = new THREE.Vector2(-0.3, 0.35)
  const vel = new THREE.Vector2()
  let lastMove = -1e9
  let raf = 0
  let last = performance.now()

  const frameFn = (now: number) => {
    raf = requestAnimationFrame(frameFn)
    if (!gate.on) {
      last = now
      return
    }
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    const t = now / 1000
    if (now - lastMove > 3000) goal.set(Math.sin(t * 0.25) * 0.55, Math.cos(t * 0.19) * 0.4)
    // A spring with inertia: the lamp swings to where it is carried and settles.
    vel.x += (-40 * (pos.x - goal.x) - 9 * vel.x) * dt
    vel.y += (-40 * (pos.y - goal.y) - 9 * vel.y) * dt
    pos.addScaledVector(vel, dt)
    lamp.position.set(pos.x * 30, 30, -pos.y * 24 + 6)
    lamp.target.position.set(pos.x * 8, 0, -pos.y * 6)
    const m = MOOD_LIGHT[mood]
    lampColor.lerp(targetColor, 1 - Math.exp(-dt * 3))
    lamp.color.copy(lampColor)
    // A diya flickers.
    const flicker = mood === 'diya' ? 1 + Math.sin(t * 13) * 0.05 + Math.sin(t * 31) * 0.04 : 1
    lamp.intensity = THREE.MathUtils.lerp(lamp.intensity, 2600 * m.key * flicker, 0.1)
    amb.intensity = THREE.MathUtils.lerp(amb.intensity, m.ambient, 0.05)
    scene.environmentIntensity = THREE.MathUtils.lerp(scene.environmentIntensity ?? 1, m.env, 0.05)
    renderer.render(scene, camera)
  }

  const resize = () => {
    const cw = canvas.clientWidth, ch = canvas.clientHeight
    renderer.setSize(cw, ch, false)
    camera.aspect = cw / ch
    camera.fov = cw / ch < 0.8 ? 40 : 28
    camera.position.set(0, 74, 46)
    camera.lookAt(0, 0, 1)
    camera.updateProjectionMatrix()
  }
  resize()
  raf = requestAnimationFrame(frameFn)

  return {
    pointer: (x, y) => {
      goal.set(x * 2 - 1, -(y * 2 - 1))
      lastMove = performance.now()
    },
    setMood: (m) => {
      mood = m
      targetColor.set(MOOD_LIGHT[m].color)
    },
    resize,
    dispose: () => {
      cancelAnimationFrame(raf)
      gate.dispose()
      scene.traverse((o) => {
        const mm = o as THREE.Mesh
        mm.geometry?.dispose()
        const mats = Array.isArray(mm.material) ? mm.material : mm.material ? [mm.material] : []
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
