import { halfRate, isPhone, jewelMaterial, pixelRatio } from '../gl'
import * as THREE from 'three'
import { visibleGate } from '../visible'
import { sliced, studioEnvironment, studioSource, warmUp } from '../env'
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { engraving } from './engrave'

/**
 * SCENE 2 · THE STRAND. A necklace in the Indian manner: polished 18k rounds alternating
 * with diamond-cut faceted beads, each pair parted by a fine gold rondelle. It hangs in a
 * catenary across warm light and is a real chain (Verlet particles, distance constraints,
 * pinned outside the frame), so it sways, settles, and can be grabbed, dragged and flicked.
 * As the page scrolls the camera glides along it, and each promise bead in turn swings out
 * of the strand toward the viewer, turning to show the mark engraved on its face.
 *
 * Lit by public/env/studio.exr (src/pipeline/blender/studio_env.py): a jewellery light tent
 * with soft strip boxes, so the gold reflects gradients, not shapes. Photographic depth of
 * field holds the promise bead sharp; a breath of bloom lifts the glints.
 * Units are centimetres. Bead Ø 8.4 mm.
 */
export const PROMISES = 6
const N = 41
const R = 0.42
const GAP = 0.2
const SPACING = 2 * R + GAP
const PROMISE_AT = [8, 13, 18, 23, 28, 33]
const MARKS = ['925', 'mg', '₹', '15', '7', '◇']

export type StrandApi = {
  setProgress: (p: number) => void // 0 → PROMISES (continuous)
  pointer: (x: number, y: number, down: boolean | null) => void
  resize: () => void
  dispose: () => void
}

