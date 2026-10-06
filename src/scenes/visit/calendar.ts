import * as THREE from 'three'
import { leatherNormals } from '../textures'
import { visibleGate } from '../visible'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { studioSource, warmUp } from '../env'

/**
 * SCENE 6 · THE CALENDAR. A Platera desk calendar on an espresso leather stand, bound in
 * gold wire. Each cream page is a bookable day, from tomorrow, the store's closed days
 * left out. Drag a page upward and it curls over the binding with the bend of real card,
 * following the finger; let go past halfway and it flips over, or it falls back. The page
 * facing you is the day you will visit.
 *
 * Units are centimetres. Pages hang from the binding at the top; flipping rotates them
 * up and over the top to the back of the stand.
 */
export type CalendarDay = { value: string; day: string; weekday: string; month: string }
export type CalendarApi = {
  pointer: (x: number, y: number, phase: 'down' | 'move' | 'up') => void
  flip: (dir: 1 | -1) => void
  resize: () => void
  dispose: () => void
}

const W = 30
const H = 36
const SEG = 48
const LEAN = 0.32 // the stand leans back, radians

function fontFamily(varName: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  return v ? `${v}, ${fallback}` : fallback
}

function pageTexture(d: CalendarDay | null): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 1228
  const g = c.getContext('2d')!
  // Cream card with a faint fibre.
  g.fillStyle = '#f7efe0'
  g.fillRect(0, 0, c.width, c.height)
  const img = g.getImageData(0, 0, c.width, c.height)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 7
    img.data[i] += n
    img.data[i + 1] += n
    img.data[i + 2] += n
  }
  g.putImageData(img, 0, 0)
  const serif = fontFamily('--font-gambetta', 'Georgia, serif')
  const sans = fontFamily('--font-satoshi', 'Helvetica, Arial, sans-serif')
  g.strokeStyle = '#c99a3e'
  g.lineWidth = 3
  g.strokeRect(46, 120, c.width - 92, c.height - 166)
  g.textAlign = 'center'
  g.fillStyle = '#a77a2c'
  g.font = `500 34px ${sans}`
  g.letterSpacing = '14px'
  g.fillText('P L A T E R A', c.width / 2, 86)
  if (d) {
    g.letterSpacing = '8px'
    g.fillStyle = '#6b4e2a'
    g.font = `500 36px ${sans}`
    g.fillText(d.month.toUpperCase(), c.width / 2, 220)
    g.fillStyle = '#2b1d0e'
    g.letterSpacing = '0px'
    g.font = `400 520px ${serif}`
    g.fillText(d.day, c.width / 2, 720)
    g.font = `400 92px ${serif}`
    g.fillText(d.weekday, c.width / 2, 870)
    g.fillStyle = '#6b4e2a'
    g.font = `500 32px ${sans}`
    g.letterSpacing = '4px'
    g.fillText('10 AM – 2 PM  ·  4 – 9 PM', c.width / 2, 1000)
    g.fillText('GORAI 1, BORIVALI WEST', c.width / 2, 1050)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

export function createCalendar(canvas: HTMLCanvasElement, days: CalendarDay[], onChange: (index: number) => void): CalendarApi {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  // Shader logs are not read back after each compile: reading them forces the compile to
  // finish on the spot, which turns background compilation into a stall.
  renderer.debug.checkShaderErrors = false
  // Hidden until every shader is ready, then faded in: never a freeze, never a flash.
  canvas.style.opacity = '0'
  canvas.style.transition = 'opacity 700ms ease'
  const gate = visibleGate(canvas)
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = 0.9
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0.91, 0.83, 0.65)
  // The desk melts into the background: no horizon line behind the calendar.
  scene.fog = new THREE.Fog(new THREE.Color(0.91, 0.83, 0.65), 120, 260)
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 500)
  const pmrem = new THREE.PMREMGenerator(renderer)
  let envTex: THREE.Texture | null = null
  let warmed = false
  studioSource().then((tex) => {
    envTex = pmrem.fromEquirectangular(tex).texture
    scene.environment = envTex
    warmUp(renderer, scene, camera).then(() => {
      warmed = true
      canvas.style.opacity = '1'
    })
    scene.environmentIntensity = 0.7
  })

  // The desk: champagne silk-wrapped surface far behind; a leather pad under the stand.
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(600, 400), new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.86, 0.68, 0.4), roughness: 0.5, sheen: 0.8, sheenColor: new THREE.Color(1, 0.9, 0.7) }))
  desk.rotation.x = -Math.PI / 2
  desk.receiveShadow = true
  scene.add(desk)

  // Espresso calf over the stand: a fine pebbled grain under a soft polish.
  const leather = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.12, 0.065, 0.03), roughness: 0.48, normalMap: leatherNormals(), normalScale: new THREE.Vector2(0.45, 0.45), sheen: 0.7, sheenRoughness: 0.4, sheenColor: new THREE.Color(0.62, 0.42, 0.24), clearcoat: 0.55, clearcoatRoughness: 0.22 })
  const gold = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(1.0, 0.77, 0.34), metalness: 1, roughness: 0.16 })

  // The stand: an easel back leaning behind, a base in front, both leather.
  const stand = new THREE.Group()
  scene.add(stand)
  const back = new THREE.Mesh(new RoundedBoxGeometry(W + 3, H + 4, 1.2, 4, 0.5), leather)
  back.castShadow = back.receiveShadow = true
  const pivotTop = new THREE.Vector3(0, Math.cos(LEAN) * (H + 3), -Math.sin(LEAN) * (H + 3))
  back.position.set(0, pivotTop.y / 2, pivotTop.z / 2 - 0.8)
  back.rotation.x = -LEAN
  stand.add(back)
  const base = new THREE.Mesh(new RoundedBoxGeometry(W + 3, 1.4, 12, 4, 0.5), leather)
  base.position.set(0, 0.7, 4)
  base.castShadow = base.receiveShadow = true
  stand.add(base)
  // Gold wire binding: a row of loops along the top edge.
  const coil = new THREE.TorusGeometry(0.9, 0.12, 10, 24)
  for (let i = 0; i < 22; i++) {
    const loop = new THREE.Mesh(coil, gold)
    loop.position.set(-W / 2 + 1.2 + (i * (W - 2.4)) / 21, pivotTop.y + 0.2, pivotTop.z + 0.4)
    loop.rotation.y = Math.PI / 2
    loop.castShadow = true
    stand.add(loop)
  }

  // ── Pages ──
  // Each page is a strip of SEG segments hanging from the binding. A page's state is its
  // flip angle a (0 = hanging at the front, π = over the top and down the back); the
  // segments bend progressively along the page so it curls like card, most mid-flip.
  type Page = { mesh: THREE.Mesh; geo: THREE.PlaneGeometry; mat: THREE.MeshPhysicalMaterial; dayIndex: number }
  const back2 = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.95, 0.91, 0.84), roughness: 0.75, side: THREE.BackSide })
  const POOL = 4
  const pages: Page[] = []
  for (let i = 0; i < POOL; i++) {
    const geo = new THREE.PlaneGeometry(W, H, 1, SEG)
    const mat = new THREE.MeshPhysicalMaterial({ map: pageTexture(null), roughness: 0.7, sheen: 0.3, sheenColor: new THREE.Color(1, 1, 1), side: THREE.FrontSide })
    const front = new THREE.Mesh(geo, mat)
    front.castShadow = front.receiveShadow = true
    const reverse = new THREE.Mesh(geo, back2)
    reverse.castShadow = true
    front.add(reverse)
    scene.add(front)
    pages.push({ mesh: front, geo, mat, dayIndex: -1 })
  }

  const base0 = new Float32Array((pages[0].geo.attributes.position as THREE.BufferAttribute).array)
  const shape = (p: Page, a: number, layer: number) => {
    // a: 0 → π. φ is the direction each segment runs, measured from straight down toward
    // the viewer: φ = LEAN hangs the page at the front, leaning with the stand; flipping
    // swings it up toward you, over the top, and down the back (φ = 2π − LEAN).
    const pos = p.geo.attributes.position as THREE.BufferAttribute
    const phi0 = LEAN + (a / Math.PI) * (Math.PI * 2 - LEAN * 2)
    const curl = Math.sin(a) * 0.9 // card bends most mid-flip; the free end lags behind
    const seg = H / SEG
    let y = pivotTop.y
    let z = pivotTop.z + 0.5 + layer * 0.07
    for (let r = 0; r <= SEG; r++) {
      const t = r / SEG
      const phi = phi0 - curl * t
      for (let c = 0; c < 2; c++) {
        const idx = r * 2 + c
        pos.setX(idx, base0[idx * 3])
        pos.setY(idx, y)
        pos.setZ(idx, z)
      }
      y -= Math.cos(phi) * seg
      z += Math.sin(phi) * seg
    }
    pos.needsUpdate = true
    p.geo.computeVertexNormals()
  }

  // State: `index` is the day on the front; `flip` animates 0 → π for the page turning away
  // (or π → 0 when turning back). Dragging drives `flip` directly.
  let index = 0
  let flip = 0
  let flipV = 0
  let dir: 1 | -1 = 1
  let dragging = false
  let dragY0 = 0
  let target = 0

  const assign = () => {
    // Pool slots: [0] the turning page, [1] the page beneath, [2] the one under that, [3] spare.
    const want = [index, index + 1, index + 2, index - 1]
    pages.forEach((p, k) => {
      const di = want[k]
      if (p.dayIndex !== di) {
        p.dayIndex = di
        p.mat.map?.dispose()
        p.mat.map = pageTexture(di >= 0 && di < days.length ? days[di] : null)
        p.mat.needsUpdate = true
      }
      p.mesh.visible = di >= 0 && di < days.length
    })
  }
  assign()

  let raf = 0
  let last = performance.now()
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame)
    if (!gate.on) {
      last = now
      return
    }
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    if (!dragging) {
      flipV += (-70 * (flip - target) - 12 * flipV) * dt
      flip += flipV * dt
      if (target === Math.PI && flip > Math.PI - 0.02 && Math.abs(flipV) < 0.6) {
        // The page has gone over: the next day is now on the front.
        index = Math.min(days.length - 1, index + 1)
        flip = target = flipV = 0
        assign()
        onChange(index)
      }
    }
    // Turning back: show the previous page coming over from behind.
    const turning = dir === 1 ? pages[0] : pages[3]
    const a = dir === 1 ? flip : Math.PI - flip
    pages.forEach((p, k) => {
      if (p === turning) shape(p, Math.max(0, Math.min(Math.PI, a)), 3)
      else if (k === 3) shape(p, Math.PI, 0)
      else shape(p, 0, 2 - k)
    })
    if (warmed) renderer.render(scene, camera)
  }

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    const portrait = w / h < 0.8
    camera.fov = portrait ? 42 : 30
    camera.position.set(portrait ? 0 : -24, portrait ? 36 : 32, portrait ? 92 : 112)
    camera.lookAt(portrait ? 0 : -24, portrait ? 21 : 19, 0)
    camera.updateProjectionMatrix()
  }
  resize()
  raf = requestAnimationFrame(frame)
  onChange(0)

  const key = new THREE.DirectionalLight(0xfff0d8, 2.2)
  key.position.set(-40, 80, 70)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  Object.assign(key.shadow.camera, { left: -60, right: 60, top: 70, bottom: -20 })
  scene.add(key)
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x6a4420, 0.45))

  const doFlip = (d: 1 | -1) => {
    if (d === 1 && index >= days.length - 1) return
    if (d === -1 && index <= 0) return
    if (d === 1) {
      dir = 1
      target = Math.PI
    } else {
      // Bring the previous page back over from behind.
      dir = -1
      index -= 1
      assign()
      onChange(index)
      flip = Math.PI
      target = 0
      dir = 1
      flip = Math.PI
      flipV = 0
      // Animate as the front page dropping into place from the top.
      flip = Math.PI * 0.999
      target = 0
    }
  }

  return {
    pointer: (_x, y, phase) => {
      if (phase === 'down') {
        dragging = true
        dragY0 = y
        dir = 1
      } else if (phase === 'move' && dragging) {
        // Dragging up by half the canvas turns the page fully.
        flip = Math.max(0, Math.min(Math.PI, ((dragY0 - y) / 0.5) * Math.PI))
      } else if (phase === 'up' && dragging) {
        dragging = false
        target = flip > Math.PI / 2 && index < days.length - 1 ? Math.PI : 0
      }
    },
    flip: doFlip,
    resize,
    dispose: () => {
      cancelAnimationFrame(raf)
      gate.dispose()
      pages.forEach((p) => {
        p.mat.map?.dispose()
        p.mat.dispose()
        p.geo.dispose()
      })
      back2.dispose()
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        if (m.geometry && !pages.some((p) => p.geo === m.geometry)) m.geometry.dispose()
      })
      leather.normalMap?.dispose()
      leather.dispose()
      gold.dispose()
      envTex?.dispose()
      pmrem.dispose()
      renderer.dispose()
    },
  }
}
