import { isPhone, pixelRatio } from '../gl'
import * as THREE from 'three'
import { sliced, studioEnvironment, studioSource, warmUp } from '../env'
import { visibleGate } from '../visible'

/**
 * THE HOUSE · ONE THREAD. The story of Platera told by a single unbroken line of polished
 * silver. It draws itself into a solitaire ring; then, chapter by chapter, it lifts off the
 * wall, turns through the air and settles into the next drawing: a jeweller's eye, the
 * figures 925, a balance, and the arched doorway of the counter at Gorai 1. Where the
 * line has to travel between strokes it thins to a fine wire and passes behind, as a pen
 * would lift. A warm key light throws its shadow onto the champagne wall behind it.
 * The tube is rebuilt each frame from the interpolated drawing (parallel-transport frames,
 * tapered ends), so the metal stays continuous through every change of shape.
 */
const N = 900 // points along the line
const RS = 10 // radial segments
const R = 0.2 // tube radius (drawings are about 20 units across)

type Pt = [number, number, number, number] // x, y, z, radius multiplier
type Shape = { p: Float32Array; r: Float32Array } // N×3 positions, N radii

// ── Drawing helpers: every drawing is one continuous path. ─────────────────────────────
const arc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, k = 1, z = 0): Pt[] => {
  const n = Math.max(8, Math.round(Math.abs(a1 - a0) * Math.max(rx, ry) * 4))
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, z, k] as Pt
  })
}
const seg = (x0: number, y0: number, x1: number, y1: number, k = 1, z0 = 0, z1 = z0): Pt[] => {
  const n = Math.max(4, Math.round(Math.hypot(x1 - x0, y1 - y0) * 4))
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n
    return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z0 + (z1 - z0) * t, k] as Pt
  })
}
const bez = (a: [number, number], b: [number, number], c: [number, number], d: [number, number], k = 1, z = 0): Pt[] =>
  Array.from({ length: 41 }, (_, i) => {
    const t = i / 40, u = 1 - t
    return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1], z, k] as Pt
  })
// A pen-lift: the wire thins and passes a little behind the drawing to the next stroke.
const lift = (x0: number, y0: number, x1: number, y1: number): Pt[] => {
  const n = 30
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n
    const s = Math.sin(Math.PI * t)
    return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, -1.6 * s, 1 - 0.72 * s] as Pt
  })
}

/** Resample a path to N points evenly spaced along its length. */
function resample(path: Pt[]): Shape {
  const L = [0]
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i]
    L.push(L[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]))
  }
  const total = L[L.length - 1]
  const p = new Float32Array(N * 3)
  const r = new Float32Array(N)
  let j = 1
  for (let i = 0; i < N; i++) {
    const s = (total * i) / (N - 1)
    while (j < path.length - 1 && L[j] < s) j++
    const t = (s - L[j - 1]) / Math.max(1e-6, L[j] - L[j - 1])
    const a = path[j - 1], b = path[j]
    p[i * 3] = a[0] + (b[0] - a[0]) * t
    p[i * 3 + 1] = a[1] + (b[1] - a[1]) * t
    p[i * 3 + 2] = a[2] + (b[2] - a[2]) * t
    r[i] = a[3] + (b[3] - a[3]) * t
  }
  return { p, r }
}

// ── The five drawings. ───────────────────────────────────────────────────────────────
function ring(): Pt[] {
  // A solitaire: the band drawn from below, up into a four-claw setting and the stone.
  const cy = -2, rr = 6.2
  const a1 = Math.PI * 0.42, a2 = Math.PI * 0.58
  const top = (a: number): [number, number] => [Math.cos(a) * rr, cy + Math.sin(a) * rr]
  const [rx, ry] = top(a1), [lx, ly] = top(a2)
  return [
    ...seg(4.5, -9.6, 0.6, -8.4, 1),
    ...arc(0, cy, rr, rr, -Math.PI / 2 + 0.06, a1),
    ...seg(rx, ry, 2.5, 6.6),
    ...seg(2.5, 6.6, 1.3, 8.1),
    ...seg(1.3, 8.1, -1.3, 8.1),
    ...seg(-1.3, 8.1, -2.5, 6.6),
    ...seg(-2.5, 6.6, 2.5, 6.6),
    ...seg(2.5, 6.6, 0, 4.4),
    ...seg(0, 4.4, -2.5, 6.6),
    ...seg(-2.5, 6.6, lx, ly),
    ...arc(0, cy, rr, rr, a2, Math.PI * 1.5 + 0.02),
    ...bez([0.1, -8.2], [2.2, -8.6], [4.6, -9.6], [6.6, -8.4], 0.8),
  ]
}

