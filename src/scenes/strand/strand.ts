import * as THREE from 'three'
import { engraving } from './engrave'

/**
 * SCENE 2 · THE STRAND. A necklace of polished 18k beads hangs in a catenary across warm
 * champagne light. It is a real chain: Verlet particles with distance constraints, pinned
 * outside the frame, under gravity, so it sways and settles. The visitor can grab any bead
 * and drag or flick the strand. As the page scrolls the camera glides along the strand, and
 * each promise bead in turn swings forward out of the strand toward the viewer, turning to
 * show the mark engraved on its face.
 *
 * Units are centimetres. Bead Ø 8.4 mm.
 */
export const PROMISES = 6
const N = 45
const R = 0.42
const GAP = 0.05
const SPACING = 2 * R + GAP
const PROMISE_AT = [10, 15, 20, 25, 30, 35]
const MARKS = ['925', 'mg', '₹', '15', '7', '◇']

export type StrandApi = {
  setProgress: (p: number) => void // 0 → PROMISES (continuous)
  pointer: (x: number, y: number, down: boolean | null) => void
  resize: () => void
  dispose: () => void
}

function warmEnvironment(renderer: THREE.WebGLRenderer) {
  // A studio for gold: a warm gradient dome, two long strip softboxes, a large overhead
  // panel and a low amber bounce. Gold is only as good as what it reflects.
  const scene = new THREE.Scene()
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(50, 64, 32),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {},
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `varying vec3 vP;
        void main(){
          float y = normalize(vP).y;
          // A dark warm studio: polished gold needs dark to show its colour.
          vec3 low = vec3(0.05, 0.03, 0.012);
          vec3 mid = vec3(0.16, 0.10, 0.045);
          vec3 high = vec3(0.34, 0.24, 0.13);
          vec3 c = y < 0.0 ? mix(mid, low, -y) : mix(mid, high, pow(y, 0.8));
          gl_FragColor = vec4(c, 1.0);
        }`,
    }),
  )
  scene.add(dome)
  const panel = (w: number, h: number, intensity: number, pos: [number, number, number], color = 0xfff4e2) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }))
    m.position.set(...pos)
    m.lookAt(0, 0, 0)
    scene.add(m)
  }
  // Only long, thin strips: they draw clean lines of light along the beads, never shapes.
  panel(1.2, 40, 9, [-18, 6, 12])
  panel(1.2, 40, 7, [18, 4, 10])
  panel(40, 1.5, 6, [0, 26, 8])
  panel(40, 3, 1.4, [0, -16, 6], 0xd99a45)
  const pmrem = new THREE.PMREMGenerator(renderer)
  const env = pmrem.fromScene(scene, 0.02).texture
  pmrem.dispose()
  scene.traverse((o) => {
    const m = o as THREE.Mesh
    m.geometry?.dispose()
    ;(m.material as THREE.Material | undefined)?.dispose?.()
  })
  return env
}

