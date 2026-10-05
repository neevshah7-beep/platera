'use client'

import { useEffect, useRef } from 'react'

const RISE = 0.5 // s: the clouds roll in over the veil
const HOLD = 1.25 // s: fully in the clouds
const PART = 3.8 // s: the clouds have parted

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`

// Sunlit champagne cumulus: billowed 3D value noise, flown through toward the viewer.
// Lit from above (a second sample toward the light), honey in the hollows, a thin gold
// rim where the cloud is thinnest. Solid before it parts; it parts from the centre out.
const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform vec2 uRes;
uniform float uT;
uniform float uIn;
uniform float uPart;
float h(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float n(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h(i), h(i + vec3(1,0,0)), f.x), mix(h(i + vec3(0,1,0)), h(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h(i + vec3(0,0,1)), h(i + vec3(1,0,1)), f.x), mix(h(i + vec3(0,1,1)), h(i + vec3(1,1,1)), f.x), f.y), f.z);
}
// Billowed noise: rounded, puffy cumulus rather than streaks.
float billow(vec3 p) { float a = 0.55, s = 0.0; for (int k = 0; k < 5; k++) { s += a * (1.0 - abs(n(p) * 2.0 - 1.0)); p = p * 2.07 + vec3(3.1, 7.7, 1.9); a *= 0.48; } return s; }
float cloud(vec2 p, float t) {
  vec3 q = vec3(p, t * 0.12);
  vec2 w = vec2(n(q * 0.8 + 1.3), n(q * 0.8 + 7.1)) - 0.5;
  float b = billow(vec3(p * 0.9 + 0.35 * w, t * 0.1));
  return b * 0.62 + n(vec3(p * 0.6, t * 0.05)) * 0.3;
}
void main() {
  vec2 p = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  float r = length(p);
  // Flying forward: the cloud field opens out from the centre as we pass through it.
  float zoom = 1.0 + uT * 0.55;
  vec2 cp = p * 1.7 / zoom + vec2(0.0, -uT * 0.05);
  float d = cloud(cp, uT);
  float dl = cloud(cp + vec2(-0.03, 0.08), uT);
  // Lit from above: the sunward side of each billow is bright, the underside honey.
  float lit = clamp(0.55 + (d - dl) * 5.0, 0.0, 1.0);
  // Part from the centre: a widening, ragged opening.
  float open = uPart * 1.9 - 0.25 + (d - 0.5) * 0.7;
  float mask = smoothstep(open - 0.12, open + 0.28, r * 1.15);
  // Before parting the bank is solid (inside the cloud); parting thins it to wisps at the edges.
  float wisps = smoothstep(0.32, 0.6, d) * mask;
  float cover = max(wisps, 1.0 - smoothstep(0.0, 0.35, uPart));
  cover *= uIn * (1.0 - smoothstep(0.7, 1.0, uPart));
  vec3 hollow = vec3(0.76, 0.58, 0.34);
  vec3 body = vec3(0.95, 0.88, 0.74);
  vec3 sun = vec3(1.0, 0.975, 0.92);
  vec3 col = mix(hollow, body, smoothstep(0.3, 0.8, d));
  col = mix(col, sun, lit * 0.85);
  float rim = smoothstep(0.30, 0.42, d) * (1.0 - smoothstep(0.42, 0.6, d));
  col += vec3(0.95, 0.72, 0.30) * rim * 0.35 * lit;
  col *= 0.92 + 0.12 * vUv.y; // the sky is brighter overhead
  o = vec4(col * cover, cover);
}`

/**
 * THE CLOUDS. On entering, the veil is swallowed by sunlit champagne cloud; you fly
 * through it, and it parts from the centre to show the ring falling out of the sky.
 */
export function CloudVeil({ onDone }: { onDone: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = canvas.current!
    const gl = c.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false })
    if (!gl) {
      onDone()
      return
    }
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog))
      onDone()
      return
    }
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const u = (name: string) => gl.getUniformLocation(prog, name)
    // Cloud is soft: a reduced resolution is indistinguishable and keeps the entrance smooth.
    const scale = Math.min(devicePixelRatio, 2) * 0.7
    c.width = Math.round(innerWidth * scale)
    c.height = Math.round(innerHeight * scale)
    gl.viewport(0, 0, c.width, c.height)
    const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x))
    const t0 = performance.now()
    let raf = 0
    const loop = (now: number) => {
      const t = (now - t0) / 1000
      if (t > PART) {
        onDone()
        return
      }
      raf = requestAnimationFrame(loop)
      gl.uniform2f(u('uRes'), c.width, c.height)
      gl.uniform1f(u('uT'), t)
      gl.uniform1f(u('uIn'), ease(t / RISE))
      gl.uniform1f(u('uPart'), ease((t - HOLD) / (PART - HOLD)))
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
      // The context is released with the canvas when the veil unmounts (not here: a
      // remount reuses this canvas, and a lost context would never draw again).
    }
  }, [onDone])
  return <canvas ref={canvas} className="cloud-veil" aria-hidden />
}