function eye(): Pt[] {
  // The jeweller's eye: an almond, the iris, and a spiral into the pupil.
  return [
    ...bez([-11, -0.4], [-8, 0.2], [-9.5, 0], [-9, 0]),
    ...bez([-9, 0], [-4.5, 6.2], [4.5, 6.2], [9, 0]),
    ...bez([9, 0], [5, -5.3], [-2.4, -5.6], [-5.6, -2.4]),
    ...bez([-5.6, -2.4], [-4.8, -1.4], [-3.9, -1.2], [-3.3, -0.2]),
    ...arc(0, 0, 3.4, 3.4, Math.PI * 1.06, Math.PI * 1.06 - Math.PI * 2),
    ...Array.from({ length: 80 }, (_, i) => {
      const t = i / 79
      const a = Math.PI * 1.06 - Math.PI * 2 - t * Math.PI * 3.4
      const r = 3.4 - t * 2.3
      return [Math.cos(a) * r, Math.sin(a) * r, 0, 1] as Pt
    }),
  ]
}

function n925(): Pt[] {
  // The figures, written as one hand would: 9, 2, 5.
  return [
    ...arc(-6.2, 2.4, 2.5, 2.6, 0, Math.PI * 2),
    ...bez([-3.7, 2.4], [-3.6, -0.6], [-4, -2.6], [-6.2, -4.2]),
    ...lift(-6.2, -4.2, -2.4, 2.8),
    ...bez([-2.4, 2.8], [-2.2, 5.6], [2.6, 5.8], [2.4, 2.6]),
    ...bez([2.4, 2.6], [2.1, 0.6], [-1.2, -1.6], [-2.6, -4.1]),
    ...seg(-2.6, -4.1, 2.8, -4.1),
    ...lift(2.8, -4.1, 8.6, 5.0),
    ...seg(8.6, 5.0, 4.6, 5.0),
    ...seg(4.6, 5.0, 4.2, 1.2),
    ...bez([4.2, 1.2], [6.6, 2.6], [9.6, 1.0], [8.8, -1.8]),
    ...bez([8.8, -1.8], [8.1, -4.6], [4.6, -5.0], [3.5, -2.9]),
  ]
}

function balance(): Pt[] {
  // A jeweller's balance: foot, pillar, beam, and two pans on their strings.
  return [
    ...seg(-3.8, -8.4, 3.8, -8.4),
    ...lift(3.8, -8.4, 0, -8.4),
    ...seg(0, -8.4, 0, 5.2),
    ...arc(0, 6, 0.8, 0.8, -Math.PI / 2, Math.PI * 1.5),
    ...seg(0, 5.2, -8.4, 5.2),
    ...seg(-8.4, 5.2, -11, -0.6),
    ...arc(-8.4, -0.6, 2.6, 1.8, Math.PI, Math.PI * 2),
    ...seg(-5.8, -0.6, -8.4, 5.2),
    ...seg(-8.4, 5.2, 8.4, 5.2),
    ...seg(8.4, 5.2, 5.8, -0.6),
    ...arc(8.4, -0.6, 2.6, 1.8, Math.PI, Math.PI * 2),
    ...seg(11, -0.6, 8.4, 5.2),
  ]
}

function arch(): Pt[] {
  // The doorway of the counter at Gorai 1: the arch, the doors, the step.
  return [
    ...seg(-11, -8.4, -7.2, -8.4),
    ...seg(-7.2, -8.4, -7.2, 1.4),
    ...arc(0, 1.4, 7.2, 7.4, Math.PI, 0),
    ...seg(7.2, 1.4, 7.2, -8.4),
    ...seg(7.2, -8.4, 11, -8.4),
    ...lift(11, -8.4, -5, -8.4),
    ...seg(-5, -8.4, -5, 1.2),
    ...arc(0, 1.2, 5, 5.2, Math.PI, 0),
    ...seg(5, 1.2, 5, -8.4),
    ...lift(5, -8.4, 0, -8.4),
    ...seg(0, -8.4, 0, 6.3),
    ...lift(0, 6.3, -0.9, -1.4),
    ...arc(-0.9, -1.0, 0.4, 0.4, -Math.PI / 2, Math.PI * 1.5),
    ...lift(-0.9, -1.4, 0.9, -1.4),
    ...arc(0.9, -1.0, 0.4, 0.4, -Math.PI / 2, Math.PI * 1.5),
  ]
}

