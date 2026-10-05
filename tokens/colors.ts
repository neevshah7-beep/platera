/**
 * THE PALETTE: Noir Champagne. Mirrors the custom properties in src/app/globals.css,
 * which stay the runtime source (the WebGL world reads them with getComputedStyle, so the
 * DOM and the 3D share one palette). These constants are for build-time code (LUT
 * authoring, the asset pipeline, tests) and as fallbacks.
 *
 * Obsidian velvet is the ground so metal and stones carry all the light. Gold and silver
 * are materials, never flat fills. Garnet appears only in the Chamber (bridal).
 */
export const colors = {
  ground: '#0b0a09',
  groundRaised: '#16130f',
  ivory: '#f6f1e7',
  ink: '#f3ede2',
  inkMuted: '#a89f91',
  argent: '#b9bec4',
  argentShadow: '#5e646a',
  argentLight: '#f1f4f7',
  gold: '#c9a46a',
  goldShadow: '#6e5229',
  goldLight: '#efd9a9',
  ice: '#dfeaf5',
  ruby: '#8e1a2e',
  rubyBright: '#d24a63',
  focus: '#efd9a9',
  lamp: '#fff1dc',
  fill: '#dfe8ff',
  specSilver: '#f2f6fa',
  specGold: '#f3d79c',
  velvet: '#120f0d',
  velvetSheen: '#6b5a46',
  shadowInk: '#000000',
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
