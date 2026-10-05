import * as THREE from 'three'

/**
 * THE GRADE (Experience Bible §2.8): a 32³ 3D LUT authored as a function, in display
 * (sRGB) space. What it does, in order:
 *   1. a gentle filmic S-curve on luminance (toe lifted a hair so obsidian keeps detail);
 *   2. split-tone: shadows pushed toward a cool blue-steel, highlights toward warm
 *      champagne, crossing over at mid-grey, so gold separates from the ground;
 *   3. warm hues (gold, the 30–60° band) gain a touch of saturation; everything else
 *      loses a little, so metal and garnet are the only colour on screen;
 *   4. near-white highlights are kept neutral-cool, so diamond fire reads white, not cream.
 */
export function makeGradeLut(size = 32): THREE.Data3DTexture {
  const data = new Uint8Array(size * size * size * 4)
  const cool = [0.86, 0.94, 1.1]
  const warm = [1.07, 1.0, 0.88]
  let i = 0
  for (let b = 0; b < size; b++)
    for (let g = 0; g < size; g++)
      for (let r = 0; r < size; r++) {
        let R = r / (size - 1), G = g / (size - 1), B = b / (size - 1)
        const L = 0.2126 * R + 0.7152 * G + 0.0722 * B

        // 1. S-curve on luminance, applied as a ratio to keep hue.
        const s = L < 0.5 ? 0.012 + 2 * (L * L) * 0.97 + L * 0.03 : 1 - 2 * (1 - L) * (1 - L) * 0.98
        const k = L > 1e-4 ? Math.min(3, s / L) : 1
        R *= k; G *= k; B *= k

        // 2. Split-tone by luminance.
        const shadow = Math.max(0, 1 - L / 0.5) ** 1.4
        const high = Math.max(0, (L - 0.5) / 0.5) ** 1.2
        R *= 1 + (cool[0] - 1) * shadow + (warm[0] - 1) * high
        G *= 1 + (cool[1] - 1) * shadow + (warm[1] - 1) * high
        B *= 1 + (cool[2] - 1) * shadow + (warm[2] - 1) * high

        // 3. Hue-selective saturation.
        const max = Math.max(R, G, B), min = Math.min(R, G, B)
        const chroma = max - min
        let hue = 0
        if (chroma > 1e-5) {
          if (max === R) hue = ((G - B) / chroma) % 6
          else if (max === G) hue = (B - R) / chroma + 2
          else hue = (R - G) / chroma + 4
          hue *= 60
          if (hue < 0) hue += 360
        }
        const goldBand = Math.max(0, 1 - Math.abs(hue - 42) / 26)
        const garnetBand = Math.max(0, 1 - Math.min(Math.abs(hue - 350), Math.abs(hue + 10)) / 18)
        const sat = 0.9 + 0.32 * goldBand + 0.18 * garnetBand
        const Y = 0.2126 * R + 0.7152 * G + 0.0722 * B
        R = Y + (R - Y) * sat
        G = Y + (G - Y) * sat
        B = Y + (B - Y) * sat

        // 4. Keep the top end neutral-cool for diamond fire.
        const top = Math.max(0, (Y - 0.88) / 0.12)
        R = R * (1 - top) + (Y * 0.985) * top
        G = G * (1 - top) + (Y * 0.995) * top
        B = B * (1 - top) + (Y * 1.02) * top

        data[i++] = Math.round(Math.min(1, Math.max(0, R)) * 255)
        data[i++] = Math.round(Math.min(1, Math.max(0, G)) * 255)
        data[i++] = Math.round(Math.min(1, Math.max(0, B)) * 255)
        data[i++] = 255
      }
  const tex = new THREE.Data3DTexture(data, size, size, size)
  tex.format = THREE.RGBAFormat
  tex.type = THREE.UnsignedByteType
  tex.minFilter = tex.magFilter = THREE.LinearFilter
  tex.wrapS = tex.wrapT = tex.wrapR = THREE.ClampToEdgeWrapping
  tex.unpackAlignment = 1
  tex.needsUpdate = true
  return tex
}
