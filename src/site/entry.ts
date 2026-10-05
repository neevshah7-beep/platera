'use client'

import { useSyncExternalStore } from 'react'

/** Shared between the entry gate and the scenes: load progress and whether the visitor has entered. */
type Entry = { progress: number; ready: boolean; entered: boolean; sound: boolean }
let state: Entry = { progress: 0, ready: false, entered: false, sound: false }
const listeners = new Set<() => void>()

export const entry = {
  get: () => state,
  set(patch: Partial<Entry>) {
    state = { ...state, ...patch }
    listeners.forEach((l) => l())
  },
  subscribe(l: () => void) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
}

export function useEntry<T>(select: (s: Entry) => T): T {
  return useSyncExternalStore(entry.subscribe, () => select(state), () => select(state))
}
