import * as THREE from 'three'
import { sliced, studioEnvironment, studioSource, uploadWhenIdle, warmUp } from '../env'
import { visibleGate } from '../visible'

/**
 * THE JOURNEY · ENGRAVED INSIDE THE RING. A wide band of polished yellow gold floats in the
 * light, turning slowly. Scroll dives the camera down through its opening into the band;
 * from inside, the ring turns and each chapter of the house comes round, engraved into the
 * inner wall the way a jeweller engraves what matters inside a ring.
 *
 * The band is a lathe of a comfort-fit profile (rounded edges). One texture carries the
 * engraving: R is height (engraved deep), G is roughness (the cut is matte against the
 * polish), and R doubles as ambient occlusion, so the letters read in both the reflections
 * and the light. Units are about 1 cm = 1.
 */
export type JourneyMark = { line: string; sub: string }
export type JourneyApi = { setProgress: (p: number) => void; pointer: (x: number, y: number) => void; resize: () => void; dispose: () => void }

const RI = 10 // inner radius
const RO = 11.3 // outer radius
const HH = 3.2 // half height of the band
const C = 0.55 // edge rounding

/** The comfort-fit profile, inner face first, resampled evenly so v follows arc length. */
function profile(): { pts: THREE.Vector2[]; vInner: number } {
  const raw: THREE.Vector2[] = []
  const seg = (a: THREE.Vector2, b: THREE.Vector2, n: number) => {
    for (let i = 0; i < n; i++) raw.push(a.clone().lerp(b, i / n))
  }
  const arc = (cx: number, cy: number, a0: number, a1: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const a = a0 + ((a1 - a0) * i) / n
      raw.push(new THREE.Vector2(cx + Math.cos(a) * C, cy + Math.sin(a) * C))
    }
  }
  seg(new THREE.Vector2(RI, HH - C), new THREE.Vector2(RI, -HH + C), 40) // inner face, top to bottom
  const innerEnd = raw.length
  arc(RI + C, -HH + C, Math.PI, Math.PI * 1.5, 10)
  seg(new THREE.Vector2(RI + C, -HH), new THREE.Vector2(RO - C, -HH), 4)
  arc(RO - C, -HH + C, Math.PI * 1.5, Math.PI * 2, 10)
  seg(new THREE.Vector2(RO, -HH + C), new THREE.Vector2(RO, HH - C), 40)
  arc(RO - C, HH - C, 0, Math.PI * 0.5, 10)
  seg(new THREE.Vector2(RO - C, HH), new THREE.Vector2(RI + C, HH), 4)
  arc(RI + C, HH - C, Math.PI * 0.5, Math.PI, 10)
  raw.push(new THREE.Vector2(RI, HH - C))
  // Arc length at the end of the inner face, as a share of the whole.
  let total = 0, inner = 0
  for (let i = 1; i < raw.length; i++) {
    total += raw[i].distanceTo(raw[i - 1])
    if (i === innerEnd) inner = total
  }
  return { pts: raw, vInner: inner / total }
}