/** A screen-space champagne gradient behind everything (never tone-mapped, so it matches the page). */
function backdropMaterial() {
  return new THREE.ShaderMaterial({
    toneMapped: false,
    depthWrite: true,
    uniforms: { uRes: { value: new THREE.Vector2(1, 1) } },
    vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec2 uRes;
      void main(){
        vec2 uv = gl_FragCoord.xy / uRes;
        // Warm gold satin lit from behind the strand: a soft glow behind the beads, falling
        // to rich honey and deep amber at the edges, so polished gold reads against it.
        float d = length((uv - vec2(0.66, 0.58)) * vec2(uRes.x / uRes.y, 1.0));
        vec3 glow = vec3(0.97, 0.9, 0.74);
        vec3 honey = vec3(0.87, 0.74, 0.5);
        vec3 amber = vec3(0.72, 0.55, 0.3);
        vec3 c = mix(glow, honey, smoothstep(0.0, 0.62, d));
        c = mix(c, amber, smoothstep(0.7, 1.5, d));
        gl_FragColor = vec4(c, 1.0);
      }`,
  })
}

export function createStrand(canvas: HTMLCanvasElement): StrandApi {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  // Shader logs are not read back after each compile: reading them forces the compile to
  // finish on the spot, which turns background compilation into a stall.
  renderer.debug.checkShaderErrors = false
  // Hidden until every shader is ready, then faded in: never a freeze, never a flash.
  canvas.style.opacity = '0'
  canvas.style.transition = 'opacity 700ms ease'
  const gate = visibleGate(canvas)
  renderer.setPixelRatio(pixelRatio(1.5, 1))
  const skip = halfRate()
  // Khronos PBR Neutral: keeps the gold's hue and the page's champagne true (AgX greys both).
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = 0.95
  renderer.outputColorSpace = THREE.SRGBColorSpace
  // Phones skip real-time shadows: a depth pass every frame is the cost they feel most.
  renderer.shadowMap.enabled = !isPhone()
  renderer.shadowMap.type = THREE.PCFShadowMap

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 200)
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
            scene.environment = envTex
        },
        () => {
            warmUp(renderer, scene, camera, composer.readBuffer).then(() => {
              if (!alive) return
              // One unseen pass through the effects (the canvas is still hidden), so their
              // own shaders compile before arrival, not on it.
              composer.render(0)
              warmed = true
              canvas.style.opacity = '1'
            })
        },
      ],
      () => alive,
      1,
    ),
  )

  // Backdrop: champagne light far behind, and a shadow catcher nearer, so the strand's
  // shadow falls softly on the light.
  const bgMat = backdropMaterial()
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(400, 240), bgMat)
  bg.position.z = -40
  scene.add(bg)
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(200, 120), new THREE.ShadowMaterial({ opacity: 0.2, color: 0x4a2e0c }))
  catcher.position.z = -9
  catcher.receiveShadow = true
  scene.add(catcher)

  const key = new THREE.DirectionalLight(0xfff0d6, 1.1)
  key.position.set(-10, 18, 22)
  key.castShadow = true
  key.shadow.mapSize.setScalar(isPhone() ? 512 : 1024)
  key.shadow.radius = 6
  Object.assign(key.shadow.camera, { left: -30, right: 30, top: 18, bottom: -18 })
  scene.add(key)

  // Materials: 18k yellow gold, polished; the faceted beads a touch smoother so every facet flashes.
  const gold = jewelMaterial({ color: new THREE.Color(1.0, 0.77, 0.34), metalness: 1, roughness: 0.14, envMapIntensity: 1.25 })
  const goldCut = jewelMaterial({ color: new THREE.Color(1.0, 0.79, 0.38), metalness: 1, roughness: 0.06, envMapIntensity: 1.35, flatShading: true })
  const round = new THREE.SphereGeometry(R, 64, 48)
  const cut = new THREE.IcosahedronGeometry(R * 0.94, 2) // 320 facets: a diamond-cut bead
  const rondelle = new THREE.TorusGeometry(R * 0.5, R * 0.16, 16, 40)

  const promiseMats = MARKS.map((mark) => {
    const { normal, rough, color } = engraving(mark, isPhone() ? 256 : 512)
    const m = gold.clone()
    m.setValues({ map: color, normalMap: normal, normalScale: new THREE.Vector2(1.1, 1.1), roughnessMap: rough, roughness: 1 })
    return m
  })
  const beads: THREE.Mesh[] = []
  for (let i = 0; i < N; i++) {
    const k = PROMISE_AT.indexOf(i)
    const m = k >= 0 ? new THREE.Mesh(round, promiseMats[k]) : new THREE.Mesh(i % 2 ? cut : round, i % 2 ? goldCut : gold)
    m.castShadow = true
    scene.add(m)
    beads.push(m)
  }
  const spacers: THREE.Mesh[] = []
  for (let i = 0; i < N - 1; i++) {
    const s = new THREE.Mesh(rondelle, gold)
    s.castShadow = true
    scene.add(s)
    spacers.push(s)
  }

  // ── The chain ──
  const half = ((N - 1) * SPACING) / 2
  const pinL = new THREE.Vector3(-half * 0.82, 7, 0)
  const pinR = new THREE.Vector3(half * 0.82, 7, 0)
  const pos: THREE.Vector3[] = []
  const prev: THREE.Vector3[] = []
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1)
    const p = new THREE.Vector3(THREE.MathUtils.lerp(pinL.x, pinR.x, t), 7 - Math.sin(t * Math.PI) * 9, 0)
    pos.push(p)
    prev.push(p.clone())
  }
  const gravity = new THREE.Vector3(0, -980 * 0.35, 0)
  const tmp = new THREE.Vector3()
  const axis = new THREE.Vector3()
  const zAxis = new THREE.Vector3(0, 0, 1)
  let grabbed = -1
  const grabTarget = new THREE.Vector3()
  const ndc = new THREE.Vector2()
  const ray = new THREE.Raycaster()
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
  const hit = new THREE.Vector3()

  const step = (dt: number) => {
    for (let i = 0; i < N; i++) {
      const p = pos[i]
      tmp.copy(p).sub(prev[i]).multiplyScalar(0.985)
      prev[i].copy(p)
      p.add(tmp).addScaledVector(gravity, dt * dt)
      p.z *= 0.96
    }
    for (let it = 0; it < 18; it++) {
      pos[0].copy(pinL)
      pos[N - 1].copy(pinR)
      if (grabbed >= 0) pos[grabbed].lerp(grabTarget, 0.5)
      for (let i = 0; i < N - 1; i++) {
        const a = pos[i], b = pos[i + 1]
        tmp.subVectors(b, a)
        const d = tmp.length() || 1e-6
        const diff = (d - SPACING) / d
        const wa = i === 0 ? 0 : 1, wb = i + 1 === N - 1 ? 0 : 1
        const sum = wa + wb || 1
        a.addScaledVector(tmp, (diff * wa) / sum)
        b.addScaledVector(tmp, (-diff * wb) / sum)
      }
    }
  }

  // ── Post: depth of field on the promise bead, a breath of bloom on the glints ──
  const composer = new EffectComposer(renderer)
  // Post effects at 1× (they are soft by nature); the scene itself renders at full density.
  composer.setPixelRatio(1)
  composer.addPass(new RenderPass(scene, camera))
  const bokeh = new BokehPass(scene, camera, { focus: 20, aperture: 0.0007, maxblur: 0.0032 })
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.14, 0.4, 0.95)
  // Phones go without depth of field and bloom: two extra full-screen passes every frame.
  if (!isPhone()) {
    composer.addPass(bokeh)
    composer.addPass(bloom)
  }
  composer.addPass(new OutputPass())

  let progress = 0
  let smooth = 0
  let raf = 0
  let last = performance.now()
  let acc = 0
  const lookAt = new THREE.Vector3()
  const camPos = new THREE.Vector3()
  const focusPoint = new THREE.Vector3()

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame)
    if (!gate.on) {
      last = now
      return
    }
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    acc += dt
    while (acc >= 1 / 120) {
      step(1 / 120)
      acc -= 1 / 120
    }
    smooth += (progress - smooth) * (1 - Math.exp(-dt * 3.5))

    // The camera glides along the strand toward the promise being read.
    const k = Math.min(PROMISES - 1, Math.max(0, Math.floor(smooth)))
    const fb = pos[PROMISE_AT[k]]
    const portrait = canvas.clientWidth / canvas.clientHeight < 0.8
    lookAt.set(fb.x - (portrait ? 0 : 4.2), fb.y + (portrait ? -2.6 : 0.3), 0)
    camPos.set(lookAt.x - 1.5, lookAt.y + 2.2, portrait ? 30 : 21)
    camera.position.lerp(camPos, 1 - Math.exp(-dt * 2.6))
    camera.lookAt(lookAt)

    for (let i = 0; i < N; i++) {
      const m = beads[i]
      m.position.copy(pos[i])
      const pk = PROMISE_AT.indexOf(i)
      if (pk >= 0) {
        const local = smooth - pk
        const w = Math.max(0, Math.sin(Math.min(1, Math.max(0, local)) * Math.PI)) ** 0.7
        m.position.z += w * 5.5
        m.position.y += w * 1.4
        m.scale.setScalar(1 + w * 1.25)
        // Turn so the engraved face looks straight at the camera (the mark sits at u = 0.5,
        // which a three.js sphere places on its −x side).
        const yaw = Math.atan2(camera.position.x - m.position.x, camera.position.z - m.position.z)
        const pitch = -Math.atan2(camera.position.y - m.position.y, camera.position.z - m.position.z) * 0.8
        m.rotation.set(pitch * w, yaw - Math.PI / 2 + (1 - w) * 2.6 + Math.sin(now * 0.0006 + pk) * 0.06, 0, 'YXZ')
        if (pk === k) focusPoint.copy(m.position)
      } else {
        // Cut beads turn slowly on the thread so their facets keep flashing.
        m.rotation.set(0, i * 0.7 + now * 0.00025 * (i % 2 ? 1 : 0), i * 0.3)
      }
    }
    for (let i = 0; i < N - 1; i++) {
      const s = spacers[i]
      s.position.addVectors(pos[i], pos[i + 1]).multiplyScalar(0.5)
      axis.subVectors(pos[i + 1], pos[i]).normalize()
      s.quaternion.setFromUnitVectors(zAxis, axis)
    }

    // Focus on the promise bead being read; the rest of the strand falls into bokeh.
    const u = bokeh.uniforms as Record<string, THREE.IUniform>
    u.focus.value = THREE.MathUtils.lerp(u.focus.value as number, camera.position.distanceTo(focusPoint.lengthSq() ? focusPoint : fb), 0.15)
    if (warmed && !skip()) composer.render(dt)
  }

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight
    renderer.setSize(w, h, false)
    composer.setSize(w, h)
    camera.aspect = w / h
    camera.fov = w / h < 0.8 ? 40 : 30
    camera.updateProjectionMatrix()
    const db = renderer.getDrawingBufferSize(new THREE.Vector2())
    bgMat.uniforms.uRes.value.copy(db)
  }
  resize()
  camera.position.set(0, 2, 21)
  raf = requestAnimationFrame(frame)

  return {
    setProgress: (p) => (progress = p),
    pointer: (x, y, down) => {
      ndc.set(x * 2 - 1, -(y * 2 - 1))
      ray.setFromCamera(ndc, camera)
      if (!ray.ray.intersectPlane(plane, hit)) return
      if (down === true) {
        let best = -1, bd = 1.6
        for (let i = 1; i < N - 1; i++) {
          const d = pos[i].distanceTo(hit)
          if (d < bd) (bd = d), (best = i)
        }
        grabbed = best
      } else if (down === false) grabbed = -1
      grabTarget.copy(hit)
      // Even without grabbing, the pointer brushes the strand aside as it passes.
      if (grabbed < 0)
        for (let i = 1; i < N - 1; i++) {
          const d = pos[i].distanceTo(hit)
          if (d < 1.2) pos[i].addScaledVector(tmp.subVectors(pos[i], hit).normalize(), (1.2 - d) * 0.25)
        }
    },
    resize,
    dispose: () => {
      alive = false
      cancelAnimationFrame(raf)
      gate.dispose()
      for (const g of [round, cut, rondelle]) g.dispose()
      gold.dispose()
      goldCut.dispose()
      promiseMats.forEach((m) => {
        m.map?.dispose()
        m.normalMap?.dispose()
        m.roughnessMap?.dispose()
        m.dispose()
      })
      envTex?.dispose()
      pmrem.dispose()
      composer.dispose()
      renderer.dispose()
    },
  }
}