export function createStrand(canvas: HTMLCanvasElement): StrandApi {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.toneMapping = THREE.AgXToneMapping
  renderer.toneMappingExposure = 1.15
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.VSMShadowMap

  const scene = new THREE.Scene()
  scene.environment = warmEnvironment(renderer)
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200)

  // A backdrop of champagne behind the strand, catching its soft shadow.
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(200, 120), new THREE.ShadowMaterial({ opacity: 0.16, color: 0x5a3a12 }))
  backdrop.position.z = -9
  backdrop.receiveShadow = true
  scene.add(backdrop)

  const key = new THREE.DirectionalLight(0xfff0d6, 1.6)
  key.position.set(-10, 18, 22)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.radius = 14
  key.shadow.blurSamples = 20
  key.shadow.camera.left = -30
  key.shadow.camera.right = 30
  key.shadow.camera.top = 18
  key.shadow.camera.bottom = -18
  scene.add(key)

  const gold = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(1.0, 0.766, 0.336), metalness: 1, roughness: 0.12, clearcoat: 0.25, clearcoatRoughness: 0.08, envMapIntensity: 1.15 })
  const geo = new THREE.SphereGeometry(R, 64, 48)
  const beads: THREE.Mesh[] = []
  const promiseMats = MARKS.map((mark) => {
    const { normal, rough } = engraving(mark)
    const m = gold.clone()
    m.setValues({ normalMap: normal, normalScale: new THREE.Vector2(1.2, 1.2), roughnessMap: rough, roughness: 1 })
    return m
  })
  for (let i = 0; i < N; i++) {
    const k = PROMISE_AT.indexOf(i)
    const m = new THREE.Mesh(geo, k >= 0 ? promiseMats[k] : gold)
    m.castShadow = true
    scene.add(m)
    beads.push(m)
  }

  // ── The chain ──
  const half = ((N - 1) * SPACING) / 2
  const pinL = new THREE.Vector3(-half * 0.82, 7, 0)
  const pinR = new THREE.Vector3(half * 0.82, 7, 0)
  const pos: THREE.Vector3[] = []
  const prev: THREE.Vector3[] = []
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1)
    const x = THREE.MathUtils.lerp(pinL.x, pinR.x, t)
    const y = 7 - Math.sin(t * Math.PI) * 9
    pos.push(new THREE.Vector3(x, y, 0))
    prev.push(new THREE.Vector3(x, y, 0))
  }
  const gravity = new THREE.Vector3(0, -980 * 0.35, 0)
  const tmp = new THREE.Vector3()
  let grabbed = -1
  const grabTarget = new THREE.Vector3()
  let pointerNdc = new THREE.Vector2(0, 0)
  const ray = new THREE.Raycaster()
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
  const hit = new THREE.Vector3()

  const step = (dt: number) => {
    for (let i = 0; i < N; i++) {
      const p = pos[i]
      tmp.copy(p).sub(prev[i]).multiplyScalar(0.985) // air damping
      prev[i].copy(p)
      p.add(tmp).addScaledVector(gravity, dt * dt)
      p.z *= 0.96 // the strand hangs in a plane; depth settles back
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
        const wa = i === 0 ? 0 : 0.5
        const wb = i + 1 === N - 1 ? 0 : 0.5
        a.addScaledVector(tmp, diff * wa * (wa + wb > 0 ? 1 / (wa + wb) : 0) * 1)
        b.addScaledVector(tmp, -diff * wb * (wa + wb > 0 ? 1 / (wa + wb) : 0) * 1)
      }
    }
  }

  let progress = 0
  let smoothProgress = 0
  let raf = 0
  let last = performance.now()
  let acc = 0
  const lookAt = new THREE.Vector3()
  const camPos = new THREE.Vector3()

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame)
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    acc += dt
    const h = 1 / 120
    while (acc >= h) {
      step(h)
      acc -= h
    }
    smoothProgress += (progress - smoothProgress) * (1 - Math.exp(-dt * 4))

    // Camera glides along the strand toward the promise being read.
    const k = Math.min(PROMISES - 1, Math.max(0, Math.round(smoothProgress - 0.5)))
    const focusBead = pos[PROMISE_AT[Math.min(PROMISES - 1, Math.max(0, Math.floor(smoothProgress)))]]
    const portrait = canvas.clientWidth / canvas.clientHeight < 0.8
    lookAt.set(focusBead.x - (portrait ? 0 : 4.2), focusBead.y + (portrait ? -2.4 : 0.3), 0) // bead in the right third; words on the left
    camPos.set(lookAt.x - 1.5, lookAt.y + 2.2, portrait ? 30 : 21)
    camera.position.lerp(camPos, 1 - Math.exp(-dt * 3))
    camera.lookAt(lookAt)
    void k

    // Promise beads: the one being read swings forward and turns to show its mark.
    for (let i = 0; i < N; i++) {
      const m = beads[i]
      m.position.copy(pos[i])
      const pk = PROMISE_AT.indexOf(i)
      if (pk >= 0) {
        const local = smoothProgress - pk // 0..1 while this promise is read
        const w = Math.max(0, Math.sin(Math.min(1, Math.max(0, local)) * Math.PI)) ** 0.7
        const forward = w * 5.5
        m.position.z += forward
        m.position.y += w * 1.4
        m.scale.setScalar(1 + w * 1.25)
        // Face the camera with the engraving (sphere u = 0.5 faces −x; turn it toward +z).
        m.rotation.set(0, -Math.PI / 2 + (1 - w) * 2.6 + Math.sin(now * 0.0006 + pk) * 0.08, 0)
      } else {
        m.scale.setScalar(1)
        m.rotation.y = i * 0.7
      }
    }
    renderer.render(scene, camera)
  }

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.fov = w / h < 0.8 ? 40 : 30
    camera.updateProjectionMatrix()
  }
  resize()
  camera.position.set(0, 2, 21)
  raf = requestAnimationFrame(frame)

  return {
    setProgress: (p) => (progress = p),
    pointer: (x, y, down) => {
      pointerNdc = new THREE.Vector2(x * 2 - 1, -(y * 2 - 1))
      ray.setFromCamera(pointerNdc, camera)
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
      // A light touch: even without grabbing, the pointer brushes the strand aside.
      if (grabbed < 0)
        for (let i = 1; i < N - 1; i++) {
          const d = pos[i].distanceTo(hit)
          if (d < 1.2) pos[i].addScaledVector(tmp.subVectors(pos[i], hit).normalize(), (1.2 - d) * 0.25)
        }
    },
    resize,
    dispose: () => {
      cancelAnimationFrame(raf)
      geo.dispose()
      gold.dispose()
      promiseMats.forEach((m) => {
        m.normalMap?.dispose()
        m.roughnessMap?.dispose()
        m.dispose()
      })
      scene.environment?.dispose()
      renderer.dispose()
    },
  }
}
