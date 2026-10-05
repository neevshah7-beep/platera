/**
 * Minimal WebGL2 for full-screen composited scenes: one program, one triangle, a few
 * textures. Scenes that are photoreal frame sequences need nothing heavier.
 */
const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`

export type GL = {
  gl: WebGL2RenderingContext
  program: WebGLProgram
  uniform: (name: string) => WebGLUniformLocation | null
  draw: () => void
  dispose: () => void
}

export function createGL(canvas: HTMLCanvasElement, frag: string): GL | null {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' })
  if (!gl) return null
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader')
    return s
  }
  const program = gl.createProgram()!
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT))
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, frag))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'link')
  gl.useProgram(program)
  // Champagne, never black, before the first frame has arrived.
  gl.clearColor(0.91, 0.83, 0.65, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(program, 'aPos')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  const cache = new Map<string, WebGLUniformLocation | null>()
  return {
    gl,
    program,
    uniform: (name) => {
      if (!cache.has(name)) cache.set(name, gl.getUniformLocation(program, name))
      return cache.get(name)!
    },
    draw: () => gl.drawArrays(gl.TRIANGLES, 0, 3),
    dispose: () => {
      gl.deleteBuffer(buf)
      gl.deleteProgram(program)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}

/** Upload an image into texture unit 0 (sRGB frames go straight through; the shader works in display space). */
export function uploadImage(gl: WebGL2RenderingContext, tex: WebGLTexture, img: TexImageSource) {
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
}

export function makeTexture(gl: WebGL2RenderingContext) {
  const t = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, t)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  return t
}

/**
 * A rendered frame sequence held compressed (WebP blobs, ~10–20 KB each) and decoded on
 * demand into a small rolling cache around the frame being shown. Keeping every frame
 * decoded would cost ~5.7 MB per 1600 px frame (≈ 860 MB for 150 frames), enough to make
 * a laptop or phone GPU drop the WebGL context.
 */
export class FrameStore {
  private blobs: Blob[] = []
  private cache = new Map<number, ImageBitmap>()
  private pending = new Set<number>()
  width = 0
  height = 0
  constructor(private keep = 6) {}

  get count() {
    return this.blobs.length
  }

  /** Load the first available of several sequences (e.g. the portrait render, then the landscape one). */
  static async loadFirst(bases: string[], count: number, onProgress: (p: number) => void): Promise<FrameStore | null> {
    for (const b of bases) {
      const ok = await fetch(`${b}/0001.webp`, { method: 'HEAD' }).then((r) => r.ok).catch(() => false)
      if (ok) return FrameStore.load(b, count, onProgress)
    }
    return null
  }

  static async load(base: string, count: number, onProgress: (p: number) => void): Promise<FrameStore> {
    const store = new FrameStore()
    let done = 0
    const blobs: Blob[] = new Array(count)
    let next = 0
    await Promise.all(
      Array.from({ length: 6 }, async () => {
        while (next < count) {
          const i = next++
          const res = await fetch(`${base}/${String(i + 1).padStart(4, '0')}.webp`)
          blobs[i] = await res.blob()
          onProgress(++done / count)
        }
      }),
    )
    store.blobs = blobs
    const first = await createImageBitmap(blobs[0])
    store.width = first.width
    store.height = first.height
    store.cache.set(0, first)
    return store
  }

  /** The decoded frame if ready (else the nearest decoded one), and decode around it. */
  get(i: number): ImageBitmap | null {
    i = Math.max(0, Math.min(this.blobs.length - 1, i))
    for (let d = -2; d <= 4; d++) this.decode(i + d)
    if (this.cache.has(i)) return this.cache.get(i)!
    let best: ImageBitmap | null = null
    let bd = Infinity
    for (const [k, v] of this.cache) if (Math.abs(k - i) < bd) (bd = Math.abs(k - i)), (best = v)
    return best
  }

  private decode(i: number) {
    if (i < 0 || i >= this.blobs.length || this.cache.has(i) || this.pending.has(i)) return
    this.pending.add(i)
    createImageBitmap(this.blobs[i]).then((bmp) => {
      this.pending.delete(i)
      this.cache.set(i, bmp)
      if (this.cache.size > this.keep) {
        // Drop the decoded frames farthest from the one just made.
        const far = [...this.cache.keys()].sort((a, b) => Math.abs(b - i) - Math.abs(a - i))
        for (const k of far.slice(0, this.cache.size - this.keep)) {
          this.cache.get(k)!.close()
          this.cache.delete(k)
        }
      }
    })
  }

  /** Free every decoded frame (the compressed files stay); used while scrolled away. */
  trim() {
    for (const b of this.cache.values()) b.close()
    this.cache.clear()
  }

  dispose() {
    for (const b of this.cache.values()) b.close()
    this.cache.clear()
    this.blobs = []
  }
}
