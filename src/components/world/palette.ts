'use client'

import * as THREE from 'three'

/**
 * The 3D world's colours, read from the CSS tokens in globals.css so there is one
 * palette for the HTML and the WebGL. Changing a token there recolours the house.
 */
export type WorldPalette = {
  velvet: THREE.Color
  groundRaised: THREE.Color
  velvetSheen: THREE.Color
  stone: THREE.Color
  silver: THREE.Color
  gold: THREE.Color
  lamp: THREE.Color
  specSilver: THREE.Color
  specGold: THREE.Color
  shadowInk: THREE.Color
  ivory: THREE.Color
  moodDaylight: THREE.Color
  moodDiya: THREE.Color
  moodEvening: THREE.Color
  moodMandap: THREE.Color
  moodMandapRose: THREE.Color
}

const TOKENS: Record<keyof WorldPalette, string> = {
  velvet: '--ground',
  groundRaised: '--ground-raised',
  velvetSheen: '--velvet-sheen',
  stone: '--stone',
  silver: '--argent',
  gold: '--gold',
  lamp: '--lamp',
  specSilver: '--spec-silver',
  specGold: '--spec-gold',
  shadowInk: '--shadow-ink',
  ivory: '--ivory',
  moodDaylight: '--mood-daylight',
  moodDiya: '--mood-diya',
  moodEvening: '--mood-evening',
  moodMandap: '--mood-mandap',
  moodMandapRose: '--mood-mandap-rose',
}

let cached: WorldPalette | null = null

export function readPalette(): WorldPalette {
  if (cached) return cached
  const css = getComputedStyle(document.documentElement)
  cached = Object.fromEntries(
    Object.entries(TOKENS).map(([k, v]) => [k, new THREE.Color(css.getPropertyValue(v).trim() || 'white')]),
  ) as WorldPalette
  return cached
}
