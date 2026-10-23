import { halfRate, isPhone, jewelMaterial, pixelRatio } from '../gl'
import * as THREE from 'three'
import { visibleGate } from '../visible'
import { silkNormals } from '../textures'
import { photoTexture, sliced, studioEnvironment, studioSource, uploadSteps, warmUp } from '../env'
import type { CollectionApi, CollectionPiece } from './collection'
import { reliefGeometry, relieve } from '../relief'

/**
 * THE RING ROOM. A row of velvet ring cones on champagne silk, each holding one ring the way
 * a counter display does: the ring stands upright, its lower band pressed into the slit of a
 * velvet cushion on top of the cone, so only the ring as it is worn shows above the velvet.
 *
 * Each ring is its studio cut-out with the normal and roughness maps made from it, so the
 * metal and stones answer the moving lamp; it casts its true outline onto the cushion. Scroll
 * carries the camera along the row; a lamp travels with it. Hovering (or reaching) a ring
 * lifts it a little out of its slit and turns it to you; clicking opens it.
 *
 * Same contract as the case room (collection.ts), so CollectionScene drives either.
 * Units are centimetres.
 */
const SPACING = 28
const RING = 12 // longest side of a ring's cut-out on its cone, cm
const NECK = 11 // height of the cone up to the pillow, cm
const PILLOW = { w: 14, h: 5, d: 7 } // the velvet ring pillow on top, cm
const SINK = 0.2 // share of the ring's height pressed into the pillow's slit