export function createJourney(canvas: HTMLCanvasElement, marks: JourneyMark[]): JourneyApi {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  // Shader logs are not read back after each compile: reading them forces the compile to
  // finish on the spot, which turns background compilation into a stall.
  renderer.debug.checkShaderErrors = false
  // Hidden until every shader is ready, then faded in: never a freeze, never a flash.
  canvas.style.opacity = '0'
  canvas.style.transition = 'opacity 700ms ease'
  renderer.setClearColor(0x000000, 0)
  const gate = visibleGate(canvas)
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 400)
  const pmrem = new THREE.PMREMGenerator(renderer)
  let envTex: THREE.Texture | null = null
  let warmed = false
  let alive = true
  scene.add(new THREE.HemisphereLight(0xfff6e4, 0xc9a05a, 0.6))
  const key = new THREE.DirectionalLight(0xfff0d8, 1.4)
  key.position.set(-8, 14, 10)
  scene.add(key)
  // Inside the band, a soft warm light near the centre rakes across the engraving.
  const inner = new THREE.PointLight(0xfff1d6, 60, 30, 1.6)
  inner.position.set(-2.5, 2.2, 1.5)
  scene.add(inner)

  // ── The engraving texture ──
  const { pts, vInner } = profile()
  const W = 4096 // texels round the band: sharp at this distance, a third of the upload
  const H = Math.round(((2 * Math.PI * RI) / (W / 1)) * 0 + W * ((HH * 2 + 4) / (2 * Math.PI * RI))) // keep texels square-ish
  const tc = document.createElement('canvas')
  tc.width = W
  tc.height = Math.max(512, Math.min(2048, H))
  const ctx = tc.getContext('2d')!
  const family = () => getComputedStyle(document.documentElement).getPropertyValue('--font-gambetta').trim() || 'Georgia, serif'
  const sans = () => getComputedStyle(document.documentElement).getPropertyValue('--font-satoshi').trim() || 'system-ui, sans-serif'
  const step = (Math.PI * 2) / marks.length
  const draw = () => {
    // Polished surface: height 1 (R), roughness 0.14 (G).
    ctx.filter = 'none'
    ctx.fillStyle = 'rgb(255, 36, 0)'
    ctx.fillRect(0, 0, tc.width, tc.height)
    const bandH = tc.height * vInner
    // Two fine engraved lines running round the inner face.
    ctx.fillStyle = 'rgb(120, 140, 0)'
    ctx.fillRect(0, bandH * 0.12, tc.width, 3)
    ctx.fillRect(0, bandH * 0.88, tc.width, 3)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    marks.forEach((m, k) => {
      // Seen from inside the band the lathe's u runs right to left, so the engraving is
      // drawn mirrored, and mark k sits at u = 1 − k/n (the ring then turns forward).
      const u = 1 - (k * step) / (Math.PI * 2)
      const x = u * tc.width
      for (const dx of [0, -tc.width, tc.width]) {
        // The cut: a soft blur gives the walls of the engraving a bevel for the bump.
        ctx.filter = 'blur(1.5px)'
        ctx.fillStyle = 'rgb(40, 170, 0)'
        ctx.save()
        ctx.translate(x + dx, 0)
        ctx.scale(-1, 1)
        // Long marks are set smaller, so every mark fits the part of the wall in view.
        let size = bandH * 0.34
        ctx.font = `400 ${Math.round(size)}px ${family()}`
        ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${Math.round(size * 0.15)}px`
        const maxW = tc.width * 0.085
        const w = ctx.measureText(m.line).width
        if (w > maxW) {
          size *= maxW / w
          ctx.font = `400 ${Math.round(size)}px ${family()}`
          ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${Math.round(size * 0.15)}px`
        }
        ctx.fillText(m.line, 0, bandH * 0.46)
        ctx.font = `500 ${Math.round(bandH * 0.075)}px ${sans()}`
        ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${Math.round(bandH * 0.03)}px`
        ctx.fillText(m.sub.toUpperCase(), 0, bandH * 0.74)
        ctx.restore()
        // A small diamond between marks.
        const xd = x + dx + (tc.width / marks.length) / 2
        ctx.save()
        ctx.translate(xd, bandH * 0.5)
        ctx.rotate(Math.PI / 4)
        ctx.fillRect(-bandH * 0.025, -bandH * 0.025, bandH * 0.05, bandH * 0.05)
        ctx.restore()
      }
    })
    ctx.filter = 'none'
    tex.needsUpdate = true
    uploadWhenIdle(renderer, tex)
  }
  const tex = new THREE.CanvasTexture(tc)
  tex.flipY = false
  tex.wrapS = THREE.RepeatWrapping
  tex.anisotropy = 8
  tex.colorSpace = THREE.NoColorSpace

  const gold = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(1.0, 0.78, 0.4),
    metalness: 1,
    roughness: 1,
    roughnessMap: tex,
    bumpMap: tex,
    bumpScale: 6,
    aoMap: tex,
    aoMapIntensity: 1,
    clearcoat: 0.4,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.35,
  })
  let geo: THREE.LatheGeometry | null = null
  const group = new THREE.Group()
  scene.add(group)

  // Put together a slice per frame: the engraving (once the house fonts are in), the band,
  // the light, then the shaders warmed; only then is it shown.
  ;(document.fonts?.ready ?? Promise.resolve())
    .then(() =>
      sliced(
        [
          draw,
          () => {
            geo = new THREE.LatheGeometry(pts, 360)
            group.add(new THREE.Mesh(geo, gold))
          },
        ],
        () => alive,
        1,
      ),
    )
    .then(() => studioSource())
    .then((tex) =>
      sliced(
        [
          () => {
            envTex = studioEnvironment(renderer, tex)
            scene.environment = envTex
            scene.environmentIntensity = 1.0
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

  // ── Motion ──
  let progress = 0
  const ptr = { x: 0, y: 0, sx: 0, sy: 0 }
  const smooth = (x: number) => {
    const k = Math.min(1, Math.max(0, x))
    return k * k * (3 - 2 * k)
  }
  const IN0 = 0.02, IN1 = 0.2 // the dive into the band, beginning almost at once
  // Close enough that the ring fills the right of the frame from the first moment.
  const camFar = new THREE.Vector3(-4, 13.5, 17)
  const camIn = new THREE.Vector3(0, 0, 0)
  const look = new THREE.Vector3()
  let raf = 0
  const t0 = performance.now()
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame)
    if (!gate.on) return
    const t = (now - t0) / 1000
    ptr.sx += (ptr.x - ptr.sx) * 0.05
    ptr.sy += (ptr.y - ptr.sy) * 0.05
    const dive = smooth((progress - IN0) / (IN1 - IN0))
    // Outside: the camera looks down at the floating ring; diving, it drops through the
    // opening and levels out to face the inner wall.
    const arcY = camFar.y * (1 - dive) * (1 - dive)
    const pos = camFar.clone().lerp(camIn, dive)
    pos.y = arcY + Math.sin(dive * Math.PI) * 2
    camera.position.copy(pos)
    look.set(0, -2 * (1 - dive), 0).lerp(new THREE.Vector3(0, 0, -RI), dive)
    look.x += ptr.sx * 2.5 * dive
    look.y += -ptr.sy * 1.6 * dive
    camera.lookAt(look)
    // The ring turns: slowly while seen from outside; inside, each mark comes round to face
    // the camera (with a short hold on each).
    const inside = Math.max(0, (progress - IN1) / (1 - IN1)) * (marks.length - 1)
    const k = Math.floor(inside)
    const f = inside - k
    const held = k + smooth(Math.min(1, Math.max(0, (f - 0.35) / 0.5)))
    // Lathe angle φ = 2πu (φ = 0 toward +z); the camera faces φ = π. Mark k sits at
    // φ = 2π − k·step, so turning by k·step − π − δ brings it in front, δ to the right
    // (leaving the left of the view to the words).
    const facing = -Math.PI - (camera.aspect < 0.9 ? 0 : 0.3)
    group.rotation.y = (1 - dive) * (t * 0.18) + dive * (facing + held * step) + ptr.sx * 0.05
    group.rotation.x = (1 - dive) * 0.18
    if (warmed) renderer.render(scene, camera)
  }

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.fov = w / h < 0.9 ? 66 : 52
    camera.updateProjectionMatrix()
  }
  resize()
  raf = requestAnimationFrame(frame)

  return {
    setProgress: (p) => (progress = Math.max(0, Math.min(1, p))),
    pointer: (x, y) => {
      ptr.x = x - 0.5
      ptr.y = y - 0.5
    },
    resize,
    dispose: () => {
      alive = false
      cancelAnimationFrame(raf)
      gate.dispose()
      geo?.dispose()
      gold.dispose()
      tex.dispose()
      envTex?.dispose()
      pmrem.dispose()
      renderer.dispose()
    },
  }
}
