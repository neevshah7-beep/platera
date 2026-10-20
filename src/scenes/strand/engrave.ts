import * as THREE from 'three'
import { isPhone } from '../gl'

/**
 * Engravings for the promise beads. A mark (numerals or a symbol) is drawn into a canvas
 * as a height field (white = raised rim, dark = cut), softened, and converted to a tangent-
 * space normal map with a Sobel filter, so the mark reads as metal cut into the bead, lit
 * by the scene, not as a decal printed on it. The roughness map makes the cut satin and the
 * surface polished, which is how a hand-engraved mark actually catches light.
 */
const cache = new Map<string, ReturnType<typeof build>>()
/** Cached: the six promise marks are drawn once per visit, however often the scene is built. */
export function engraving(mark: string, size = 512) {
  const k = `${mark}:${size}`
  if (!cache.has(k)) cache.set(k, isPhone() && BAKED[mark] ? baked(mark) : build(mark, size))
  return cache.get(k)!
}

/**
 * Phones load the marks already engraved (public/media/tex/engrave-<name>.png, made by
 * scripts/bake-engravings.mjs at 256 px): the normal, roughness and colour maps side by
 * side in one opaque image. Building them here took a phone about a second of JavaScript at
 * the first scroll. The textures start as a plain polished face and fill in once decoded.
 */
const BAKED: Record<string, string> = { '925': '925', mg: 'mg', '₹': 'rupee', '15': '15', '7': '7', '◇': 'diamond' }
function baked(mark: string): ReturnType<typeof build> {
  const flat = (r: number, g: number, b: number) => {
    const c = document.createElement('canvas')
    c.width = c.height = 1
    const x = c.getContext('2d')!
    x.fillStyle = `rgb(${r},${g},${b})`
    x.fillRect(0, 0, 1, 1)
    return c
  }
  const normal = new THREE.Texture(flat(128, 128, 255))
  const rough = new THREE.Texture(flat(26, 26, 26))
  const color = new THREE.Texture(flat(255, 255, 255))
  color.colorSpace = THREE.SRGBColorSpace
  for (const t of [normal, rough, color]) {
    t.wrapS = THREE.RepeatWrapping
    t.anisotropy = 4
    t.needsUpdate = true
  }
  fetch(`/media/tex/engrave-${BAKED[mark]}.png`)
    .then((r) => (r.ok ? r.blob() : Promise.reject(new Error('no baked engraving'))))
    .then(async (blob) => {
      const probe = await createImageBitmap(blob)
      const w = probe.width / 3
      const h = probe.height
      probe.close()
      // Decoded off the main thread, one tile per map, flipped as a canvas texture would be.
      const opts: ImageBitmapOptions = { imageOrientation: 'flipY', premultiplyAlpha: 'none', colorSpaceConversion: 'none' }
      const tiles = await Promise.all([0, 1, 2].map((i) => createImageBitmap(blob, i * w, 0, w, h, opts)))
      ;[normal, rough, color].forEach((t, i) => {
        t.image = tiles[i] as unknown as HTMLCanvasElement
        t.flipY = false
        t.needsUpdate = true
      })
    })
    .catch(() => {
      const made = build(mark, 256)
      ;[normal, rough, color].forEach((t, i) => {
        t.image = [made.normal, made.rough, made.color][i].image
        t.needsUpdate = true
      })
    })
  return { normal, rough, color } as unknown as ReturnType<typeof build>
}

/** For scripts/bake-engravings.mjs: a mark's three maps as PNG data URLs. */
if (typeof window !== 'undefined')
  (window as unknown as { __plateraEngrave?: (m: string, s: number) => string[] }).__plateraEngrave = (m, sz) => {
    const r = build(m, sz)
    return [r.normal, r.rough, r.color].map((t) => (t.image as HTMLCanvasElement).toDataURL('image/png'))
  }

function build(mark: string, size: number): { normal: THREE.CanvasTexture; rough: THREE.CanvasTexture; color: THREE.CanvasTexture } {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  g.fillStyle = '#fff'
  g.fillRect(0, 0, size, size)
  // The bead's UV wraps around it; the mark sits on the face toward the camera (u = 0.5).
  g.fillStyle = '#000'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  const fontSize = mark.length > 2 ? size * 0.2 : size * 0.27
  g.font = `600 ${fontSize}px Gambetta, Georgia, serif`
  g.save()
  g.translate(size * 0.5, size * 0.5)
  g.scale(0.55, 1) // compensate the sphere's horizontal UV stretch at the equator
  g.fillText(mark, 0, 0)
  g.restore()
  // A fine engraved ring around the mark.
  g.lineWidth = size * 0.012
  g.strokeStyle = '#000'
  g.beginPath()
  g.ellipse(size * 0.5, size * 0.5, size * 0.13, size * 0.25, 0, 0, Math.PI * 2)
  g.stroke()

  // Soften: an engraved cut has a bevelled wall, not a vertical cliff.
  const soft = document.createElement('canvas')
  soft.width = soft.height = size
  const s = soft.getContext('2d')!
  s.filter = `blur(${size * 0.003}px)`
  s.drawImage(c, 0, 0)
  const h = s.getImageData(0, 0, size, size).data

  const n = document.createElement('canvas')
  n.width = n.height = size
  const ng = n.getContext('2d')!
  const out = ng.createImageData(size, size)
  const r = document.createElement('canvas')
  r.width = r.height = size
  const rg = r.getContext('2d')!
  const rout = rg.createImageData(size, size)
  const at = (x: number, y: number) => h[(((y + size) % size) * size + ((x + size) % size)) * 4] / 255
  const strength = 4.5
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1)) * strength
      const dy = (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1)) * strength
      const len = Math.hypot(dx, dy, 1)
      const i = (y * size + x) * 4
      out.data[i] = ((-dx / len) * 0.5 + 0.5) * 255
      out.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255
      out.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255
      out.data[i + 3] = 255
      const cut = 1 - at(x, y)
      const rv = 0.1 + cut * 0.38 // polished face, satin cut
      rout.data[i] = rout.data[i + 1] = rout.data[i + 2] = rv * 255
      rout.data[i + 3] = 255
    }
  ng.putImageData(out, 0, 0)
  rg.putImageData(rout, 0, 0)
  // Enamel fill: the cut is inked with deep espresso, as engravers fill a mark so it reads
  // at a glance. The polished face stays white (× the gold colour = gold).
  const col = document.createElement('canvas')
  col.width = col.height = size
  const cg = col.getContext('2d')!
  const cimg = cg.createImageData(size, size)
  for (let i = 0; i < size * size; i++) {
    const cut = 1 - h[i * 4] / 255
    const k = 1 - cut * 0.86
    cimg.data[i * 4] = 255 * (k + cut * 0.16)
    cimg.data[i * 4 + 1] = 255 * (k + cut * 0.08)
    cimg.data[i * 4 + 2] = 255 * (k + cut * 0.03)
    cimg.data[i * 4 + 3] = 255
  }
  cg.putImageData(cimg, 0, 0)
  const color = new THREE.CanvasTexture(col)
  color.colorSpace = THREE.SRGBColorSpace
  const normal = new THREE.CanvasTexture(n)
  const rough = new THREE.CanvasTexture(r)
  for (const t of [normal, rough, color]) {
    t.wrapS = THREE.RepeatWrapping
    t.anisotropy = 8
  }
  return { normal, rough, color }
}
