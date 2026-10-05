'use client'

import { Room } from '@/world/Room'
import type { TrayPiece } from '@/world/state'

/** Bridal rooms are lit as the Chamber; every other collection is a Tray. */
const CHAMBERS = new Set(['mangalsutras'])

export type Station =
  | { kind: 'room'; key: string; pieces: TrayPiece[] }
  | { kind: 'lamp'; piece: TrayPiece; weight: string | null }

/** A page names its room in the world. Thin adapter over <Room> for the collection and piece pages. */
export function WorldStation({ station }: { station: Station }) {
  if (station.kind === 'lamp') return <Room state={{ key: 'lamp', piece: station.piece, weight: station.weight }} />
  return <Room state={CHAMBERS.has(station.key) ? { key: 'chamber', id: station.key, pieces: station.pieces } : { key: 'tray', id: station.key, pieces: station.pieces }} />
}

/**
 * A window onto the world inside a page: the poster (a real <img>, the LCP element) shows
 * until the world has drawn, then gives way to the lit piece behind the page.
 */
export { WorldWindow } from '@/world/WorldWindow'
