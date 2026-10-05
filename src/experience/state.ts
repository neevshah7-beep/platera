'use client'

import { useSyncExternalStore } from 'react'

/**
 * Shared state between the scrolling page and the 3D gallery behind it.
 * Per-frame values (progress, pointer) are mutated without notifying React;
 * values the UI shows (mood, ready, station) notify subscribers.
 */
export type Mood = 'studio' | 'daylight' | 'diya' | 'evening' | 'mandap'

export type TrayPiece = { slug: string; name: string; src: string; width: number; height: number; price: string; gold: boolean }

type State = {
  /** 0 → STATIONS.length - 1, eased by the scroll driver. */
  progress: number
  pointer: { x: number; y: number }
  mood: Mood
  ready: boolean
  tier: 'high' | 'mid' | 'low'
  hovered: string | null
}

let state: State = { progress: 0, pointer: { x: 0, y: 0 }, mood: 'studio', ready: false, tier: 'mid', hovered: null }
const listeners = new Set<() => void>()

export const xp = {
  get: () => state,
  mutate(patch: Partial<State>) {
    state = { ...state, ...patch }
  },
  set(patch: Partial<State>) {
    state = { ...state, ...patch }
    if ('ready' in patch) document.documentElement.dataset.worldReady = patch.ready ? '1' : '0'
    listeners.forEach((l) => l())
  },
  subscribe(l: () => void) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
}

export function useXp<T>(select: (s: State) => T): T {
  return useSyncExternalStore(xp.subscribe, () => select(state), () => select(state))
}
