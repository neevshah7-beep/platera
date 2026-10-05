#version 300 es
// ─── SCENE 3 · THE STAMP — live layer over the rendered strike ────────────────
//   · HOLD (uHold 0→1): the frame tightens: a slow push-in toward the bar, the vignette
//     closing, a fine tremble growing as the punch is drawn up under tension.
//   · STRIKE (uStrike = seconds since impact): a warm flash at the die; forty sparks
//     thrown out along the bar's surface, arcing and cooling from white-gold to ember;
//     a shockwave that refracts the image as it races outward from the strike point.
precision highp float;

uniform sampler2D uFrame;
uniform vec2 uRes;
uniform vec2 uImg;
uniform vec2 uImpact;   // strike point in frame uv (y up)
uniform float uHold;
uniform float uStrike;  // < 0 before any strike
uniform float uTime;
uniform float uDieRadius; // half the die's width, in frame-height units
in vec2 vUv;
out vec4 outColor;

float hash(float n) { return fract(sin(n * 127.1) * 43758.5453); }
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

vec2 coverUv(vec2 uv) {
  float ca = uRes.x / uRes.y, ia = uImg.x / uImg.y;
  vec2 s = ca > ia ? vec2(1.0, ia / ca) : vec2(ca / ia, 1.0);
  return (uv - 0.5) * s + 0.5;
}
vec2 toFrame(vec2 uv) { return vec2(uv.x, 1.0 - uv.y); }

// Distance from p to segment ab.
float seg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  float aspect = uRes.x / uRes.y;
  vec2 uv = coverUv(vUv);

  // Hold: push in toward the impact point, with a tremble that grows with tension.
  float push = uHold * 0.06;
  uv = mix(uv, uImpact, push);
  float tremble = uHold * uHold * 0.0012;
  uv += vec2(sin(uTime * 61.0), cos(uTime * 53.0)) * tremble;

  // Strike: a shockwave ring refracts the frame as it travels outward.
  float t = uStrike;
  if (t >= 0.0 && t < 1.2) {
    vec2 d = (uv - uImpact) * vec2(aspect, 1.0);
    float r = length(d);
    float front = t * 0.9;
    float ring = exp(-pow((r - front) / 0.035, 2.0)) * exp(-t * 2.4);
    uv -= normalize(d + 1e-5) / vec2(aspect, 1.0) * ring * 0.012;
  }

  vec3 col = texture(uFrame, toFrame(uv)).rgb;

  if (t >= 0.0 && t < 2.0) {
    vec2 p = (uv - uImpact) * vec2(aspect, 1.0);
    // The flash at the die: white-hot, gone in a quarter second.
    float flash = exp(-t * 14.0);
    col += vec3(1.0, 0.86, 0.6) * flash * exp(-dot(p - vec2(0.0, -0.004), p - vec2(0.0, -0.004)) / 0.0025) * 1.6;
    col += vec3(1.0, 0.9, 0.7) * flash * 0.12;
    // Sparks: thrown from the rim of the die, low and fast along the bar's surface, each a
    // thin motion-streak that cools from white-gold to ember and dies within half a second.
    vec3 sparks = vec3(0.0);
    for (int i = 0; i < 48; i++) {
      float fi = float(i);
      float life = 0.18 + hash(fi + 1.0) * 0.32;
      if (t > life) continue;
      float side = hash(fi + 3.0) < 0.5 ? -1.0 : 1.0;
      vec2 origin = vec2(side * uDieRadius * (0.85 + 0.2 * hash(fi + 5.0)), -0.004);
      float ang = mix(0.05, 0.55, hash(fi + 7.0));                 // shallow: skimming the bar
      float speed = 0.9 + hash(fi + 13.0) * 1.6;
      vec2 v0 = vec2(side * cos(ang), sin(ang)) * speed;
      vec2 g = vec2(0.0, -2.2);
      vec2 a = origin + v0 * t + 0.5 * g * t * t;
      float tt = max(0.0, t - 0.035);                               // streak length = 35 ms of travel
      vec2 b = origin + v0 * tt + 0.5 * g * tt * tt;
      float dist = seg(p, a, b);
      float k = 1.0 - t / life;
      float w = 0.0007 + 0.0006 * k;
      float glow = smoothstep(w * 2.5, 0.0, dist) * k;
      vec3 hot = mix(vec3(1.0, 0.42, 0.1), vec3(1.0, 0.96, 0.85), k * k);
      sparks += hot * glow * 2.2;
    }
    col += sparks;
  }

  // Vignette closes in with the tension; fine grain ties it to the page.
  vec2 q = vUv - 0.5;
  float v = smoothstep(0.95 - uHold * 0.25, 0.25, length(q * vec2(aspect * 0.8, 1.0)));
  col *= mix(0.82 - uHold * 0.12, 1.0, v);
  col += (hash2(vUv * uRes + fract(uTime) * 97.0) - 0.5) * 0.022;
  outColor = vec4(col, 1.0);
}
