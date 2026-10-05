'use client'

import { useSyncExternalStore } from 'react'

/**
 * The world's shared state: one store between the DOM pages and the single persistent
 * canvas. Per-frame values (progress, velocity, pointer) are mutated without notifying
 * React; values the UI renders (room, mood, ready, saved…) notify subscribers.
 */
export type Mood = 'studio' | 'daylight' | 'diya' | 'evening' | 'mandap'
export type Tier = 1 | 2 | 3

export type TrayPiece = {
  slug: string
  name: string
  src: string
  width: number
  height: number
  price: string
  gold: boolean
  /** Per-photo normal and depth/roughness maps exist (scripts/make-maps.py). */
  maps?: boolean
}

export type HomeData = {
  tray: TrayPiece[]
  drawer: TrayPiece[]
  weighed: { piece: TrayPiece; weight: string | null } | null
  neck: TrayPiece | null
  bridal: TrayPiece[]
  festival: 'none' | 'diwali' | 'wedding'
}

/** Which room the camera is in. Every route maps to one. */
export type RoomState =
  | ({ key: 'home' } & HomeData)
  | { key: 'tray'; id: string; pieces: TrayPiece[] }
  | { key: 'lamp'; piece: TrayPiece; weight: string | null }
  | { key: 'chamber'; id: string; pieces: TrayPiece[] }
  | { key: 'quiet' }

type State = {
  room: RoomState
  /** Home: station index. Tray/chamber: piece index. Lamp: 0 → 1 (piece → ledger). */
  progress: number
  /** Scroll velocity in viewport-heights per second, smoothed. Feeds blur, CA, skew. */
  velocity: number
  pointer: { x: number; y: number }
  /** Pointer held down (the loupe deepens; the lamp is being dragged). */
  pressing: boolean
  mood: Mood
  ready: boolean
  tier: Tier
  hovered: string | null
  /** A piece carried from the tray to the lamp (shared-element flight). */
  flight: { slug: string; from: [number, number, number]; rot: number; size: number } | null
  /** The Threshold has played this session. */
  entered: boolean
  vaultOpen: boolean
  saved: string[]
  sound: boolean
  /** Rack focus: 0 = the piece, 1 = the ledger beside it. */
  rack: number
  reduced: boolean
}

let state: State = {
  room: { key: 'quiet' },
  progress: 0,
  velocity: 0,
  pointer: { x: 0, y: 0 },
  pressing: false,
  mood: 'studio',
  ready: false,
  tier: 2,
  hovered: null,
  flight: null,
  entered: false,
  vaultOpen: false,
  saved: [],
  sound: false,
  rack: 0,
  reduced: false,
}
const listeners = new Set<() => void>()

export const xp = {
  get: () => state,
  /** Per-frame values: no React notification. */
  mutate(patch: Partial<State>) {
    state = { ...state, ...patch }
  },
  set(patch: Partial<State>) {
    state = { ...state, ...patch }
    if ('ready' in patch && typeof document !== 'undefined') {
      document.documentElement.dataset.worldReady = patch.ready ? '1' : '0'
    }
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
