import { jewelMaterial } from '../gl'
import * as THREE from 'three'

/**
 * The Platera courier carton: kraft corrugated board printed with the house name, four
 * flaps on hinges (a regular slotted carton: the long flaps meet in the middle), two ivory
 * tissue sheets, a gold P seal for the tissue, house tape for the seam and the ends, and a
 * shipping label. Built open; packing.ts animates it closed. Units are centimetres.
 */
export const CARTON = { W: 52, D: 42, H: 15, T: 0.6 }

export type Carton = {
  group: THREE.Group
  flaps: { front: THREE.Group; back: THREE.Group; left: THREE.Group; right: THREE.Group }
  tissue: { front: THREE.Group; back: THREE.Group }
  sticker: THREE.Mesh
  tapeMat: THREE.MeshPhysicalMaterial
  tabMat: THREE.MeshPhysicalMaterial
  label: THREE.Mesh
  /** Redraw the printed textures once the house fonts have loaded. */
  redraw: () => void
}

const OPEN = 1.95 // rad: how far the flaps fall open, outward
const TISSUE_OPEN = 1.2

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  draw(ctx)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return { tex, redraw: () => (draw(ctx), (tex.needsUpdate = true)) }
}

/** Kraft board: warm brown with long paper fibres and a faint flute shadow. */
function kraft(ctx: CanvasRenderingContext2D, w: number, h: number, base: string, seed: number) {
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)
  let s = seed
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < (w * h) / 220; i++) {
    const x = rnd() * w, y = rnd() * h, l = 4 + rnd() * 18, a = rnd() * Math.PI
    ctx.strokeStyle = rnd() > 0.5 ? 'rgba(90,55,25,0.10)' : 'rgba(255,235,200,0.10)'
    ctx.lineWidth = 0.6 + rnd() * 1.2
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l * 0.25)
    ctx.stroke()
  }
  for (let y = 0; y < h; y += 14) {
    ctx.fillStyle = 'rgba(80,50,20,0.035)'
    ctx.fillRect(0, y, w, 6)
  }
}

