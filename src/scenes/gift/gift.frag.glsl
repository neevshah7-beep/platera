#version 300 es
// ─── SCENE 5 · THE GIFT — composite over the rendered wrapping ───────────────
// The wrapping itself is all in the frames. While the visitor pulls the ribbon, the
// frame leans a touch in the direction of the pull (a parallax of the whole table) and a
// soft warm glow gathers at the bow, so the pull feels physical, not like a scrubber.
precision highp float;

uniform sampler2D uFrame;
uniform vec2 uRes;
uniform vec2 uImg;
uniform float uPull;    // −1..1, how hard and which way the ribbon is being pulled
uniform vec2 uBow;      // the bow, frame uv (y up)
uniform float uTime;
in vec2 vUv;
out vec4 outColor;

float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

vec2 coverUv(vec2 uv) {
  float ca = uRes.x / uRes.y, ia = uImg.x / uImg.y;
  vec2 s = ca > ia ? vec2(1.0, ia / ca) : vec2(ca / ia, 1.0);
  return (uv - 0.5) * s + 0.5;
}

void main() {
  float aspect = uRes.x / uRes.y;
  vec2 uv = coverUv(vUv);
  // Set the box a little lower, so the bow has air beneath the chapter rail.
  uv.y = min(uv.y + 0.05, 0.998);
  // Lean with the pull: the far silk shifts more than the box, a sense of depth.
  float depth = smoothstep(0.2, 0.9, uv.y);
  uv.x -= uPull * 0.008 * (0.4 + depth);
  vec3 col = texture(uFrame, vec2(uv.x, 1.0 - uv.y)).rgb;
  vec2 d = (uv - uBow) * vec2(aspect, 1.0);
  col += vec3(1.0, 0.82, 0.5) * abs(uPull) * 0.12 * exp(-dot(d, d) / 0.012);
  vec2 q = vUv - 0.5;
  col *= mix(0.86, 1.0, smoothstep(0.95, 0.25, length(q * vec2(aspect * 0.8, 1.0))));
  col += (hash2(vUv * uRes + fract(uTime) * 91.0) - 0.5) * 0.02;
  outColor = vec4(col, 1.0);
}
