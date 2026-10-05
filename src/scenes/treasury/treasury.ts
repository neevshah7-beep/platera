import * as THREE from 'three'
import { visibleGate } from '../visible'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

/**
 * SCENE · THE TREASURY. Three precious things on an espresso velvet tray:
 *   · a gold coin, minted PLATERA, that rolls in on its edge and settles face up the way
 *     a real coin does: spinning down faster and faster as it falls (Euler's disk);
 *     drag it to set it spinning again;
 *   · a round brilliant diamond, real refraction with dispersion, that turns slowly and
 *     throws its fire wherever the visitor's lamp (the pointer) catches it;
 *   · a cast gold bar, stamped 999.9 FINE GOLD, that slides out of the shadow.
 * Scroll brings them in, one after another. Units are centimetres.
 */
export type TreasuryApi = {
  setProgress: (p: number) => void
  pointer: (x: number, y: number, phase: 'move' | 'down' | 'up') => void
  resize: () => void
  dispose: () => void
}

function serif() {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--font-gambetta').trim()
  return v ? `${v}, Georgia, serif` : 'Georgia, serif'
}

/** Height → tangent normal map (Sobel), so lettering reads as struck relief, not print. */
function heightToNormal(src: HTMLCanvasElement, strength: number, invert = false): THREE.CanvasTexture {
  const w = src.width, h = src.height
  const d = src.getContext('2d')!.getImageData(0, 0, w, h).data
  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const g = out.getContext('2d')!
  const img = g.createImageData(w, h)
  const at = (x: number, y: number) => {
    const v = d[(Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))) * 4] / 255
    return invert ? 1 - v : v
  }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1)) * strength
      const dy = (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1)) * strength
      const l = Math.hypot(dx, dy, 1)
      const i = (y * w + x) * 4
      img.data[i] = (-dx / l * 0.5 + 0.5) * 255
      img.data[i + 1] = (dy / l * 0.5 + 0.5) * 255
      img.data[i + 2] = (1 / l * 0.5 + 0.5) * 255
      img.data[i + 3] = 255
    }
  g.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(out)
  t.anisotropy = 8
  return t
}

function coinFace(): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = c.height = 1024
  const g = c.getContext('2d')!
  g.fillStyle = '#000'
  g.fillRect(0, 0, 1024, 1024)
  g.translate(512, 512)
  g.strokeStyle = '#fff'
  g.fillStyle = '#fff'
  // Raised rim and a bead border.
  g.lineWidth = 34
  g.beginPath()
  g.arc(0, 0, 478, 0, Math.PI * 2)
  g.stroke()
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * Math.PI * 2
    g.beginPath()
    g.arc(Math.cos(a) * 425, Math.sin(a) * 425, 8, 0, Math.PI * 2)
    g.fill()
  }
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = `400 150px ${serif()}`
  g.fillText('PLATERA', 0, -20)
  g.font = `400 54px ${serif()}`
  g.fillText('GORAI  ·  MUMBAI', 0, 110)
  g.lineWidth = 6
  g.beginPath()
  g.moveTo(-230, 60)
  g.lineTo(230, 60)
  g.stroke()
  g.font = `400 64px ${serif()}`
  g.fillText('999', 0, -190)
  const blur = document.createElement('canvas')
  blur.width = blur.height = 1024
  const b = blur.getContext('2d')!
  b.filter = 'blur(2.2px)'
  b.drawImage(c, 0, 0)
  return blur
}

function barStamp(): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 512
  const g = c.getContext('2d')!
  g.fillStyle = '#fff'
  g.fillRect(0, 0, 1024, 512)
  g.fillStyle = '#000'
  g.strokeStyle = '#000'
  g.lineWidth = 8
  g.strokeRect(70, 60, 884, 392)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = `400 120px ${serif()}`
  g.fillText('PLATERA', 512, 175)
  g.font = `400 64px ${serif()}`
  g.fillText('FINE GOLD  999.9', 512, 300)
  g.font = `400 40px ${serif()}`
  g.fillText('10 g', 512, 385)
  const blur = document.createElement('canvas')
  blur.width = 1024
  blur.height = 512
  const b = blur.getContext('2d')!
  b.filter = 'blur(1.6px)'
  b.drawImage(c, 0, 0)
  return blur
}

