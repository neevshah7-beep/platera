// The scenes' procedural normal maps, made once here rather than pixel by pixel in the page.
//   node scripts/make-textures.mjs  →  public/media/tex/{silk,leather}-normal.png
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

mkdirSync('public/media/tex', { recursive: true })

async function normals(size, h, strength, out) {
  const px = Buffer.alloc(size * size * 3)
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const dx = (h(x + 1, y) - h(x - 1, y)) * strength
      const dy = (h(x, y + 1) - h(x, y - 1)) * strength
      const l = Math.hypot(dx, dy, 1)
      const i = (y * size + x) * 3
      px[i] = (-dx / l * 0.5 + 0.5) * 255
      px[i + 1] = (dy / l * 0.5 + 0.5) * 255
      px[i + 2] = (1 / l * 0.5 + 0.5) * 255
    }
  await sharp(px, { raw: { width: size, height: size, channels: 3 } }).png({ compressionLevel: 9 }).toFile(out)
  console.log(out)
}

// Silk: long soft swells.
await normals(1024, (x, y) => Math.sin(x * 0.022 + y * 0.009 + Math.sin(y * 0.006) * 2.0) * 1.0 + Math.sin(x * 0.006 - y * 0.017 + 1.3) * 0.7 + Math.sin(x * 0.051 + y * 0.034) * 0.12, 6, 'public/media/tex/silk-normal.png')

// Leather: a fine pebbled grain, two scales of soft cells (tileable).
const S = 512, N = 64
let s = 7
const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
const grid = Array.from({ length: N * N }, () => rnd())
const g = (xi, yi) => grid[(((yi % N) + N) % N) * N + (((xi % N) + N) % N)]
const v = (x, y) => {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi
  const a = g(xi, yi), b = g(xi + 1, yi), c = g(xi, yi + 1), d = g(xi + 1, yi + 1)
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy)
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy
}
const k = N / S
await normals(S, (x, y) => (0.5 - Math.abs(v(x * k * 6, y * k * 6) - 0.5)) + v(x * k * 17, y * k * 17) * 0.35, 4, 'public/media/tex/leather-normal.png')
