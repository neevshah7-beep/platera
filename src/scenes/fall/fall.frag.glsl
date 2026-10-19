#version 300 es
// ─── SCENE 1 · THE FALL — live layer over the rendered frames ─────────────────
// The photoreal frame (Cycles) is the base. On top, in one pass:
//   · THE LAMP: the pointer carries a warm hand-held light. It lifts the exposure in a
//     soft pool and, more strongly, brightens what is already bright (gold, silk crests),
//     so the metal answers the light the way polished gold does.
//   · STAR GLINTS: the brightest pixels (diamond facets, claw tips) throw four-point star
//     streaks like a jewellery photographer's star filter; they twinkle, swell near the
//     lamp, and flare when the visitor presses.
//   · GOLD DUST: three depths of motes drifting up through the light, catching the lamp.
//   · Fine film grain and a warm vignette tie it to the page.
precision highp float;

uniform sampler2D uFrame;
uniform vec2 uRes;        // canvas pixels
uniform vec2 uImg;        // frame pixels
uniform vec2 uPointer;    // 0..1, y up
uniform float uLamp;      // 0..1 lamp presence (eased in/out with pointer activity)
uniform float uPress;     // 0..1 flash
uniform float uTime;
uniform float uFade;      // 0..1 scene visibility
in vec2 vUv;
out vec4 outColor;

float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

// Cover-fit the frame into the canvas (like object-fit: cover), keeping it centred.
vec2 coverUv(vec2 uv) {
  float ca = uRes.x / uRes.y, ia = uImg.x / uImg.y;
  vec2 s = ca > ia ? vec2(1.0, ia / ca) : vec2(ca / ia, 1.0);
  vec2 c = (uv - 0.5) * s + 0.5;
  return vec2(c.x, 1.0 - c.y); // image rows are stored top-down; GL samples bottom-up
}

vec3 glints(vec2 uv, vec2 px, float strength) {
  vec3 acc = vec3(0.0);
  vec2 dirs[4] = vec2[4](vec2(1.0, 0.0), vec2(0.0, 1.0), vec2(0.7071, 0.7071), vec2(-0.7071, 0.7071));
#ifdef LITE
  // Phones: the cross alone, sampled more coarsely (16 reads a pixel instead of 112).
  const int DIRS = 2; const int STEPS = 4; const float STRIDE = 7.7;
#else
  const int DIRS = 4; const int STEPS = 14; const float STRIDE = 2.2;
#endif
  for (int d = 0; d < DIRS; d++) {
    float len = d < 2 ? 1.0 : 0.55; // the cross is longer than the diagonals, as on a real filter
    for (int k = 1; k <= STEPS; k++) {
      float t = float(k);
      vec2 o = dirs[d] * px * t * STRIDE * len;
      vec3 a = texture(uFrame, uv + o).rgb;
      vec3 b = texture(uFrame, uv - o).rgb;
      float wa = smoothstep(0.86, 1.0, luma(a));
      float wb = smoothstep(0.86, 1.0, luma(b));
      float fall = exp(-t * 0.28 * STRIDE / 2.2);
      acc += (a * wa + b * wb) * fall;
    }
  }
#ifdef LITE
  acc *= 5.0; // fewer, sparser samples: weighted up to keep the same sparkle
#endif
  return acc * strength * 0.06;
}

vec3 dust(vec2 fragUv, vec2 lampUv, float aspect) {
  vec3 col = vec3(0.0);
  for (int layer = 0; layer < 3; layer++) {
    float L = float(layer);
    float scale = 26.0 + L * 22.0;
    vec2 p = fragUv * vec2(aspect, 1.0) * scale;
    p.y -= uTime * (0.25 + L * 0.12);           // drifting up through warm air
    p.x += sin(uTime * 0.2 + L) * 0.6;
    vec2 cell = floor(p);
    vec2 f = fract(p) - 0.5;
    float h = hash(cell + L * 17.0);
    if (h > 0.82) {
      vec2 jitter = vec2(hash(cell + 3.1), hash(cell + 7.7)) - 0.5;
      float d = length(f - jitter * 0.7);
      float size = 0.035 + 0.03 * (1.0 - L / 3.0);
      float mote = smoothstep(size, 0.0, d);
      float tw = 0.6 + 0.4 * sin(uTime * (1.5 + h * 3.0) + h * 40.0);
      float near = exp(-pow(length((fragUv - lampUv) * vec2(aspect, 1.0)) / 0.32, 2.0));
      col += mote * tw * (0.05 + near * 0.55) * vec3(1.0, 0.86, 0.55);
    }
  }
  return col;
}

void main() {
  vec2 uv = coverUv(vUv);
  vec2 px = 1.0 / uImg;
  vec3 base = texture(uFrame, uv).rgb;
  float aspect = uRes.x / uRes.y;

  // The lamp.
  float d = length((vUv - uPointer) * vec2(aspect, 1.0));
  float pool = exp(-pow(d / 0.38, 2.0)) * uLamp;
  float hot = exp(-pow(d / 0.16, 2.0)) * uLamp;
  float bright = smoothstep(0.55, 0.95, luma(base));
  vec3 warm = vec3(1.0, 0.9, 0.72);
  vec3 col = base * (1.0 + pool * 0.09 * warm) + base * bright * (pool * 0.12 + hot * 0.16) * warm;

  // Star glints: always a breath of them; more under the lamp; a flare on press.
  float twinkle = 0.75 + 0.25 * sin(uTime * 2.3) * sin(uTime * 3.7 + 1.0);
  col += glints(uv, px, (0.22 + pool * 0.5 + uPress * 2.0) * twinkle);

  col += dust(vUv, uPointer, aspect) * (0.45 + uLamp * 0.35);

  // Warm vignette and fine grain.
  vec2 q = vUv - 0.5;
  col *= mix(0.86, 1.0, smoothstep(0.75, 0.2, length(q * vec2(aspect * 0.8, 1.0))));
  col += (hash(vUv * uRes + fract(uTime) * 91.0) - 0.5) * 0.025;

  outColor = vec4(mix(vec3(0.91, 0.83, 0.65), col, uFade), 1.0);
}
