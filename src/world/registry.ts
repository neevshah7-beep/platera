'use client'

import * as THREE from 'three'
import type { RoomState } from './state'

/**
 * SCENE REGISTRY. Every room that is mounted in the persistent scene registers here: its
 * key, its anchor in world space, and how to pose the camera inside it for a given scroll
 * progress. The camera orchestrator and the transition system only ever talk to rooms
 * through this registry, so rooms can mount and unmount while the renderer lives on.
 */
export type RoomKey = RoomState['key']

export type Pose = { position: THREE.Vector3; target: THREE.Vector3; fov: number; focus: number }

export type RoomEntry = {
  key: RoomKey
  anchor: THREE.Vector3
  /** Writes the camera pose for this progress into `out` (world space). No allocation. */
  pose: (progress: number, aspect: number, out: Pose) => void
  /** Rooms one dolly apart are joined by a camera move; others by the liquid-metal wipe. */
  adjacent?: RoomKey[]
}

/**
 * Where each room stands in the one continuous space (metres). The home walk runs down
 * −Z from the origin; the Tray runway runs down −Z at x = 40 with the Lamp at its head,
 * so the push-in is one dolly; the Chamber lies across the hall at x = −40.
 */
export const ANCHORS: Record<RoomKey, [number, number, number]> = {
  home: [0, 0, 0],
  tray: [40, 0, 0],
  lamp: [40, 0, 2.6],
  chamber: [-40, 0, 0],
  quiet: [0, 0, 40],
}

const rooms = new Map<RoomKey, RoomEntry>()
let created = 0

export const registry = {
  register(entry: RoomEntry) {
    rooms.set(entry.key, entry)
    return () => {
      if (rooms.get(entry.key) === entry) rooms.delete(entry.key)
    }
  },
  get: (key: RoomKey) => rooms.get(key),
  keys: () => Array.from(rooms.keys()),
  /** Called by the renderer factory; must stay at exactly 1 for the session (T1). */
  rendererCreated() {
    created += 1
    console.info(`[world] renderer created (${created})`)
    return created
  },
}

export function makePose(): Pose {
  return { position: new THREE.Vector3(), target: new THREE.Vector3(), fov: 34, focus: 1 }
}
