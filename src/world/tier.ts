'use client'

import { useXp, xp, type Tier } from './state'

/**
 * DEVICE TIERING (Experience Bible §10). Fidelity is reduced, features never removed.
 *   3  desktop GPU   full chain, DPR 2, transmission samples 10, volumetrics 32 steps
 *   2  good mobile   no SSR / motion blur, DPR 1.5, samples 4, volumetrics 16 steps
 *   1  low end       matcaps, baked refraction, grain + vignette + bloom, DPR 1
 * First guess from the GPU renderer string; the benchmark (bench.ts) then confirms,
 * demotes or promotes. `?tier=1|2|3` forces a tier (for verification screenshots).
 */
export function guessTier(gl: WebGL2RenderingContext): Tier {
  const forced = new URLSearchParams(location.search).get('tier')
  if (forced === '1' || forced === '2' || forced === '3') return Number(forced) as Tier
  const ext = gl.getExtension('WEBGL_debug_renderer_info')
  const renderer = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)).toLowerCase()
  const coarse = matchMedia('(pointer: coarse)').matches
  if (/swiftshader|llvmpipe|software|microsoft basic/.test(renderer)) return 1
  if (/rtx|radeon rx|radeon pro|geforce gtx (9|1[0-9])|apple m[1-9]|arc a/.test(renderer) && !coarse) return 3
  if (/adreno \(tm\) (6[4-9]|7)|mali-g(7|6[1-9])|apple gpu|apple a1[4-9]/.test(renderer)) return 2
  if (/intel/.test(renderer) && !coarse) return 2
  if (/adreno|mali|powervr/.test(renderer)) return 1
  return coarse ? 2 : 3
}

export function isForcedTier() {
  return typeof location !== 'undefined' && /[?&]tier=[123]/.test(location.search)
}

export const useTier = () => useXp((s) => s.tier)
export const getTier = () => xp.get().tier

/** The station components predate numeric tiers. */
export function tierName(t: Tier): 'high' | 'mid' | 'low' {
  return t === 3 ? 'high' : t === 2 ? 'mid' : 'low'
}

export const TIER = {
  dpr: { 1: [1, 1], 2: [1, 1.5], 3: [1, 2] } as Record<Tier, [number, number]>,
  transmissionSamples: { 1: 0, 2: 4, 3: 10 } as Record<Tier, number>,
  volumetricSteps: { 1: 0, 2: 16, 3: 32 } as Record<Tier, number>,
  particles: { 1: 0, 2: 0.5, 3: 1 } as Record<Tier, number>,
}
