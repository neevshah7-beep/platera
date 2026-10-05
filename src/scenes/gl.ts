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

/** Load a numbered frame sequence, reporting progress; frames decode off the main thread. */
export async function loadFrames(base: string, count: number, onProgress: (p: number) => void): Promise<ImageBitmap[]> {
  let done = 0
  const one = async (i: number) => {
    const res = await fetch(`${base}/${String(i + 1).padStart(4, '0')}.webp`)
    const bmp = await createImageBitmap(await res.blob())
    onProgress(++done / count)
    return bmp
  }
  // Six at a time: fast on broadband, gentle on phones.
  const out: ImageBitmap[] = new Array(count)
  let next = 0
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      while (next < count) {
        const i = next++
        out[i] = await one(i)
      }
    }),
  )
  return out
}
