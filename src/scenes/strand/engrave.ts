import * as THREE from 'three'

/**
 * Engravings for the promise beads. A mark (numerals or a symbol) is drawn into a canvas
 * as a height field (white = raised rim, dark = cut), softened, and converted to a tangent-
 * space normal map with a Sobel filter, so the mark reads as metal cut into the bead, lit
 * by the scene, not as a decal printed on it. The roughness map makes the cut satin and the
 * surface polished, which is how a hand-engraved mark actually catches light.
 */
export function engraving(mark: string, size = 1024): { normal: THREE.CanvasTexture; rough: THREE.CanvasTexture; color: THREE.CanvasTexture } {
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
