import * as THREE from 'three'

/**
 * PIECE LIGHT: makes a flat photograph of a piece respond to a moving lamp.
 *
 * We have no 3D model of each piece, only a cut-out photograph (transparent PNG/WebP).
 * Polished silver photographed from above is bright where its surface faces the
 * camera and dark at its edges, so the photo's brightness is a usable stand-in for
 * the height of the metal. From that height we derive a surface normal per pixel
 * and light it with the real lamp position in the scene:
 *
 *   height(uv)  = luminance of the photo at uv
 *   normal      = from the slope of height in x and y (a Sobel-like difference)
 *   diffuse     = how much the surface faces the lamp
 *   specular    = a tight highlight where the lamp reflects toward the camera,
 *                 strongest on the brightest (most metal-like) pixels
 *
 * The result is subtle by design: the photo stays truthful, and the light slides
 * across chains and stones as it would under a jeweller's lamp. If you ever see it
 * look like a filter, lower uRelief or uSpecular, not the other way round.
 */

export const pieceLightVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vNormalW;
  varying vec3 vTangentW;
  varying vec3 vBitangentW;

  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPos = world.xyz;
    // A plane's own axes, carried into world space, form the frame we perturb the normal in.
    mat3 m = mat3(modelMatrix);
    vNormalW = normalize(m * vec3(0.0, 0.0, 1.0));
    vTangentW = normalize(m * vec3(1.0, 0.0, 0.0));
    vBitangentW = normalize(m * vec3(0.0, 1.0, 0.0));
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

export const pieceLightFragment = /* glsl */ `
  uniform sampler2D uMap;      // the cut-out photograph, with alpha
  uniform vec2 uTexel;         // 1.0 / texture size, for neighbour samples
  uniform vec3 uLightPos;      // the lamp, in world space
  uniform vec3 uLightColor;    // warm white
  uniform float uRelief;       // how strongly brightness becomes surface slope
  uniform float uSpecular;     // highlight strength
  uniform vec3 uMetalTint;     // silver or antique gold, tints the highlight only
  uniform float uAmbient;      // light the piece keeps when the lamp is far away
  uniform float uFade;         // 0 → 1 as the piece appears

  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vNormalW;
  varying vec3 vTangentW;
  varying vec3 vBitangentW;

  float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

  void main() {
    vec4 base = texture2D(uMap, vUv);
    if (base.a < 0.02) discard;

    // Height from brightness, sampled one texel either side (2 texels for stability on phones).
    vec2 d = uTexel * 2.0;
    float hL = luma(texture2D(uMap, vUv - vec2(d.x, 0.0)).rgb);
    float hR = luma(texture2D(uMap, vUv + vec2(d.x, 0.0)).rgb);
    float hD = luma(texture2D(uMap, vUv - vec2(0.0, d.y)).rgb);
    float hU = luma(texture2D(uMap, vUv + vec2(0.0, d.y)).rgb);
    vec2 slope = vec2(hR - hL, hU - hD) * uRelief;

    // Perturbed normal in world space.
    vec3 n = normalize(vNormalW - slope.x * vTangentW - slope.y * vBitangentW);

    vec3 L = normalize(uLightPos - vWorldPos);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 H = normalize(L + V);

    float diffuse = max(dot(n, L), 0.0);
    // Distance falloff, gentle: a lamp a metre away, not a sun.
    float dist = length(uLightPos - vWorldPos);
    float falloff = 1.0 / (1.0 + 0.18 * dist * dist);

    // Highlights only where the photo is bright, i.e. polished metal or a stone's face.
    float metalMask = smoothstep(0.35, 0.85, luma(base.rgb));
    float spec = pow(max(dot(n, H), 0.0), 64.0) * uSpecular * metalMask;

    vec3 lit = base.rgb * (uAmbient + diffuse * falloff * 1.15) * uLightColor
             + spec * falloff * mix(vec3(1.0), uMetalTint, 0.55);

    gl_FragColor = vec4(lit, base.a * uFade);
    #include <colorspace_fragment>
  }
`

/**
 * SOFT SHADOW: the piece's own silhouette, blurred and pushed away from the lamp,
 * drawn on the velvet just under it so the piece rests on the tray instead of
 * floating above it.
 */
export const pieceShadowFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec2 uOffset;   // uv shift away from the lamp
  uniform float uBlur;    // in uv units
  uniform float uOpacity;
  uniform vec3 uInk;      // shadow colour (--shadow-ink)
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv + uOffset;
    float a = 0.0;
    // 3×3 taps at two radii: cheap and smooth enough at this size.
    for (int x = -1; x <= 1; x++) {
      for (int y = -1; y <= 1; y++) {
        vec2 o = vec2(float(x), float(y));
        a += texture2D(uMap, uv + o * uBlur).a;
        a += texture2D(uMap, uv + o * uBlur * 2.2).a;
      }
    }
    a /= 18.0;
    gl_FragColor = vec4(uInk, a * uOpacity);
  }
`

export const simpleVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export type PieceColors = { lamp: THREE.Color; specSilver: THREE.Color; specGold: THREE.Color; shadowInk: THREE.Color }

export function makePieceMaterial(map: THREE.Texture, gold: boolean, p: PieceColors) {
  const img = map.image as { width?: number; height?: number } | undefined
  return new THREE.ShaderMaterial({
    vertexShader: pieceLightVertex,
    fragmentShader: pieceLightFragment,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uMap: { value: map },
      uTexel: { value: new THREE.Vector2(1 / (img?.width ?? 960), 1 / (img?.height ?? 960)) },
      uLightPos: { value: new THREE.Vector3(0, 2, 0) },
      uLightColor: { value: p.lamp.clone() },
      uRelief: { value: 3.2 },
      uSpecular: { value: 1.1 },
      uMetalTint: { value: (gold ? p.specGold : p.specSilver).clone() },
      uAmbient: { value: 0.42 },
      uFade: { value: 0 },
    },
  })
}

export function makeShadowMaterial(map: THREE.Texture, p: PieceColors) {
  return new THREE.ShaderMaterial({
    vertexShader: simpleVertex,
    fragmentShader: pieceShadowFragment,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uMap: { value: map },
      uOffset: { value: new THREE.Vector2(-0.015, 0.02) },
      uBlur: { value: 0.012 },
      uOpacity: { value: 0 },
      uInk: { value: p.shadowInk.clone() },
    },
  })
}