export function createCones(canvas: HTMLCanvasElement, pieces: CollectionPiece[]): CollectionApi {
  const phone = isPhone()
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  renderer.debug.checkShaderErrors = false
  canvas.style.opacity = '0'
  canvas.style.transition = 'opacity 700ms ease'
  const gate = visibleGate(canvas)
  renderer.setPixelRatio(pixelRatio(1.5, 1))
  const skip = halfRate()
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = 0.8
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.autoUpdate = !phone
  renderer.shadowMap.type = THREE.PCFShadowMap
  let shadowTick = 0

  const scene = new THREE.Scene()
  const sky = new THREE.Color(0.8, 0.64, 0.4)
  scene.background = sky
  scene.fog = new THREE.Fog(sky, 90, 220)
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 600)
  let envTex: THREE.Texture | null = null
  let warmed = false
  let alive = true

  const run = Math.max(1, pieces.length - 1) * SPACING
  const geos: THREE.BufferGeometry[] = []
  const silkNormal = silkNormals()
  let silk: THREE.Mesh | null = null
  const addSilk = () => {
    const g = new THREE.PlaneGeometry(run + 280, 170, 320, 80)
    const sp = g.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < sp.count; i++) {
      const x = sp.getX(i), y = sp.getY(i)
      const z =
        3.2 * Math.sin(x * 0.045 + y * 0.03 + Math.sin(y * 0.02) * 1.8) +
        1.8 * Math.sin(x * 0.11 - y * 0.07 + 1.1) * (0.6 + 0.4 * Math.sin(y * 0.05)) +
        0.45 * Math.sin(x * 0.26 + y * 0.19)
      // Level where the cones stand; the folds rise toward the back.
      const calm = Math.exp(-(y * y) / (2 * 16 * 16))
      sp.setZ(i, z * (1 - 0.8 * calm) + Math.max(0, y - 22) * 0.1)
    }
    g.computeVertexNormals()
    geos.push(g)
    silk = new THREE.Mesh(
      g,
      jewelMaterial({ color: new THREE.Color(0.6, 0.4, 0.19), roughness: 0.3, sheen: 1, sheenRoughness: 0.22, sheenColor: new THREE.Color(1, 0.84, 0.52), clearcoat: 0.25, clearcoatRoughness: 0.3, normalMap: silkNormal, normalScale: new THREE.Vector2(0.55, 0.55) }),
    )
    silk.rotation.x = -Math.PI / 2
    silk.position.x = run / 2
    silk.receiveShadow = true
    scene.add(silk)
  }

  const lamp = new THREE.SpotLight(0xfff1dc, 2100, 190, 0.55, 0.7, 1.6)
  lamp.castShadow = true
  lamp.shadow.mapSize.setScalar(phone ? 1024 : 2048)
  lamp.shadow.bias = -0.0003
  lamp.shadow.normalBias = 0.02
  lamp.shadow.camera.near = 10
  lamp.shadow.camera.far = 150
  scene.add(lamp, lamp.target)
  const fill = new THREE.HemisphereLight(0xfff4e0, 0x8a5a26, 0.22)
  scene.add(fill)
  const rim = new THREE.DirectionalLight(0xffd9a0, 1.6)
  scene.add(rim, rim.target)

  // ── Shared materials and shapes ──
  // Rosewood velvet: deep enough that silver and stones glow against it, warm, never black.
  const velvet = jewelMaterial({ color: new THREE.Color(0.13, 0.026, 0.032), roughness: 1, sheen: 1, sheenRoughness: 0.32, sheenColor: new THREE.Color(1, 0.62, 0.55), envMapIntensity: 0.5 })
  const slitMat = jewelMaterial({ color: new THREE.Color(0.05, 0.01, 0.012), roughness: 1 })
  const gold = jewelMaterial({ color: new THREE.Color(1.0, 0.78, 0.36), metalness: 1, roughness: 0.14, envMapIntensity: 1.6 })
  const plinthMat = jewelMaterial({ color: new THREE.Color(0.95, 0.88, 0.74), roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.2 })

  // The cone: a flared foot narrowing to a slim neck, turned on a lathe.
  const profile: THREE.Vector2[] = []
  for (let k = 0; k <= 24; k++) {
    const t = k / 24
    const y = t * NECK
    const r = 1.5 + 3.6 * Math.pow(1 - t, 1.6)
    profile.push(new THREE.Vector2(r, y))
  }
  profile.unshift(new THREE.Vector2(0, 0))
  profile.push(new THREE.Vector2(0, NECK))
  const coneGeo = new THREE.LatheGeometry(profile, phone ? 40 : 64)
  // The pillow the ring sits in: a soft rounded block, its top puffed up toward the middle
  // with a dark slit along its length where the ring goes in.
  // A superellipsoid: square in plan, soft at every edge, the top gently domed, like a
  // stuffed velvet pillow. Smooth enough to light without facets.
  const pillowGeo = new THREE.SphereGeometry(1, phone ? 64 : 96, phone ? 32 : 48)
  {
    const pp = pillowGeo.attributes.position as THREE.BufferAttribute
    const sq = (v: number, e: number) => Math.sign(v) * Math.pow(Math.abs(v), e)
    for (let k = 0; k < pp.count; k++) {
      const x = pp.getX(k), y = pp.getY(k), z = pp.getZ(k)
      pp.setXYZ(k, sq(x, 0.32) * PILLOW.w / 2, sq(y, 0.55) * PILLOW.h / 2, sq(z, 0.42) * PILLOW.d / 2)
    }
    pillowGeo.computeVertexNormals()
  }
  const slitGeo = new THREE.BoxGeometry(PILLOW.w * 0.7, 0.12, 0.22)
  const collarGeo = new THREE.TorusGeometry(1.62, 0.16, 12, phone ? 40 : 64)
  const plinthGeo = new THREE.CylinderGeometry(6.2, 6.6, 1.3, phone ? 48 : 72)
  const beadGeo = new THREE.TorusGeometry(6.3, 0.12, 8, phone ? 64 : 96)
  // A soft shade where the ring goes into the velvet, so it reads as pressed in, not placed on.
  const shadeCanvas = document.createElement('canvas')
  shadeCanvas.width = shadeCanvas.height = 128
  {
    const g = shadeCanvas.getContext('2d')!
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    grad.addColorStop(0, 'rgba(20,4,4,0.75)')
    grad.addColorStop(0.55, 'rgba(20,4,4,0.32)')
    grad.addColorStop(1, 'rgba(20,4,4,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 128, 128)
  }
  const shadeTex = new THREE.CanvasTexture(shadeCanvas)
  const shadeMat = new THREE.MeshBasicMaterial({ map: shadeTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })
  const shadeGeo = new THREE.PlaneGeometry(1, 1)
  geos.push(shadeGeo, coneGeo, pillowGeo, slitGeo, collarGeo, plinthGeo, beadGeo)

  type Item = { group: THREE.Group; mesh: THREE.Mesh; home: THREE.Vector3; seat: number; lift: number; slug: string; mats: THREE.Material[] }
  const items: Item[] = []
  const addCone = (p: CollectionPiece, i: number) => {
    const aspect = p.width / p.height
    const w = aspect >= 1 ? RING : RING * aspect
    const h = aspect >= 1 ? RING / aspect : RING
    const group = new THREE.Group()
    const home = new THREE.Vector3(i * SPACING, 0, Math.sin(i * 1.3) * 2.5)
    group.position.copy(home)
    scene.add(group)

    const plinth = new THREE.Mesh(plinthGeo, plinthMat)
    plinth.position.y = 0.65
    plinth.castShadow = plinth.receiveShadow = true
    const bead = new THREE.Mesh(beadGeo, gold)
    bead.rotation.x = Math.PI / 2
    bead.position.y = 1.3
    const cone = new THREE.Mesh(coneGeo, velvet)
    cone.position.y = 1.3
    cone.castShadow = cone.receiveShadow = true
    const collar = new THREE.Mesh(collarGeo, gold)
    collar.rotation.x = Math.PI / 2
    collar.position.y = 1.3 + NECK - 0.15
    // The pillow is wider than any ring, so a ring's whole lower band sinks into velvet.
    const pillow = new THREE.Mesh(pillowGeo, velvet)
    pillow.position.y = 1.3 + NECK + PILLOW.h / 2 - 0.4
    pillow.castShadow = pillow.receiveShadow = true
    const top = pillow.position.y + PILLOW.h / 2
    const slitLine = new THREE.Mesh(slitGeo, slitMat)
    slitLine.position.y = top - 0.04
    const shade = new THREE.Mesh(shadeGeo, shadeMat)
    shade.rotation.x = -Math.PI / 2
    shade.scale.set(w * 0.95, 3.2, 1)
    shade.position.y = top + 0.02
    shade.renderOrder = 1
    group.add(plinth, bead, cone, collar, pillow, slitLine, shade)

    const map = photoTexture(renderer, `${p.base}-${phone ? 480 : 960}.webp`)
    map.anisotropy = 8
    const normal = photoTexture(renderer, `${p.base}-normal.webp`, false)
    const dr = photoTexture(renderer, `${p.base}-dr.webp`, false)
    const mat = jewelMaterial({ map, normalMap: normal, normalScale: new THREE.Vector2(0.6, 0.6), roughnessMap: dr, roughness: 1, metalness: 0.12, envMapIntensity: 1.5, clearcoat: 0.8, clearcoatRoughness: 0.08, alphaTest: 0.5 })
    const depth = new THREE.MeshDepthMaterial({ map, alphaTest: 0.5, depthPacking: THREE.RGBADepthPacking })
    // The ring in relief, front and back: a solid you can see turn, not a card.
    const ringGeo = reliefGeometry(w, h)
    // Origin at the bottom edge: the ring is placed by where its band meets the velvet.
    ringGeo.translate(0, h / 2, 0)
    geos.push(ringGeo)
    const mesh = new THREE.Mesh(ringGeo, mat)
    mesh.customDepthMaterial = depth
    mesh.castShadow = true
    mesh.userData.slug = p.slug
    relieve(dr, Math.max(w, h), mat, depth)
    const back = new THREE.Mesh(ringGeo, mat)
    back.rotation.y = Math.PI
    back.customDepthMaterial = depth
    back.castShadow = true
    mesh.add(back)
    // The ring's lower band sits down inside the pillow's slit.
    const seat = top - h * SINK
    mesh.position.y = seat
    group.add(mesh)
    items.push({ group, mesh, home, seat, lift: 0, slug: p.slug, mats: [mat, depth] })
  }

  sliced([addSilk, ...pieces.map((p, i) => () => addCone(p, i))], () => alive)
    .then(() => studioSource())
    .then((tex) =>
      sliced(
        [
          () => {
            envTex = studioEnvironment(renderer, tex)
            scene.environment = envTex
            scene.environmentIntensity = 0.75
          },
          ...uploadSteps(renderer, scene),
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

  let progress = 0
  let smooth = 0
  let raf = 0
  let last = performance.now()
  let hovered: Item | null = null
  const ndc = new THREE.Vector2(9, 9)
  const ray = new THREE.Raycaster()
  const tmp = new THREE.Vector3()
  const look = new THREE.Vector3()
  const nearest = () => {
    let best: Item | null = null
    for (const it of items) if (!best || Math.abs(it.home.x - look.x) < Math.abs(best.home.x - look.x)) best = it
    return best
  }

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame)
    if (!gate.on) {
      last = now
      return
    }
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    smooth += (progress - smooth) * (1 - Math.exp(-dt * 3))
    const portrait = canvas.clientWidth / canvas.clientHeight < 0.8
    const x = smooth * run - (portrait ? 0 : 12)
    // Eye level a little above the rings, the way you look down into a counter.
    camera.position.set(x - (portrait ? 3 : 6), portrait ? 34 : 32, portrait ? 66 : 74)
    look.set(x + (portrait ? 0 : 2), portrait ? 19 : 15, -2)
    camera.lookAt(look)
    lamp.position.set(x - 40 + Math.sin(now * 0.0004) * 3, 46, 30)
    lamp.target.position.set(x + 4, 12, 0)
    rim.position.set(x + 34, 26, -60)
    rim.target.position.set(x, 10, 0)

    ray.setFromCamera(ndc, camera)
    const hit = ray.intersectObjects(items.map((it) => it.mesh), false)[0]
    hovered = hit ? items.find((it) => it.mesh === hit.object) ?? null : null
    const here = nearest()

    for (const it of items) {
      // The ring you reach rises a little out of its slit; a hovered one rises further.
      const target = it === hovered ? 1 : it === here && Math.abs(it.home.x - look.x) < SPACING * 0.5 ? 0.45 : 0
      it.lift += (target - it.lift) * (1 - Math.exp(-dt * 5))
      it.mesh.position.y = it.seat + it.lift * 2.6
      // Turned toward the eye, and turning slowly to and fro so its depth shows (never edge-on).
      const toCam = Math.atan2(camera.position.x - it.group.position.x, camera.position.z - it.group.position.z)
      it.mesh.rotation.y = toCam * (0.85 + 0.15 * it.lift) + Math.sin(now * 0.00045 + it.home.x * 0.07) * 0.42 * (1 - 0.6 * it.lift)
    }
    if (!renderer.shadowMap.autoUpdate) renderer.shadowMap.needsUpdate = shadowTick++ % 3 === 0
    if (warmed && !skip()) renderer.render(scene, camera)
  }

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.fov = w / h < 0.8 ? 44 : 30
    camera.updateProjectionMatrix()
  }
  resize()
  raf = requestAnimationFrame(frame)

  return {
    setProgress: (p) => (progress = p),
    pointer: (x, y) => {
      ndc.set(x * 2 - 1, -(y * 2 - 1))
      return hovered?.slug ?? null
    },
    hoveredScreen: () => {
      // The hovered ring, or else the cone the camera has reached.
      let it = hovered
      if (!it) {
        const best = nearest()
        if (best && Math.abs(best.home.x - look.x) < SPACING * 0.4 && best.lift > 0.3) it = best
      }
      if (!it) return null
      it.mesh.getWorldPosition(tmp).project(camera)
      return { slug: it.slug, x: (tmp.x * 0.5 + 0.5) * canvas.clientWidth, y: (-tmp.y * 0.5 + 0.5) * canvas.clientHeight }
    },
    resize,
    dispose: () => {
      alive = false
      cancelAnimationFrame(raf)
      gate.dispose()
      geos.forEach((g) => g.dispose())
      ;[velvet, slitMat, gold, plinthMat, shadeMat].forEach((m) => m.dispose())
      shadeTex.dispose()
      for (const it of items)
        it.mats.forEach((m) => {
          const mm = m as THREE.MeshPhysicalMaterial
          mm.map?.dispose()
          mm.normalMap?.dispose()
          mm.roughnessMap?.dispose()
          m.dispose()
        })
      silkNormal.dispose()
      ;(silk?.material as THREE.Material | undefined)?.dispose()
      envTex?.dispose()
      renderer.dispose()
    },
  }
}
