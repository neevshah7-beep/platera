// ─── 6–10 · FINISH ─────────────────────────────────────────────────────────────
// 6  selective bloom: added in linear light (the bloom buffer only ever contains
//    highlights on objects in the bloom layer, thresholded at 0.9)
// 7  chromatic aberration: radial, 0.0008 at rest rising to 0.004 with scroll velocity;
//    the lens also barrels slightly with velocity (T16)
// 8  ACES filmic at the renderer exposure (1.1), sRGB encode, then the hand-authored 3D
//    LUT: shadows cool, highlights warm, so gold separates from the obsidian ground
// 9  vignette 0.25
// 10 film grain 0.035, blue-noise sampled with a per-frame offset (reads as silver halide,
//    not video noise), strongest in the mid-tones as on film
// Hooks for later tasks: heat shimmer over the Threshold's gold terrain.

uniform sampler2D tDiffuse;
uniform sampler2D tBloom;
uniform sampler2D tBlue;
uniform highp sampler3D tLut;
uniform float uLutSize;
uniform float uBloom;
uniform float uCA;
uniform float uLens;
uniform float uExposure;
uniform float uVignette;
uniform float uGrain;
uniform float uFrame;
uniform float uTime;
uniform vec2 uResolution;
uniform bool uUseLut;
uniform bool uUseCA;
uniform bool uUseVignette;
uniform bool uUseGrain;
uniform bool uUseBloom;
uniform float uShimmer;
uniform vec4 uShimmerRect;
varying vec2 vUv;

float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

vec3 pl_rrtOdtFit(vec3 v) {
  vec3 a = v * (v + 0.0245786) - 0.000090537;
  vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
  return a / b;
}
// Identical to three.js ACESFilmicToneMapping.
vec3 pl_acesFilmic(vec3 color) {
  const mat3 PL_IN = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
  const mat3 PL_OUT = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
  color *= uExposure / 0.6;
  color = PL_IN * color;
  color = pl_rrtOdtFit(color);
  color = PL_OUT * color;
  return clamp(color, 0.0, 1.0);
}
vec3 toSRGB(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

vec3 sampleScene(vec2 uv) {
  vec3 c = texture2D(tDiffuse, uv).rgb;
  if (uUseBloom) {
    // HDR highlights can carry Inf/NaN through the blur chain; one bad texel would black the frame.
    vec3 b = texture2D(tBloom, uv).rgb;
    b = any(isnan(b)) || any(isinf(b)) ? vec3(0.0) : clamp(b, 0.0, 32.0);
    c += b * uBloom;
  }
  return any(isnan(c)) ? vec3(0.0) : c;
}

void main() {
  vec2 uv = vUv;
  vec2 d = uv - 0.5;
  uv = 0.5 + d * (1.0 - uLens * dot(d, d));
  if (uShimmer > 0.0) {
    vec2 inside = step(uShimmerRect.xy, uv) * step(uv, uShimmerRect.zw);
    uv += inside.x * inside.y * uShimmer * vec2(sin(uv.y * 90.0 + uTime * 3.1), cos(uv.x * 70.0 - uTime * 2.3)) * 0.0012;
  }

  vec3 col;
  if (uUseCA) {
    vec2 dir = uv - 0.5;
    col.r = sampleScene(uv + dir * uCA).r;
    col.g = sampleScene(uv).g;
    col.b = sampleScene(uv - dir * uCA).b;
  } else {
    col = sampleScene(uv);
  }

  col = toSRGB(pl_acesFilmic(col));

  if (uUseLut) {
    vec3 lutUv = col * ((uLutSize - 1.0) / uLutSize) + 0.5 / uLutSize;
    col = texture(tLut, lutUv).rgb;
  }

  if (uUseVignette) {
    float r = length(d * vec2(uResolution.x / uResolution.y, 1.0));
    col *= mix(1.0 - uVignette, 1.0, smoothstep(0.95, 0.25, r));
  }

  if (uUseGrain) {
    vec2 o = vec2(fract(uFrame * 0.7548776662), fract(uFrame * 0.56984029));
    float n = texture2D(tBlue, gl_FragCoord.xy / 128.0 + o).r - 0.5;
    float mid = 1.0 - abs(luma(col) * 2.0 - 1.0) * 0.6;
    col += n * uGrain * 2.0 * mid;
  }
  gl_FragColor = vec4(col, 1.0);
}
