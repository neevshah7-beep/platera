import { isPhone, jewelMaterial, pixelRatio } from '../gl'
import * as THREE from 'three'
import { visibleGate } from '../visible'
import { leatherNormals, silkNormals } from '../textures'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { photoTexture, sliced, studioEnvironment, studioSource, uploadSteps, warmUp } from '../env'

/**
 * SCENE 4 · THE COLLECTION. Real Platera pieces laid along a run of champagne silk. Each is
 * its own photograph, cut out, with the normal, depth and roughness maps generated from it
 * (src/pipeline/make-maps.py), so under a moving light the metal and stones answer like the
 * real thing. Each piece also casts a shadow in its true outline (chain links and all) onto
 * the silk. Scroll carries the camera sideways along the silk; a lamp travels with it so
 * the pieces ignite in turn. Hovering a piece lifts it off the silk toward the viewer
 * (its shadow separating beneath it); clicking opens it.
 *
 * Units are centimetres.
 */
export type CollectionPiece = { slug: string; name: string; price: string; base: string; width: number; height: number; originals?: string[]; productId?: string }

export type CollectionApi = {
  setProgress: (p: number) => void // 0 → 1 along the run
  pointer: (x: number, y: number) => string | null // returns hovered slug
  hoveredScreen: () => { slug: string; x: number; y: number } | null
  resize: () => void
  dispose: () => void
}

const SPACING = 34
const PIECE = 17 // longest side of a piece in its case, cm (shown about twice life size)
const WALL = 2.2 // case wall and margin around the piece, cm
const DEPTH = 3.2 // case base height, cm

