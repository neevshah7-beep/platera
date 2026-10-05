// ─── 11 · TEMPORAL ANTI-ALIASING ─────────────────────────────────────────────
// The projection is jittered each frame along an 8-sample Halton(2,3) sequence
// (post/Pipeline.ts). Here the history is reprojected through the depth buffer, clamped
// to the current frame's 3×3 neighbourhood in YCoCg (no ghosting), and blended. Fast
// motion lowers the history weight so a dolly stays crisp. It runs before the finishing
// pass on purpose: grain applied after TAA stays a fresh, sharp pattern every frame
// instead of being smeared into mush by the history.
#include <packing>
#include <common_post>

uniform sampler2D tDiffuse;
uniform sampler2D tHistory;
uniform mat4 uInvViewProj;
uniform mat4 uPrevViewProj;
uniform vec2 uResolution;
uniform float uReset;
varying vec2 vUv;

vec3 toYCoCg(vec3 c) { return vec3(dot(c, vec3(0.25, 0.5, 0.25)), dot(c, vec3(0.5, 0.0, -0.5)), dot(c, vec3(-0.25, 0.5, -0.25))); }
vec3 fromYCoCg(vec3 c) { return vec3(c.x + c.y - c.z, c.x + c.z, c.x - c.y - c.z); }

void main() {
  vec3 cur = texture2D(tDiffuse, vUv).rgb;
  float depth = readDepth(vUv);
  vec4 clip = vec4(vUv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
  vec4 world = uInvViewProj * clip;
  world /= world.w;
  vec4 prev = uPrevViewProj * world;
  vec2 prevUv = prev.xy / prev.w * 0.5 + 0.5;

  vec3 mn = vec3(1e9), mx = vec3(-1e9);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec3 s = toYCoCg(texture2D(tDiffuse, vUv + vec2(x, y) / uResolution).rgb);
    mn = min(mn, s);
    mx = max(mx, s);
  }
  vec3 hist = clamp(toYCoCg(texture2D(tHistory, prevUv).rgb), mn, mx);

  float motion = length((vUv - prevUv) * uResolution);
  float outside = (prevUv.x < 0.0 || prevUv.x > 1.0 || prevUv.y < 0.0 || prevUv.y > 1.0) ? 1.0 : 0.0;
  float alpha = mix(0.1, 0.5, clamp(motion / 12.0, 0.0, 1.0));
  alpha = max(alpha, max(outside, uReset));
  gl_FragColor = vec4(mix(fromYCoCg(hist), cur, alpha), 1.0);
}
