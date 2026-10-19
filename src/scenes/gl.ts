/**
 * Minimal WebGL2 for full-screen composited scenes: one program, one triangle, a few
 * textures. Scenes that are photoreal frame sequences need nothing heavier.
 */
import packs from './packs.json'

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
  static async loadFirst(bases: string[], count: number, onProgress: (p: number) => void, progressive = false): Promise<FrameStore | null> {
    // A packed sequence is one download (scripts/pack-frames.mjs). If the host refuses it
    // (a busy shared connection), wait and ask again rather than falling back to ~150
    // single frames, which would only deepen the refusal.
    for (const b of bases) {
      const pack = (packs as Record<string, string>)[b.replace(/^\/scenes\//, '')]
      if (!pack) continue
      for (const wait of [0, 2500, 6000, 12000]) {
        if (wait) await new Promise((r) => setTimeout(r, wait))
        try {
          return await FrameStore.loadPack(pack, onProgress, progressive)
        } catch {}
      }
      return null
    }
    for (const b of bases) {
      const ok = await fetch(`${b}/0001.webp`, { method: 'HEAD' }).then((r) => r.ok).catch(() => false)
      if (ok) return FrameStore.load(b, count, onProgress, progressive)
    }
    return null
  }

  /**
   * Fetches a packed sequence in one request and splits it into frames as the bytes
   * stream in, so a progressive scene still appears with its first frame.
   */
  static async loadPack(url: string, onProgress: (p: number) => void, progressive = false): Promise<FrameStore> {
    const res = await fetch(url)
    if (!res.ok || !res.body) throw new Error(`pack ${res.status}`)
    const reader = res.body.getReader()
    const store = new FrameStore()
    let buf = new Uint8Array(0)
    let lens: number[] | null = null
    let blobs: Blob[] = []
    let next = 0
    let firstIn: () => void = () => {}
    let failed: (e: unknown) => void = () => {}
    const first0 = new Promise<void>((resolve, reject) => ((firstIn = resolve), (failed = reject)))
    const all = (async () => {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        const joined = new Uint8Array(buf.length + value.length)
        joined.set(buf)
        joined.set(value, buf.length)
        buf = joined
        if (!lens) {
          if (buf.length < 8) continue
          const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
          const count = view.getUint32(4, true)
          if (buf.length < 8 + 4 * count) continue
          lens = Array.from({ length: count }, (_, i) => view.getUint32(8 + 4 * i, true))
          blobs = new Array(count)
          store.blobs = blobs
          buf = buf.slice(8 + 4 * count)
        }
        while (next < lens.length && buf.length >= lens[next]) {
          blobs[next] = new Blob([buf.slice(0, lens[next])], { type: 'image/webp' })
          buf = buf.slice(lens[next])
          if (next === 0) firstIn()
          next++
          onProgress(next / lens.length)
        }
      }
      if (!lens || next < lens.length) throw new Error('pack cut short')
    })()
    all.catch(failed)
    await (progressive ? first0 : all)
    const first = await createImageBitmap(blobs[0])
    store.width = first.width
    store.height = first.height
    store.cache.set(0, first)
    return store
  }

  /**
   * Fetches the sequence (six requests at a time, in order). Progressive: resolves as soon
   * as the first frame is in, and the rest keep arriving behind it (get() shows the nearest
   * frame that has arrived), so a scene appears at once instead of after its last frame.
   */
  static async load(base: string, count: number, onProgress: (p: number) => void, progressive = false): Promise<FrameStore> {
    const store = new FrameStore()
    let done = 0
    const blobs: Blob[] = new Array(count)
    store.blobs = blobs
    let next = 0
    let firstIn: () => void = () => {}
    const first0 = new Promise<void>((r) => (firstIn = r))
    const all = Promise.all(
      Array.from({ length: 6 }, async () => {
        while (next < count) {
          const i = next++
          const res = await fetch(`${base}/${String(i + 1).padStart(4, '0')}.webp`)
          blobs[i] = await res.blob()
          if (i === 0) firstIn()
          onProgress(++done / count)
        }
      }),
    )
    await (progressive ? first0 : all)
    const first = await createImageBitmap(blobs[0])
    store.width = first.width
    store.height = first.height
    store.cache.set(0, first)
    return store
  }

  /** The decoded frame if ready (else the nearest decoded one), and decode around it. */
  get(i: number): ImageBitmap | null {
    i = Math.max(0, Math.min(this.blobs.length - 1, i))
    // While a progressive load is still arriving, aim for the nearest frame that is here.
    if (!this.blobs[i]) {
      let j = i
      while (j > 0 && !this.blobs[j]) j--
      i = j
    }
    for (let d = -2; d <= 4; d++) this.decode(i + d)
    if (this.cache.has(i)) return this.cache.get(i)!
    let best: ImageBitmap | null = null
    let bd = Infinity
    for (const [k, v] of this.cache) if (Math.abs(k - i) < bd) (bd = Math.abs(k - i)), (best = v)
    return best
  }

  private decode(i: number) {
    if (i < 0 || i >= this.blobs.length || !this.blobs[i] || this.cache.has(i) || this.pending.has(i)) return
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
