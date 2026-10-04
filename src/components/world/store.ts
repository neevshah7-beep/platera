'use client'

import { useSyncExternalStore } from 'react'

/**
 * The shared state between the HTML pages and the one 3D world behind them.
 * Pages announce which station they are (<WorldStation>); the scroll position
 * becomes a single number the camera follows. No React re-render happens per frame:
 * the canvas reads `world.get()` inside useFrame.
 */
export type PieceRef = {
  slug: string
  name: string
  src: string
  width: number
  height: number
  price: string
  gold: boolean
}

export type Alcove = { slug: string; name: string; pieces: PieceRef[] }

export type Station =
  | { kind: 'home'; alcoves: Alcove[] }
  | { kind: 'room'; key: string; pieces: PieceRef[] }
  | { kind: 'lamp'; piece: PieceRef; weight: string | null }
  | { kind: 'quiet' }

type WorldState = {
  station: Station
  /** Scroll through the current page's 3D sections, 0 → number of sections. */
  scroll: number
  /** Pointer in -1..1, used to move the light and nudge the camera. */
  pointer: { x: number; y: number }
  /** Piece the visitor is pointing at in a room or the corridor. */
  hovered: string | null
  /** True once the 3D world has drawn its first frame. Pages hide their poster then. */
  ready: boolean
  tier: 'high' | 'mid' | 'low'
  /** Light Moods on the product page. 'studio' is the house's own lamp. */
  mood: Mood
}

export type Mood = 'studio' | 'daylight' | 'diya' | 'evening' | 'mandap'

let state: WorldState = {
  station: { kind: 'quiet' },
  scroll: 0,
  pointer: { x: 0, y: 0 },
  hovered: null,
  ready: false,
  tier: 'mid',
  mood: 'studio',
}
const listeners = new Set<() => void>()

export const world = {
  get: () => state,
  /** For values read every frame (scroll, pointer): no notification, no re-render. */
  mutate(patch: Partial<WorldState>) {
    state = { ...state, ...patch }
  },
  /** For values React components care about (station, ready, hovered). */
  set(patch: Partial<WorldState>) {
    state = { ...state, ...patch }
    if ('ready' in patch) document.documentElement.dataset.worldReady = patch.ready ? '1' : '0'
    listeners.forEach((l) => l())
  },
  subscribe(l: () => void) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
}

export function useWorld<T>(select: (s: WorldState) => T): T {
  return useSyncExternalStore(world.subscribe, () => select(state), () => select(state))
}