export const DRAWINGS = 5
export type ThreadApi = { setProgress: (p: number) => void; pointer: (x: number, y: number) => void; resize: () => void; dispose: () => void }

export function createThread(canvas: HTMLCanvasElement): ThreadApi {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  // Shader logs are not read back after each compile: reading them forces the compile to
  // finish on the spot, which turns background compilation into a stall.
  renderer.debug.checkShaderErrors = false
  // Hidden until every shader is ready, then faded in: never a freeze, never a flash.
  canvas.style.opacity = '0'
  canvas.style.transition = 'opacity 700ms ease'
  renderer.setClearColor(0x000000, 0)
  const gate = visibleGate(canvas)
  renderer.setPixelRatio(pixelRatio(1.5))
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = 1.12
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 400)
  camera.position.set(0, 0.5, 52)

  // The wall is the page itself (the champagne behind the canvas); this plane only
  // receives the line's shadow, in warm espresso.
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(260, 160), new THREE.ShadowMaterial({ color: new THREE.Color(0.24, 0.15, 0.06), opacity: 0.26 }))
  wall.position.z = -3.2
  wall.receiveShadow = true
  scene.add(wall)
  scene.add(new THREE.HemisphereLight(0xfff4e2, 0xd9b77e, 1.15))
  const key = new THREE.DirectionalLight(0xfff0d8, 2.4)
  key.position.set(-9, 12, 18)
  key.castShadow = true
  key.shadow.mapSize.setScalar(isPhone() ? 1024 : 2048)
  key.shadow.radius = 6
  key.shadow.bias = -0.0004
  Object.assign(key.shadow.camera, { left: -24, right: 24, top: 18, bottom: -18, near: 1, far: 60 })
  scene.add(key)

  // Polished silver, reflecting the studio light tent.
  const silver = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.98, 0.975, 0.97), metalness: 1, roughness: 0.09, clearcoat: 0.8, clearcoatRoughness: 0.05, envMapIntensity: 2.1 })
  const pmrem = new THREE.PMREMGenerator(renderer)
  let envTex: THREE.Texture | null = null
  let warmed = false
  let alive = true
  // The light is prefiltered in one frame and the shaders warmed in the next, never both
  // in the frame that built the scene.
  studioSource().then((tex) =>
    sliced(
      [
        () => {
            envTex = studioEnvironment(renderer, tex)
            silver.envMap = envTex
            silver.needsUpdate = true
        },
        () => {
            warmUp(renderer, scene, camera).then(() => {
              if (!alive) return
              warmed = true
              canvas.style.opacity = '1'
            })
        },
      ],
      () => alive,
      1,
    ),
  )

  // The tube, rebuilt in place each frame.
  const shapes = [ring(), eye(), n925(), balance(), arch()].map(resample)
  const V = N * (RS + 1)
  const pos = new Float32Array(V * 3)
  const nor = new Float32Array(V * 3)
  const idx: number[] = []
  for (let i = 0; i < N - 1; i++)
    for (let j = 0; j < RS; j++) {
      const a = i * (RS + 1) + j, b = a + RS + 1
      idx.push(a, b, a + 1, b, b + 1, a + 1)
    }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage))
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3).setUsage(THREE.DynamicDrawUsage))
  geo.setIndex(idx)
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 40)
  const tube = new THREE.Mesh(geo, silver)
  tube.castShadow = true
  tube.frustumCulled = false
  const group = new THREE.Group()
  group.add(tube)
  scene.add(group)

  const P = new Float32Array(N * 3)
  const Rr = new Float32Array(N)
  const T = new THREE.Vector3(), Nn = new THREE.Vector3(), B = new THREE.Vector3(), tmp = new THREE.Vector3()
  const build = () => {
    Nn.set(0, 0, 1)
    for (let i = 0; i < N; i++) {
      const i0 = Math.max(0, i - 1), i1 = Math.min(N - 1, i + 1)
      T.set(P[i1 * 3] - P[i0 * 3], P[i1 * 3 + 1] - P[i0 * 3 + 1], P[i1 * 3 + 2] - P[i0 * 3 + 2]).normalize()
      // Parallel transport: keep the frame from twisting along the line.
      Nn.addScaledVector(T, -Nn.dot(T))
      if (Nn.lengthSq() < 1e-6) Nn.copy(tmp.set(0, 1, 0).cross(T))
      Nn.normalize()
      B.crossVectors(T, Nn)
      // Tapered ends, like a line drawn with a pen.
      const taper = Math.min(1, i / 14, (N - 1 - i) / 14)
      const r = R * Rr[i] * Math.sqrt(Math.max(0, taper))
      for (let j = 0; j <= RS; j++) {
        const a = (j / RS) * Math.PI * 2
        const c = Math.cos(a), s = Math.sin(a)
        const nx = c * Nn.x + s * B.x, ny = c * Nn.y + s * B.y, nz = c * Nn.z + s * B.z
        const k = (i * (RS + 1) + j) * 3
        pos[k] = P[i * 3] + nx * r
        pos[k + 1] = P[i * 3 + 1] + ny * r
        pos[k + 2] = P[i * 3 + 2] + nz * r
        nor[k] = nx
        nor[k + 1] = ny
        nor[k + 2] = nz
      }
    }
    geo.attributes.position.needsUpdate = true
    geo.attributes.normal.needsUpdate = true
  }

  let progress = 0
  let lastShape = ''
  const ptr = { x: 0, y: 0, sx: 0, sy: 0 }
  const smooth = (x: number) => {
    const k = Math.min(1, Math.max(0, x))
    return k * k * (3 - 2 * k)
  }
  let raf = 0
  const t0 = performance.now()
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame)
    if (!gate.on) return
    const t = (now - t0) / 1000
    ptr.sx += (ptr.x - ptr.sx) * 0.05
    ptr.sy += (ptr.y - ptr.sy) * 0.05
    // Chapter 0 draws the ring; each chapter after opens by redrawing the line.
    const seg = Math.min(DRAWINGS - 1, Math.floor(progress))
    const frac = progress - seg
    const draw = seg === 0 ? smooth(frac / 0.7) : 1
    const from = shapes[Math.max(0, seg - 1)], to = shapes[seg]
    const m = seg === 0 ? 1 : smooth(frac / 0.55)
    const lifted = Math.sin(Math.PI * m)
    // The tube is rebuilt only while the line is moving (drawing in, or changing shape);
    // a settled drawing costs nothing but its turn and lean.
    const shapeKey = `${seg}|${m.toFixed(4)}|${lifted > 0.001 ? Math.round(t * 30) : 0}`
    const rebuild = shapeKey !== lastShape
    lastShape = shapeKey
    if (rebuild) for (let i = 0; i < N; i++) {
      const u = i / (N - 1)
      // Mid-change the line lifts off the wall in a slow wave and turns through the air.
      const wave = lifted * (2.6 + 1.8 * Math.sin(u * 9 + t * 0.8))
      P[i * 3] = from.p[i * 3] + (to.p[i * 3] - from.p[i * 3]) * m
      P[i * 3 + 1] = from.p[i * 3 + 1] + (to.p[i * 3 + 1] - from.p[i * 3 + 1]) * m
      P[i * 3 + 2] = from.p[i * 3 + 2] + (to.p[i * 3 + 2] - from.p[i * 3 + 2]) * m + wave
      Rr[i] = from.r[i] + (to.r[i] - from.r[i]) * m
    }
    if (rebuild) build()
    geo.setDrawRange(0, Math.max(0, Math.floor((N - 1) * draw)) * RS * 6)
    // The drawing breathes: a slow turn, a lean toward the hand, a twist while it changes.
    group.rotation.y = Math.sin(t * 0.35) * 0.12 + ptr.sx * 0.35 + lifted * 0.5
    group.rotation.x = Math.sin(t * 0.27) * 0.05 - ptr.sy * 0.2
    group.position.y = Math.sin(t * 0.6) * 0.15
    if (warmed) renderer.render(scene, camera)
  }

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    const portrait = w / h < 0.9
    camera.fov = portrait ? 44 : 30
    // Words sit on the left on a wide screen; the drawing stands to the right.
    group.position.x = portrait ? 0 : Math.min(11, 4 + (w / h - 1) * 9)
    camera.position.y = portrait ? -6 : 0.5
    camera.updateProjectionMatrix()
  }
  resize()
  raf = requestAnimationFrame(frame)

  return {
    setProgress: (p) => (progress = Math.max(0, Math.min(DRAWINGS - 0.001, p))),
    pointer: (x, y) => {
      ptr.x = x - 0.5
      ptr.y = y - 0.5
    },
    resize,
    dispose: () => {
      alive = false
      cancelAnimationFrame(raf)
      gate.dispose()
      geo.dispose()
      silver.dispose()
      wall.geometry.dispose()
      ;(wall.material as THREE.Material).dispose()
      envTex?.dispose()
      pmrem.dispose()
      renderer.dispose()
    },
  }
}
