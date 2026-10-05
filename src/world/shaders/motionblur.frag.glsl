// ─── 5 · MOTION BLUR ─────────────────────────────────────────────────────────
// Per-pixel velocity from reprojection: the surface's world position (depth × current
// inverse view-projection) is projected with last frame's view-projection; the difference
// is the screen-space velocity. It is scaled by the camera speed, and the scroll velocity
// adds its own vertical streak, then integrated along a short blue-noise-jittered line.
#include <packing>
#include <common_post>

uniform sampler2D tDiffuse;
uniform sampler2D tBlue;
uniform mat4 uInvViewProj;
uniform mat4 uPrevViewProj;
uniform float uScale;
uniform float uScroll;     // scroll velocity, viewport heights per second
uniform vec2 uResolution;
uniform float uFrame;
varying vec2 vUv;

void main() {
  vec4 base = texture2D(tDiffuse, vUv);
  float depth = readDepth(vUv);
  vec4 clip = vec4(vUv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
  vec4 world = uInvViewProj * clip;
  world /= world.w;
  vec4 prev = uPrevViewProj * world;
  vec2 prevUv = prev.xy / prev.w * 0.5 + 0.5;
  vec2 vel = (vUv - prevUv) * uScale;
  vel.y += uScroll * 0.012;
  float len = length(vel * uResolution);
  if (len < 0.75) { gl_FragColor = base; return; }
  vel *= min(1.0, 48.0 / len);
  float j = texture2D(tBlue, gl_FragCoord.xy / 128.0 + fract(uFrame * 0.618)).r - 0.5;
  vec3 acc = vec3(0.0);
  const int N = 10;
  for (int i = 0; i < N; i++) {
    float t = (float(i) + 0.5 + j) / float(N) - 0.5;
    acc += texture2D(tDiffuse, vUv + vel * t).rgb;
  }
  gl_FragColor = vec4(acc / float(N), base.a);
}
