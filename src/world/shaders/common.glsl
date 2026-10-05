// ─── Shared helpers for the post chain ─────────────────────────────────────────
// Depth comes from the G-buffer pass (a perspective DepthTexture); normals are view-space,
// packed to RGB by MeshNormalMaterial. Every pass that uses these includes <packing> first.

uniform sampler2D tDepth;
uniform sampler2D tNormal;
uniform mat4 uProjection;
uniform mat4 uProjectionInverse;
uniform float uNear;
uniform float uFar;

float readDepth(vec2 uv) { return texture2D(tDepth, uv).x; }

// View-space position of the surface at uv.
vec3 viewPosition(vec2 uv, float depth) {
  vec4 clip = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
  vec4 view = uProjectionInverse * clip;
  return view.xyz / view.w;
}

float linearDepth(float depth) {
  return -perspectiveDepthToViewZ(depth, uNear, uFar);
}

vec3 viewNormal(vec2 uv) {
  return normalize(unpackRGBToNormal(texture2D(tNormal, uv).rgb));
}

float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
