/**
 * THE PALETTE — Ivory Gallery. Mirrors the custom properties in src/app/globals.css,
 * which remain the runtime source (the WebGL world reads them with getComputedStyle so the
 * DOM and the 3D share one palette). These constants are for build-time code (LUT
 * authoring, the asset pipeline, tests) and as fallbacks.
 *
 * The metal rule: gold and silver are materials, never flat fills.
 */
export const colors = {
  ground: '#f4efe7',
  groundRaised: '#eae3d7',
  ivory: '#fbf8f3',
  ink: '#1c1b19',
  inkMuted: '#655e55',
  argent: '#7a7f84',
  argentShadow: '#4f5357',
  argentLight: '#e6e8ea',
  gold: '#a8844f',
  goldShadow: '#6f5530',
  goldLight: '#e9d5ac',
  /** Ruby / garnet: bridal (the Chamber) and critical UI only. */
  ruby: '#8e2436',
  focus: '#1f4d46',
  lamp: '#fff8ee',
  specSilver: '#eef2f5',
  specGold: '#e2c48c',
  shadowInk: '#5a5248',
  mood: {
    daylight: '#f4f7ff',
    diya: '#ffb25e',
    evening: '#ffd9b8',
    mandap: '#ffc36b',
    mandapRose: '#ff8a7a',
  },
} as const

/** Read a palette token at runtime (browser), falling back to the constant above. */
export function cssToken(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}