export function buildCarton(): Carton {
  const { W, D, H, T } = CARTON
  const family = () => getComputedStyle(document.documentElement).getPropertyValue('--font-gambetta').trim() || 'Georgia, serif'
  const sans = () => getComputedStyle(document.documentElement).getPropertyValue('--font-satoshi').trim() || 'system-ui, sans-serif'

  const plain = canvasTexture(512, 512, (ctx) => kraft(ctx, 512, 512, '#b8875a', 7))
  const inner = canvasTexture(512, 512, (ctx) => kraft(ctx, 512, 512, '#c99c6c', 11))
  // The long sides carry the house name, printed in espresso ink as on real board.
  const printed = canvasTexture(1560, 450, (ctx) => {
    kraft(ctx, 1560, 450, '#b8875a', 3)
    ctx.fillStyle = 'rgba(43,29,14,0.86)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `500 168px ${family()}`
    ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '22px'
    ctx.fillText('PLATERA', 780, 200)
    ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '10px'
    ctx.font = `600 34px ${sans()}`
    ctx.fillText('JEWELLERS  ·  GORAI 1, BORIVALI WEST  ·  925', 780, 318)
    ctx.fillRect(560, 268, 440, 2)
  })
  const kraftMat = (map: THREE.Texture) => jewelMaterial({ map, roughness: 0.92, sheen: 0.25, sheenColor: new THREE.Color(1, 0.9, 0.75) })
  const mPlain = kraftMat(plain.tex)
  const mInner = kraftMat(inner.tex)
  const mPrint = kraftMat(printed.tex)
  const edge = jewelMaterial({ color: new THREE.Color(0.8, 0.64, 0.44), roughness: 0.95 })

  const group = new THREE.Group()
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], x: number, y: number, z: number, parent: THREE.Object3D = group) => {
    const m = new THREE.Mesh(geo, mat)
    m.position.set(x, y, z)
    m.castShadow = m.receiveShadow = true
    parent.add(m)
    return m
  }
  // Box faces are ordered +x, -x, +y, -y, +z, -z.
  add(new THREE.BoxGeometry(W, T, D), [edge, edge, mInner, mPlain, edge, edge], 0, T / 2, 0)
  add(new THREE.BoxGeometry(W, H, T), [edge, edge, edge, edge, mPrint, mInner], 0, H / 2, D / 2 - T / 2)
  add(new THREE.BoxGeometry(W, H, T), [edge, edge, edge, edge, mInner, mPrint], 0, H / 2, -D / 2 + T / 2)
  add(new THREE.BoxGeometry(T, H, D - 2 * T), [mPlain, mInner, edge, edge, edge, edge], W / 2 - T / 2, H / 2, 0)
  add(new THREE.BoxGeometry(T, H, D - 2 * T), [mInner, mPlain, edge, edge, edge, edge], -W / 2 + T / 2, H / 2, 0)

  // Flaps hinge on the top edges. Long flaps sit one board-thickness above the short ones.
  const FL = D / 2
  const longGeo = new THREE.BoxGeometry(W, FL, T).translate(0, FL / 2, 0)
  const shortGeo = new THREE.BoxGeometry(T, FL, D - 2 * T).translate(0, FL / 2, 0)
  const hinge = (x: number, y: number, z: number) => {
    const g = new THREE.Group()
    g.position.set(x, y, z)
    group.add(g)
    return g
  }
  const front = hinge(0, H + T, D / 2 - T / 2)
  add(longGeo, [edge, edge, edge, edge, mPlain, mInner], 0, 0, 0, front)
  front.rotation.x = OPEN
  const back = hinge(0, H + T, -D / 2 + T / 2)
  add(longGeo, [edge, edge, edge, edge, mInner, mPlain], 0, 0, 0, back)
  back.rotation.x = -OPEN
  const right = hinge(W / 2 - T / 2, H, 0)
  add(shortGeo, [mPlain, mInner, edge, edge, edge, edge], 0, 0, 0, right)
  right.rotation.z = -OPEN
  const left = hinge(-W / 2 + T / 2, H, 0)
  add(shortGeo, [mInner, mPlain, edge, edge, edge, edge], 0, 0, 0, left)
  left.rotation.z = OPEN

  // Ivory tissue, softly crinkled, standing open over the long walls.
  const tissueMat = jewelMaterial({ color: new THREE.Color(0.97, 0.94, 0.87), roughness: 0.75, sheen: 0.8, sheenColor: new THREE.Color(1, 1, 1), side: THREE.DoubleSide })
  const sheet = (seed: number) => {
    const g = new THREE.PlaneGeometry(W - 3.2, FL + 3.5, 40, 14)
    const p = g.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i)
      p.setZ(i, Math.sin(x * 0.9 + seed) * 0.08 + Math.sin(y * 1.7 + x * 0.3 + seed * 2) * 0.1)
    }
    g.computeVertexNormals()
    return g.translate(0, (FL + 3.5) / 2, 0)
  }
  const tFront = hinge(0, H - 0.9, D / 2 - T - 0.2)
  add(sheet(1), tissueMat, 0, 0, 0, tFront).castShadow = false
  tFront.rotation.x = TISSUE_OPEN
  const tBack = hinge(0, H - 0.55, -D / 2 + T + 0.2)
  add(sheet(4), tissueMat, 0, 0, 0, tBack).castShadow = false
  tBack.rotation.x = -TISSUE_OPEN

  // The gold P that seals the tissue.
  const seal = canvasTexture(256, 256, (ctx) => {
    const g = ctx.createRadialGradient(100, 90, 10, 128, 128, 128)
    g.addColorStop(0, '#f6dc95')
    g.addColorStop(0.6, '#c99a3e')
    g.addColorStop(1, '#8a6222')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
    ctx.strokeStyle = 'rgba(90,60,20,0.6)'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.arc(128, 128, 104, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = 'rgba(70,45,14,0.85)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `500 150px ${family()}`
    ctx.fillText('P', 128, 140)
  })
  const sticker = add(new THREE.CylinderGeometry(2.6, 2.6, 0.12, 48), [jewelMaterial({ color: 0xc99a3e, metalness: 1, roughness: 0.3 }), jewelMaterial({ map: seal.tex, metalness: 0.85, roughness: 0.28 }), jewelMaterial({ color: 0xc99a3e })], 0, H - 0.2, 1.5)
  sticker.visible = false

  // House tape: espresso, the name repeated in gold.
  const tape = canvasTexture(1024, 96, (ctx) => {
    ctx.fillStyle = '#2b1d0e'
    ctx.fillRect(0, 0, 1024, 96)
    ctx.fillStyle = '#d4a94e'
    ctx.textBaseline = 'middle'
    ctx.font = `600 40px ${family()}`
    ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '8px'
    for (let x = 10; x < 1024; x += 256) ctx.fillText('PLATERA ·', x, 50)
    ctx.fillStyle = 'rgba(241,212,136,0.5)'
    ctx.fillRect(0, 6, 1024, 2)
    ctx.fillRect(0, 88, 1024, 2)
  })
  tape.tex.wrapS = THREE.RepeatWrapping
  const tapeMat = jewelMaterial({ map: tape.tex, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2, clippingPlanes: [new THREE.Plane(new THREE.Vector3(-1, 0, 0), -1e4)] })
  const topY = H + T + T / 2 + 0.06
  const tapeTex = tape.tex.clone()
  tapeTex.repeat.set((W + 0.4) / 26, 1)
  tapeTex.wrapS = THREE.RepeatWrapping
  tapeMat.map = tapeTex
  const tapeGeo = new THREE.BoxGeometry(W + 0.4, 0.1, 6)
  add(tapeGeo, tapeMat, 0, topY, 0)
  const tabMat = tapeMat.clone()
  const tabTex = tape.tex.clone()
  tabTex.repeat.set(8 / 26, 1)
  tabTex.wrapS = THREE.RepeatWrapping
  tabMat.map = tabTex
  tabMat.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 1, 0), -1e4)]
  // Down the ends: the strip turns over the edge and runs 8 cm down each short wall.
  for (const sx of [1, -1]) {
    const tab = add(new THREE.BoxGeometry(0.1, 8, 6), tabMat, sx * (W / 2 + 0.05), topY - 4, 0)
    tab.castShadow = false
  }

  // The shipping label.
  const today = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date())
  const lab = canvasTexture(840, 560, (ctx) => {
    ctx.fillStyle = '#fbf7ee'
    ctx.fillRect(0, 0, 840, 560)
    ctx.strokeStyle = '#2b1d0e'
    ctx.lineWidth = 4
    ctx.strokeRect(18, 18, 804, 524)
    ctx.fillStyle = '#2b1d0e'
    ctx.textBaseline = 'alphabetic'
    ctx.font = `500 64px ${family()}`
    ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '10px'
    ctx.fillText('PLATERA', 48, 106)
    ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '3px'
    ctx.font = `600 22px ${sans()}`
    ctx.fillText('JEWELLERS · GORAI 1, BORIVALI WEST, MUMBAI', 50, 146)
    ctx.fillRect(48, 168, 744, 2)
    ctx.font = `600 26px ${sans()}`
    ctx.fillText('HALLMARKED 925 SILVER', 50, 220)
    ctx.fillText('INSURED · SIGNED FOR', 50, 260)
    ctx.font = `500 24px ${sans()}`
    ctx.fillStyle = 'rgba(43,29,14,0.75)'
    ctx.fillText(`Packed at the counter, ${today}`, 50, 302)
    // A barcode, drawn bar by bar.
    let x = 50
    let s = 97
    ctx.fillStyle = '#2b1d0e'
    while (x < 560) {
      s = (s * 16807) % 2147483647
      const w = 2 + (s % 5)
      ctx.fillRect(x, 340, w, 120)
      x += w + 2 + ((s >> 3) % 4)
    }
    ctx.font = `500 22px ${sans()}`
    ctx.fillText('PLT · 925 · ' + today.replace(/\s/g, ''), 50, 494)
    // Handle with care, in garnet.
    ctx.strokeStyle = '#7e1f2b'
    ctx.lineWidth = 4
    ctx.strokeRect(596, 340, 196, 150)
    ctx.fillStyle = '#7e1f2b'
    ctx.textAlign = 'center'
    ctx.font = `700 28px ${sans()}`
    ctx.fillText('HANDLE', 694, 398)
    ctx.fillText('WITH CARE', 694, 440)
    ctx.textAlign = 'left'
  })
  const label = add(new THREE.PlaneGeometry(16, 10.7), jewelMaterial({ map: lab.tex, roughness: 0.55, polygonOffset: true, polygonOffsetFactor: -2 }), -12, topY + 0.02, 11)
  label.rotation.x = -Math.PI / 2
  label.rotation.z = 0.05
  label.visible = false
  label.castShadow = false

  return {
    group,
    flaps: { front, back, left, right },
    tissue: { front: tFront, back: tBack },
    sticker,
    tapeMat,
    tabMat,
    label,
    redraw: () => {
      printed.redraw()
      seal.redraw()
      tape.redraw()
      tapeTex.needsUpdate = tabTex.needsUpdate = true
      lab.redraw()
    },
  }
}

export const FLAP_OPEN = OPEN
export const TISSUE_OPEN_ANGLE = TISSUE_OPEN
