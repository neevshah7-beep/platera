// ─── 4 · DEPTH OF FIELD (bokeh) ───────────────────────────────────────────────
// Thin-lens circle of confusion from the G-buffer depth, focused on the rig's focal
// distance (bound to the hero stone; rack focus moves it to the ledger), with an aperture
// the scroll animates. Gathered on a golden-angle (Vogel) disc so the bokeh is round;
// each sample only counts if its own blur reaches this pixel, so a sharp subject never
// bleeds into a soft background. Bright samples weigh more, as through a real aperture.
#include <packing>
#include <common_post>

uniform sampler2D tDiffuse;
uniform vec2 uResolution;
uniform float uFocus;      // metres
uniform float uAperture;   // CoC in pixels per unit of relative defocus
uniform float uMaxCoc;     // pixels
uniform int uTaps;
varying vec2 vUv;

float coc(float depth) {
  float z = linearDepth(depth);
  return clamp(uAperture * abs(z - uFocus) / max(z, 1e-3), 0.0, uMaxCoc);
}

void main() {
  vec4 base = texture2D(tDiffuse, vUv);
  float c0 = coc(readDepth(vUv));
  if (c0 < 0.5) { gl_FragColor = base; return; }
  vec3 acc = base.rgb;
  float wsum = 1.0;
  const float GA = 2.39996323;
  for (int i = 1; i < 64; i++) {
    if (i >= uTaps) break;
    float r = sqrt(float(i) / float(uTaps)) * c0;
    float a = float(i) * GA;
    vec2 suv = vUv + vec2(cos(a), sin(a)) * r / uResolution;
    float cs = coc(readDepth(suv));
    float w = smoothstep(r - 1.0, r + 1.0, cs);
    vec3 s = texture2D(tDiffuse, suv).rgb;
    w *= 1.0 + 3.0 * smoothstep(0.9, 2.5, luma(s));
    acc += s * w;
    wsum += w;
  }
  gl_FragColor = vec4(acc / wsum, base.a);
}