/** Round brilliant by its real proportions, as a convex hull (flat facets). */
function brilliant(r: number): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = []
  const table = r * 0.57
  const crown = (r - table) * Math.tan((34.5 * Math.PI) / 180)
  const pav = r * Math.tan((40.75 * Math.PI) / 180)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    pts.push(new THREE.Vector3(Math.cos(a) * table, crown, Math.sin(a) * table))
    const b = a + Math.PI / 8
    pts.push(new THREE.Vector3(Math.cos(b) * (table + r) * 0.52, crown * 0.5, Math.sin(b) * (table + r) * 0.52))
    pts.push(new THREE.Vector3(Math.cos(b) * r * 0.42, -pav * 0.58, Math.sin(b) * r * 0.42))
  }
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2
    pts.push(new THREE.Vector3(Math.cos(a) * r, r * 0.02, Math.sin(a) * r))
    pts.push(new THREE.Vector3(Math.cos(a) * r, -r * 0.02, Math.sin(a) * r))
  }
  pts.push(new THREE.Vector3(0, -pav, 0))
  // A convex hull by brute force on so few points: gift-wrap every triangle with all points on one side.
  const tris: number[] = []
  const n = pts.length
  const ab = new THREE.Vector3(), ac = new THREE.Vector3(), nrm = new THREE.Vector3(), ap = new THREE.Vector3()
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      for (let k = j + 1; k < n; k++) {
        ab.subVectors(pts[j], pts[i])
        ac.subVectors(pts[k], pts[i])
        nrm.crossVectors(ab, ac)
        if (nrm.lengthSq() < 1e-10) continue
        let pos = 0, neg = 0
        for (let m = 0; m < n; m++) {
          if (m === i || m === j || m === k) continue
          const s = nrm.dot(ap.subVectors(pts[m], pts[i]))
          if (s > 1e-7) pos++
          else if (s < -1e-7) neg++
          if (pos && neg) break
        }
        if (pos && neg) continue
        if (pos) tris.push(i, k, j)
        else tris.push(i, j, k)
      }
  const pos = new Float32Array(tris.length * 3)
  tris.forEach((t, q) => pos.set([pts[t].x, pts[t].y, pts[t].z], q * 3))
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.computeVertexNormals() // non-indexed: each facet keeps its own flat normal
  return g
}

