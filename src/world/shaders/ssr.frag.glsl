// ─── 3 · SCREEN-SPACE REFLECTIONS ─────────────────────────────────────────────
// Only on surfaces the scene marks reflective (velvet, plinth tops). The mask carries
// reflectivity (r), roughness (g) and the masked surface's own linear depth (b), so a
// piece lying on the velvet (not in the mask) correctly hides the velvet beneath it.
// The ray is marched in view space against the depth buffer with a thickness test, a
// binary search refines the hit, rough surfaces jitter the ray inside a blue-noise cone
// (resolved by TAA), and the result fades at screen edges and by Fresnel.
#include <packing>
#include <common_post>

uniform sampler2D tDiffuse;
uniform sampler2D tMask;
uniform sampler2D tBlue;
uniform vec2 uResolution;
uniform float uFrame;
uniform int uSteps;
varying vec2 vUv;

vec2 project(vec3 v) {
  vec4 c = uProjection * vec4(v, 1.0);
  return c.xy / c.w * 0.5 + 0.5;
}

void main() {
  vec4 base = texture2D(tDiffuse, vUv);
  vec4 mask = texture2D(tMask, vUv);
  float depth = readDepth(vUv);
  if (mask.r <= 0.0 || depth >= 1.0) { gl_FragColor = base; return; }
  float lin = linearDepth(depth);
  if (abs(mask.b - lin) > 0.02 * lin + 0.002) { gl_FragColor = base; return; }

  vec3 P = viewPosition(vUv, depth);
  vec3 N = viewNormal(vUv);
  vec3 V = normalize(P);
  float bn = texture2D(tBlue, gl_FragCoord.xy / 128.0 + fract(uFrame * 0.618)).r;
  float ang = bn * 6.2831853;
  vec3 T = normalize(cross(N, abs(N.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
  vec3 B = cross(N, T);
  vec3 Nr = normalize(N + (T * cos(ang) + B * sin(ang)) * mask.g * 0.35);
  vec3 R = normalize(reflect(V, Nr));
  if (R.z > 0.2) { gl_FragColor = base; return; } // reflecting back toward the camera: no data

  float stepLen = 0.02 + lin * 0.012;
  vec3 ray = P + R * stepLen * (0.5 + bn);
  vec2 hitUv = vec2(-1.0);
  vec3 prev = P;
  for (int i = 0; i < 64; i++) {
    if (i >= uSteps) break;
    vec2 suv = project(ray);
    if (suv.x < 0.0 || suv.x > 1.0 || suv.y < 0.0 || suv.y > 1.0) break;
    float sceneZ = -viewPosition(suv, readDepth(suv)).z;
    float rayZ = -ray.z;
    float thickness = 0.04 + rayZ * 0.02;
    if (rayZ > sceneZ && rayZ - sceneZ < thickness) {
      vec3 a = prev, b = ray;
      for (int k = 0; k < 5; k++) {
        vec3 m = (a + b) * 0.5;
        vec2 muv = project(m);
        float mz = -viewPosition(muv, readDepth(muv)).z;
        if (-m.z > mz) b = m; else a = m;
      }
      hitUv = project(b);
      break;
    }
    prev = ray;
    ray += R * stepLen;
    stepLen *= 1.12;
  }
  if (hitUv.x < 0.0) { gl_FragColor = base; return; }

  vec2 edge = smoothstep(vec2(0.0), vec2(0.12), hitUv) * (1.0 - smoothstep(vec2(0.88), vec2(1.0), hitUv));
  float fresnel = pow(1.0 - max(dot(-V, N), 0.0), 3.0) * 0.8 + 0.2;
  float w = mask.r * edge.x * edge.y * fresnel;
  vec3 refl = texture2D(tDiffuse, hitUv).rgb;
  gl_FragColor = vec4(base.rgb + refl * w, base.a);
}