export function createCollection(canvas: HTMLCanvasElement, pieces: CollectionPiece[]): CollectionApi {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  // Shader logs are not read back after each compile: reading them forces the compile to
  // finish on the spot, which turns background compilation into a stall.
  renderer.debug.checkShaderErrors = false
  // Hidden until every shader is ready, then faded in: never a freeze, never a flash.
  canvas.style.opacity = '0'
  canvas.style.transition = 'opacity 700ms ease'
  const gate = visibleGate(canvas)
  renderer.setPixelRatio(pixelRatio(1.5, 1))
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = 0.78
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  // Phones keep the cases' shadows on the silk but refresh them every third frame.
  renderer.shadowMap.autoUpdate = !isPhone()
  let shadowTick = 0
  // PCF soft shadows: VSM smears the thin outlines of cut-out jewellery into blocks.
  renderer.shadowMap.type = THREE.PCFShadowMap

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0.8, 0.64, 0.4)
  scene.fog = new THREE.Fog(new THREE.Color(0.8, 0.64, 0.4), 80, 200)
  const camera = new THREE.PerspectiveCamera(32, 1, 1, 600)
  const pmrem = new THREE.PMREMGenerator(renderer)
  let envTex: THREE.Texture | null = null
  let warmed = false
  let alive = true

  const run = (pieces.length - 1) * SPACING
  const silkNormal = silkNormals()
  let silk: THREE.Mesh | null = null
  const addSilk = () => {
  // The silk has real folds: displaced geometry for the long soft swells (so light rakes
  // across them), plus the woven normal map for the fine sheen.
    const silkGeo = new THREE.PlaneGeometry(run + 260, 160, 360, 90)
  const sp = silkGeo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < sp.count; i++) {
    const x = sp.getX(i), y = sp.getY(i)
    const z =
      3.6 * Math.sin(x * 0.045 + y * 0.03 + Math.sin(y * 0.02) * 1.8) +
      2.0 * Math.sin(x * 0.11 - y * 0.07 + 1.1) * (0.6 + 0.4 * Math.sin(y * 0.05)) +
      0.5 * Math.sin(x * 0.26 + y * 0.19)
    // Calm under the pieces' line so they rest level; folds rise toward the back.
    const calm = Math.exp(-(y * y) / (2 * 14 * 14))
    sp.setZ(i, z * (1 - 0.5 * calm) + Math.max(0, y - 20) * 0.08)
  }
  silkGeo.computeVertexNormals()
    silk = new THREE.Mesh(
    silkGeo,
    jewelMaterial({
      color: new THREE.Color(0.6, 0.4, 0.19),
      roughness: 0.3,
      sheen: 1,
      sheenRoughness: 0.22,
      sheenColor: new THREE.Color(1, 0.84, 0.52),
      clearcoat: 0.25,
      clearcoatRoughness: 0.3,
      normalMap: silkNormal,
      normalScale: new THREE.Vector2(0.55, 0.55),
    }),
  )
  silk.rotation.x = -Math.PI / 2
  silk.position.x = run / 2
  silk.receiveShadow = true
  scene.add(silk)
  }

  const lamp = new THREE.SpotLight(0xfff1dc, 1900, 180, 0.6, 0.75, 1.6)
  lamp.castShadow = true
  lamp.shadow.mapSize.setScalar(isPhone() ? 1024 : 2048)
  lamp.shadow.bias = -0.00025
  lamp.shadow.normalBias = 0.02
  lamp.shadow.camera.near = 10
  lamp.shadow.camera.far = 140
  scene.add(lamp, lamp.target)
  const fill = new THREE.HemisphereLight(0xfff4e0, 0x8a5a26, 0.18)
  scene.add(fill)
  const rim = new THREE.DirectionalLight(0xffd9a0, 1.4)
  rim.position.set(30, 18, -60)
  scene.add(rim, rim.target)


  // ── The case materials, shared ──
  // Champagne leatherette outside, a fine gold trim, espresso velvet inside (silver and
  // stones glow against dark velvet), and a cream satin lid lining foiled with the name.
  const shell = jewelMaterial({ color: new THREE.Color(0.95, 0.88, 0.74), roughness: 0.42, normalMap: leatherNormals(), normalScale: new THREE.Vector2(0.28, 0.28), sheen: 0.5, sheenRoughness: 0.4, sheenColor: new THREE.Color(1, 0.95, 0.85), clearcoat: 1, clearcoatRoughness: 0.07, envMapIntensity: 1.3 })
  const velvet = jewelMaterial({ color: new THREE.Color(0.12, 0.065, 0.035), roughness: 0.95, sheen: 1, sheenRoughness: 0.45, sheenColor: new THREE.Color(0.55, 0.36, 0.22) })
  const trim = jewelMaterial({ color: new THREE.Color(1.0, 0.78, 0.36), metalness: 1, roughness: 0.12, envMapIntensity: 1.6 })
  const liningCanvas = document.createElement('canvas')
  liningCanvas.width = 1024
  liningCanvas.height = 640
  {
    const g = liningCanvas.getContext('2d')!
    const grad = g.createLinearGradient(0, 0, 1024, 640)
    grad.addColorStop(0, '#f7efe0')
    grad.addColorStop(0.5, '#efe2c8')
    grad.addColorStop(1, '#f7efe0')
    g.fillStyle = grad
    g.fillRect(0, 0, 1024, 640)
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillStyle = '#b98a3e'
    g.font = '400 88px Gambetta, Georgia, serif'
    g.fillText('P L A T E R A', 512, 320)
    g.font = '400 26px Gambetta, Georgia, serif'
    g.fillText('GORAI 1  ·  BORIVALI WEST', 512, 400)
  }
  const liningTex = new THREE.CanvasTexture(liningCanvas)
  liningTex.colorSpace = THREE.SRGBColorSpace
  const lining = jewelMaterial({ map: liningTex, roughness: 0.35, sheen: 1, sheenColor: new THREE.Color(1, 0.96, 0.88) })
  const geos: THREE.BufferGeometry[] = []

  type Item = { group: THREE.Group; mesh: THREE.Mesh; lid: THREE.Group; open: number; openV: number; lift: number; home: THREE.Vector3; slug: string; mats: THREE.Material[] }
  const items: Item[] = []
  const addCase = (p: CollectionPiece, i: number) => {
    const aspect = p.width / p.height
    const w = aspect >= 1 ? PIECE : PIECE * aspect
    const h = aspect >= 1 ? PIECE / aspect : PIECE
    const cw = w + WALL * 2
    const cd = h + WALL * 2
    const group = new THREE.Group()
    const home = new THREE.Vector3(i * SPACING, 0.2, Math.sin(i * 1.3) * 3)
    group.position.copy(home)
    group.rotation.y = Math.sin(i * 2.17) * 0.12
    scene.add(group)

    // Base: a rounded shell with the velvet bed inset, domed like a cushion.
    const baseGeo = new RoundedBoxGeometry(cw, DEPTH, cd, 4, 0.9)
    geos.push(baseGeo)
    const base = new THREE.Mesh(baseGeo, shell)
    base.position.y = DEPTH / 2
    base.castShadow = true
    base.receiveShadow = true
    group.add(base)
    const bedGeo = new THREE.PlaneGeometry(cw - 1.4, cd - 1.4, 40, 40)
    const bp = bedGeo.attributes.position as THREE.BufferAttribute
    for (let k = 0; k < bp.count; k++) {
      const u = bp.getX(k) / ((cw - 1.4) / 2)
      const v = bp.getY(k) / ((cd - 1.4) / 2)
      bp.setZ(k, 0.55 * (1 - u * u) * (1 - v * v))
    }
    bedGeo.computeVertexNormals()
    geos.push(bedGeo)
    const bed = new THREE.Mesh(bedGeo, velvet)
    bed.rotation.x = -Math.PI / 2
    bed.position.y = DEPTH + 0.02
    bed.receiveShadow = true
    group.add(bed)
    // Gold trim around the opening.
    const trimX = new THREE.BoxGeometry(cw - 0.9, 0.08, 0.08)
    const trimZ = new THREE.BoxGeometry(0.08, 0.08, cd - 0.9)
    geos.push(trimX, trimZ)
    for (const z of [-1, 1]) {
      const t = new THREE.Mesh(trimX, trim)
      t.position.set(0, DEPTH + 0.06, (z * (cd - 0.9)) / 2)
      group.add(t)
    }
    for (const x of [-1, 1]) {
      const t = new THREE.Mesh(trimZ, trim)
      t.position.set((x * (cw - 0.9)) / 2, DEPTH + 0.06, 0)
      group.add(t)
    }

    // Lid: hinged along the back edge, lined in satin with the foiled name.
    const lid = new THREE.Group()
    lid.position.set(0, DEPTH, -cd / 2)
    group.add(lid)
    const lidGeo = new RoundedBoxGeometry(cw, 1.8, cd, 4, 0.8)
    geos.push(lidGeo)
    const lidShell = new THREE.Mesh(lidGeo, shell)
    lidShell.position.set(0, 0.9, cd / 2)
    lidShell.castShadow = true
    lid.add(lidShell)
    const liningGeo = new THREE.PlaneGeometry(cw - 1.4, cd - 1.4)
    geos.push(liningGeo)
    const lin = new THREE.Mesh(liningGeo, lining)
    lin.rotation.x = Math.PI / 2
    lin.position.set(0, -0.01, cd / 2)
    lid.add(lin)

    // The piece, resting on the velvet.
    // Decoded off the main thread and uploaded in idle moments (see env.ts).
    // 960 wide: still twice the pixels the piece covers on screen, at a third of the upload.
    const map = photoTexture(renderer, `${p.base}-${isPhone() ? 480 : 960}.webp`)
    map.anisotropy = 8
    const normal = photoTexture(renderer, `${p.base}-normal.webp`, false)
    const dr = photoTexture(renderer, `${p.base}-dr.webp`, false)
    const mat = jewelMaterial({
      map,
      normalMap: normal,
      normalScale: new THREE.Vector2(1.1, 1.1),
      roughnessMap: dr,
      roughness: 1,
      metalness: 0.35,
      envMapIntensity: 2.0,
      clearcoat: 0.8,
      clearcoatRoughness: 0.08,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
    })
    const depth = new THREE.MeshDepthMaterial({ map, alphaTest: 0.5, depthPacking: THREE.RGBADepthPacking })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)
    mesh.customDepthMaterial = depth
    mesh.castShadow = true
    mesh.rotation.x = -Math.PI / 2
    mesh.position.y = DEPTH + 0.7
    mesh.userData.slug = p.slug
    group.add(mesh)
    items.push({ group, mesh, lid, open: 0, openV: 0, lift: 0, home, slug: p.slug, mats: [mat, depth] })
  }

  // Put together a slice at a time across frames (the silk, then a case per slice), then the
  // light, then the shaders warmed; only then is it shown.
  sliced([addSilk, ...pieces.map((p, i) => () => addCase(p, i))], () => alive)
    .then(() => studioSource())
    .then((tex) =>
      sliced(
        [
          () => {
            envTex = studioEnvironment(renderer, tex)
            scene.environment = envTex
            scene.environmentIntensity = 0.7
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

  // Rendered straight to the screen: no post-processing pass, so the scene costs one draw
  // and its first frame compiles only what it shows.
  const focusAt = new THREE.Vector3()

  let progress = 0
  let smooth = 0
  let raf = 0
  let last = performance.now()
  let hovered: Item | null = null
  const ndc = new THREE.Vector2(9, 9)
  const ray = new THREE.Raycaster()
  const tmp = new THREE.Vector3()
  const look = new THREE.Vector3()

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame)
    if (!gate.on) {
      last = now
      return
    }
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    smooth += (progress - smooth) * (1 - Math.exp(-dt * 3))
    const x = smooth * run - (canvas.clientWidth / canvas.clientHeight < 0.8 ? 0 : 14)
    const portrait = canvas.clientWidth / canvas.clientHeight < 0.8
    camera.position.set(x - 8, portrait ? 74 : 44, portrait ? 62 : 52)
    look.set(x + 2, 2, -4)
    camera.lookAt(look)
    // The lamp travels just ahead of the camera, so each piece ignites as you reach it.
    // A low raking lamp from the left: long soft shadows and light across every fold.
    lamp.position.set(x - 46 + Math.sin(now * 0.0004) * 3, 34, 18)
    lamp.target.position.set(x + 4, 0, 0)
    rim.position.set(x + 30, 18, -60)
    rim.target.position.set(x, 0, 0)

    ray.setFromCamera(ndc, camera)
    const hits = ray.intersectObjects(items.map((it) => it.mesh), false)
    const h = hits.find((hit) => {
      // Only count the opaque part of the cut-out, not its empty corners.
      const uv = hit.uv
      return uv ? true : false
    })
    hovered = h ? items.find((it) => it.mesh === h.object) ?? null : null

    for (const it of items) {
      // Each case opens as the camera reaches it: a soft spring with a little overshoot,
      // the way a good hinge settles.
      const near = Math.abs(it.home.x - look.x) < SPACING * 0.95 ? 1 : 0
      it.openV += (-70 * (it.open - near) - 11 * it.openV) * dt
      it.open += it.openV * dt
      it.lid.rotation.x = -it.open * 1.95
      const target = it === hovered ? 1 : 0
      it.lift += (target - it.lift) * (1 - Math.exp(-dt * 6))
      // Lifted, the piece rises from the velvet and tips toward you, as a hand raises it.
      it.mesh.position.set(0, DEPTH + 0.7 + it.lift * 6, it.lift * 2)
      it.mesh.rotation.x = -Math.PI / 2 + it.lift * 0.6
    }
    // Focus on whichever piece sits nearest the look point.
    // (While the cases are still being put together there may be none yet.)
    let best: Item | undefined = items[0]
    for (const it of items) if (best && Math.abs(it.home.x - look.x) < Math.abs(best.home.x - look.x)) best = it
    const focus = hovered ?? best
    if (focus) focusAt.copy(focus.group.position)
    if (!renderer.shadowMap.autoUpdate) renderer.shadowMap.needsUpdate = shadowTick++ % 3 === 0
    if (warmed) renderer.render(scene, camera)
  }

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.fov = w / h < 0.8 ? 46 : 32
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
      // The hovered piece, or else the case the camera is standing at.
      let it = hovered
      if (!it) {
        let best: Item | null = null
        for (const x of items) if (!best || Math.abs(x.home.x - look.x) < Math.abs(best.home.x - look.x)) best = x
        if (best && best.open > 0.85) it = best
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
      shell.normalMap?.dispose()
      ;[shell, velvet, trim, lining].forEach((m) => m.dispose())
      liningTex.dispose()
      for (const it of items) {
        it.mesh.geometry.dispose()
        it.mats.forEach((m) => {
          const mm = m as THREE.MeshPhysicalMaterial
          mm.map?.dispose()
          mm.normalMap?.dispose()
          mm.roughnessMap?.dispose()
          m.dispose()
        })
      }
      silkNormal.dispose()
      silk?.geometry.dispose()
      ;(silk?.material as THREE.Material | undefined)?.dispose()
      envTex?.dispose()
      pmrem.dispose()
      renderer.dispose()
    },
  }
}