export function createTreasury(canvas: HTMLCanvasElement): TreasuryApi {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  const gate = visibleGate(canvas)
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = 0.82
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  const bg = new THREE.Color(0.91, 0.83, 0.65)
  scene.background = bg
  scene.fog = new THREE.Fog(bg, 140, 300)
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 500)
  const pmrem = new THREE.PMREMGenerator(renderer)
  let envTex: THREE.Texture | null = null
  new EXRLoader().load('/env/studio.exr', (tex) => {
    tex.mapping = THREE.EquirectangularReflectionMapping
    envTex = pmrem.fromEquirectangular(tex).texture
    tex.dispose()
    scene.environment = envTex
  })

  const desk = new THREE.Mesh(new THREE.PlaneGeometry(800, 500), new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.86, 0.68, 0.4), roughness: 0.55, sheen: 0.7, sheenColor: new THREE.Color(1, 0.9, 0.7) }))
  desk.rotation.x = -Math.PI / 2
  desk.receiveShadow = true
  scene.add(desk)

  // The tray: espresso velvet in a gold-rimmed leather frame.
  const velvet = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.06, 0.03, 0.015), roughness: 0.95, sheen: 1, sheenRoughness: 0.5, sheenColor: new THREE.Color(0.32, 0.2, 0.11), envMapIntensity: 0.25 })
  const leather = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.2, 0.11, 0.05), roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.3 })
  const gold = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(1.0, 0.766, 0.336), metalness: 1, roughness: 0.13 })
  const frame = new THREE.Mesh(new RoundedBoxGeometry(70, 2.4, 40, 4, 1.1), leather)
  frame.position.y = 1.2
  frame.castShadow = frame.receiveShadow = true
  scene.add(frame)
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(66, 36), velvet)
  bed.rotation.x = -Math.PI / 2
  bed.position.y = 2.42
  bed.receiveShadow = true
  scene.add(bed)
  const rimGeoX = new THREE.BoxGeometry(66.4, 0.2, 0.2)
  const rimGeoZ = new THREE.BoxGeometry(0.2, 0.2, 36.4)
  for (const z of [-18.1, 18.1]) {
    const r = new THREE.Mesh(rimGeoX, gold)
    r.position.set(0, 2.45, z)
    scene.add(r)
  }
  for (const x of [-33.1, 33.1]) {
    const r = new THREE.Mesh(rimGeoZ, gold)
    r.position.set(x, 2.45, 0)
    scene.add(r)
  }
  const TOP = 2.45

  // ── Coin: Ø 8 cm, 0.7 cm thick, reeded edge ──
  const faceSrc = coinFace()
  const faceNormal = heightToNormal(faceSrc, 3.2)
  const coinFaceMat = gold.clone()
  coinFaceMat.normalMap = faceNormal
  coinFaceMat.normalScale.set(1.2, 1.2)
  const reedCanvas = document.createElement('canvas')
  reedCanvas.width = 2048
  reedCanvas.height = 16
  {
    const g = reedCanvas.getContext('2d')!
    for (let x = 0; x < 2048; x++) {
      const v = Math.round(128 + 127 * Math.sin((x / 2048) * Math.PI * 2 * 180))
      g.fillStyle = `rgb(${v},${v},${v})`
      g.fillRect(x, 0, 1, 16)
    }
  }
  const coinEdgeMat = gold.clone()
  coinEdgeMat.normalMap = heightToNormal(reedCanvas, 2.5)
  const coinGeo = new THREE.CylinderGeometry(5, 5, 0.8, 128, 1)
  const coin = new THREE.Mesh(coinGeo, [coinEdgeMat, coinFaceMat, coinFaceMat])
  coin.castShadow = true
  const coinPivot = new THREE.Group() // rolls/spins; the coin sits inside
  coinPivot.add(coin)
  scene.add(coinPivot)
  const COIN_HOME = new THREE.Vector3(-18, 0, 4)

  // ── Diamond: Ø 6 cm, real refraction with dispersion ──
  const diamondMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0,
    transmission: 1,
    thickness: 3,
    ior: 2.417,
    dispersion: 6,
    envMapIntensity: 2.6,
    specularIntensity: 1,
    attenuationColor: new THREE.Color(1, 1, 1),
    flatShading: true,
  })
  const diamond = new THREE.Mesh(brilliant(3), diamondMat)
  diamond.castShadow = true
  scene.add(diamond)
  const DIA_HOME = new THREE.Vector3(2, TOP + 3.4, -6)

  // ── Bar: 18 × 8 × 2.2 cm, trapezoid cast bar, stamped ──
  const barShape = new THREE.Shape()
  barShape.moveTo(-9, 0)
  barShape.lineTo(9, 0)
  barShape.lineTo(8.2, 2.2)
  barShape.lineTo(-8.2, 2.2)
  barShape.closePath()
  const barGeo = new THREE.ExtrudeGeometry(barShape, { depth: 8, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.25, bevelSegments: 4, steps: 1 })
  barGeo.translate(0, 0, -4)
  const barMat = gold.clone()
  barMat.roughness = 0.2
  const bar = new THREE.Mesh(barGeo, barMat)
  bar.castShadow = true
  scene.add(bar)
  const stampNormal = heightToNormal(barStamp(), 3, true)
  const stamp = new THREE.Mesh(new THREE.PlaneGeometry(15, 6.6), Object.assign(gold.clone(), { normalMap: stampNormal, roughness: 0.28 }))
  stamp.rotation.x = -Math.PI / 2
  stamp.position.y = 2.46
  bar.add(stamp)
  const BAR_HOME = new THREE.Vector3(19, TOP, 3)
  bar.rotation.y = -0.18

  // Lights: a warm key; the visitor's lamp (pointer) a small hot spot that makes the stone fire.
  const key = new THREE.DirectionalLight(0xfff0d8, 1.8)
  key.position.set(-50, 90, 60)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  Object.assign(key.shadow.camera, { left: -50, right: 50, top: 40, bottom: -40 })
  scene.add(key)
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x6a4420, 0.12))
  const lamp = new THREE.PointLight(0xfff6e8, 140, 30, 2)
  lamp.position.set(0, 26, 20)
  scene.add(lamp)

  const composer = new EffectComposer(renderer)
  composer.setPixelRatio(1)
  composer.addPass(new RenderPass(scene, camera))
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(512, 512), 0.12, 0.25, 1.4))
  composer.addPass(new OutputPass())

  // ── Motion ──
  let progress = 0
  let smooth = 0
  // Coin: tilt θ from vertical (0 = on edge, π/2 = flat), its precession φ, its spin ψ.
  let theta = 0.05
  let thetaV = 0
  let phi = 0
  let spinBoost = 0
  const ndc = new THREE.Vector2()
  const ray = new THREE.Raycaster()
  const lampTarget = new THREE.Vector3(0, 26, 20)
  let dragging = false
  let lastX = 0
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
    smooth += (progress - smooth) * (1 - Math.exp(-dt * 3.5))
    const t = now / 1000

    // Entrances, staggered along the scroll.
    const e = (a: number, b: number) => THREE.MathUtils.smoothstep(smooth, a, b)
    const eCoin = e(0.05, 0.35)
    const eDia = e(0.25, 0.55)
    const eBar = e(0.45, 0.75)

    // The coin rolls in on its edge from the left, then (once arrived) begins to fall.
    const rollX = THREE.MathUtils.lerp(-70, COIN_HOME.x, eCoin)
    if (eCoin < 1 && spinBoost <= 0) {
      theta = 0.05
      thetaV = 0
    } else {
      // Euler's disk, simplified: gravity tips it over; as it does, the precession speeds up.
      thetaV += (Math.sin(theta) * 9 - thetaV * 1.6) * dt
      theta = Math.min(Math.PI / 2 - 0.004, theta + thetaV * dt * 0.35)
      if (spinBoost > 0) {
        theta = Math.max(0.05, theta - spinBoost * dt * 2)
        spinBoost = Math.max(0, spinBoost - dt * 2)
      }
    }
    const precess = 2.5 / Math.max(0.15, Math.cos(theta)) // spins faster as it falls flat
    phi += precess * dt * (theta > 0.06 || spinBoost > 0 ? 1 : 0)
    const r = 5
    coinPivot.position.set(rollX, TOP + Math.cos(theta) * r + Math.sin(theta) * 0.35, COIN_HOME.z)
    coinPivot.rotation.set(0, phi, 0)
    // The coin's own axis: lying flat when θ = π/2, standing on edge at θ = 0.
    coin.rotation.set(Math.PI / 2 - theta, 0, eCoin < 1 ? -(rollX - COIN_HOME.x) / r : 0)

    // The diamond descends, turning; its fire answers the lamp.
    diamond.position.set(DIA_HOME.x, THREE.MathUtils.lerp(DIA_HOME.y + 40, DIA_HOME.y, eDia), DIA_HOME.z)
    diamond.rotation.set(0.42, t * 0.35, 0.12)
    diamond.visible = eDia > 0.001

    // The bar slides out of the shadow.
    bar.position.set(BAR_HOME.x, BAR_HOME.y, THREE.MathUtils.lerp(-60, BAR_HOME.z, eBar))
    bar.visible = eBar > 0.001

    lamp.position.lerp(lampTarget, 1 - Math.exp(-dt * 6))
    composer.render(dt)
  }

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight
    renderer.setSize(w, h, false)
    composer.setSize(w, h)
    camera.aspect = w / h
    const portrait = w / h < 0.8
    camera.fov = portrait ? 46 : 30
    camera.position.set(portrait ? 0 : -16, portrait ? 120 : 74, portrait ? 92 : 92)
    camera.lookAt(portrait ? 0 : -16, 0, portrait ? -4 : -2)
    camera.updateProjectionMatrix()
  }
  resize()
  raf = requestAnimationFrame(frameFn)

  return {
    setProgress: (p) => (progress = p),
    pointer: (x, y, phase) => {
      ndc.set(x * 2 - 1, -(y * 2 - 1))
      ray.setFromCamera(ndc, camera)
      const hit = new THREE.Vector3()
      if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -12), hit)) lampTarget.copy(hit)
      if (phase === 'down') {
        const hits = ray.intersectObject(coin, false)
        if (hits.length) {
          dragging = true
          lastX = x
        }
      } else if (phase === 'move' && dragging) {
        // A flick across the coin sets it spinning up onto its edge again.
        spinBoost = Math.min(1.4, spinBoost + Math.abs(x - lastX) * 6)
        lastX = x
      } else if (phase === 'up') dragging = false
    },
    resize,
    dispose: () => {
      cancelAnimationFrame(raf)
      gate.dispose()
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose()
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : []
        mats.forEach((mm) => {
          const p = mm as THREE.MeshPhysicalMaterial
          p.normalMap?.dispose()
          mm.dispose()
        })
      })
      envTex?.dispose()
      pmrem.dispose()
      composer.dispose()
      renderer.dispose()
    },
  }
}
