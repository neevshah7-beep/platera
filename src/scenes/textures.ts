import * as THREE from 'three'

/** Fine pebbled leather grain as a normal map: two scales of soft cellular bumps. */
export function leatherNormals(size = 512): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  const img = g.createImageData(size, size)
  let s = 7
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const N = 64
  const grid = Array.from({ length: N * N }, () => rnd())
  const v = (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi
    const a = grid[((yi % N) + N) % N * N + ((xi % N) + N) % N], b = grid[((yi % N) + N) % N * N + (((xi + 1) % N) + N) % N]
    const c2 = grid[(((yi + 1) % N) + N) % N * N + ((xi % N) + N) % N], d = grid[(((yi + 1) % N) + N) % N * N + (((xi + 1) % N) + N) % N]
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy)
    return a + (b - a) * ux + (c2 - a) * uy + (a - b - c2 + d) * ux * uy
  }
  const h = (x: number, y: number) => {
    const k = (N / size)
    const p = Math.abs(v(x * k * 6, y * k * 6) - 0.5)
    return (0.5 - p) * 1.0 + v(x * k * 17, y * k * 17) * 0.35
  }
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const dx = (h(x + 1, y) - h(x - 1, y)) * 4
      const dy = (h(x, y + 1) - h(x, y - 1)) * 4
      const l = Math.hypot(dx, dy, 1)
      const i = (y * size + x) * 4
      img.data[i] = (-dx / l * 0.5 + 0.5) * 255
      img.data[i + 1] = (dy / l * 0.5 + 0.5) * 255
      img.data[i + 2] = (1 / l * 0.5 + 0.5) * 255
      img.data[i + 3] = 255
    }
  g.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(3, 3)
  t.anisotropy = 8
  return t
}

